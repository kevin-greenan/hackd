import http from "http";

const DOCKER_SOCKET = process.env.DOCKER_SOCKET || "/var/run/docker.sock";
const PORT = Number(process.env.RUNTIME_RUNNER_PORT || 4010);
const RUNTIME_NETWORK = process.env.RUNTIME_NETWORK || "hackd-runtime";

function jsonResponse(res, statusCode, body) {
  const payload = JSON.stringify(body);
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(payload)
  });
  res.end(payload);
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      if (chunks.length === 0) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function dockerRequest({ method = "GET", path, body }) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : undefined;
    const request = http.request(
      {
        socketPath: DOCKER_SOCKET,
        method,
        path,
        headers: payload
          ? {
              "Content-Type": "application/json",
              "Content-Length": Buffer.byteLength(payload)
            }
          : undefined
      },
      (response) => {
        const chunks = [];
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          const ok = response.statusCode && response.statusCode >= 200 && response.statusCode < 300;

          if (!ok) {
            reject(new Error(text || `Docker API returned ${response.statusCode}`));
            return;
          }

          if (!text.trim()) {
            resolve(null);
            return;
          }

          try {
            resolve(JSON.parse(text));
          } catch {
            resolve(text);
          }
        });
      }
    );

    request.on("error", reject);

    if (payload) {
      request.write(payload);
    }

    request.end();
  });
}

async function ensureNetwork() {
  try {
    await dockerRequest({ path: `/networks/${encodeURIComponent(RUNTIME_NETWORK)}` });
  } catch {
    await dockerRequest({
      method: "POST",
      path: "/networks/create",
      body: {
        Name: RUNTIME_NETWORK,
        Driver: "bridge",
        Internal: false,
        Labels: {
          "hackd.runtime": "true"
        }
      }
    });
  }
}

async function pullImage(image) {
  await dockerRequest({
    method: "POST",
    path: `/images/create?fromImage=${encodeURIComponent(image)}`
  });
}

function envPairs(env) {
  return Object.entries(env || {}).map(([key, value]) => `${key}=${String(value)}`);
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function containerLogs(containerId) {
  const logs = await dockerRequest({
    path: `/containers/${containerId}/logs?stdout=1&stderr=1&tail=80`
  }).catch(() => "");

  return String(logs).replace(/[^\t\n\r -~]/g, "").trim();
}

async function startInstance(input) {
  await ensureNetwork();
  await pullImage(input.image);

  const exposedPort = `${input.containerPort}/tcp`;
  const containerName = `hackd-${input.instanceId}`;
  const created = await dockerRequest({
    method: "POST",
    path: `/containers/create?name=${encodeURIComponent(containerName)}`,
    body: {
      Image: input.image,
      Env: envPairs(input.env),
      Labels: {
        "hackd.runtime": "true",
        "hackd.instanceId": input.instanceId,
        "hackd.expiresAt": input.expiresAt
      },
      ExposedPorts: {
        [exposedPort]: {}
      },
      HostConfig: {
        AutoRemove: false,
        CapDrop: ["ALL"],
        CpuQuota: Math.max(Math.floor(input.cpuCount * 100000), 10000),
        CpuPeriod: 100000,
        Memory: input.memoryMb * 1024 * 1024,
        NetworkMode: RUNTIME_NETWORK,
        PidsLimit: 128,
        PortBindings: {
          [exposedPort]: [
            {
              HostIp: "0.0.0.0",
              HostPort: ""
            }
          ]
        },
        Privileged: false,
        ReadonlyRootfs: true,
        SecurityOpt: ["no-new-privileges"],
        Tmpfs: {
          "/run": "rw,nosuid,nodev,size=8m",
          "/tmp": "rw,nosuid,nodev,size=64m",
          "/var/cache/nginx": "rw,nosuid,nodev,size=32m",
          "/var/run": "rw,nosuid,nodev,size=8m",
          "/var/tmp": "rw,nosuid,nodev,size=64m"
        }
      }
    }
  });

  await dockerRequest({
    method: "POST",
    path: `/containers/${created.Id}/start`
  });

  await sleep(750);

  const inspected = await dockerRequest({
    path: `/containers/${created.Id}/json`
  });

  if (!inspected.State?.Running) {
    const logs = await containerLogs(created.Id);

    await dockerRequest({
      method: "DELETE",
      path: `/containers/${created.Id}?force=true&v=true`
    }).catch(() => null);

    throw new Error(
      logs ? `Challenge container exited during startup: ${logs}` : "Challenge container exited during startup."
    );
  }

  const hostPort = Number(inspected.NetworkSettings.Ports[exposedPort]?.[0]?.HostPort);

  if (!hostPort) {
    throw new Error("Docker did not publish a host port for the challenge instance.");
  }

  return {
    containerId: created.Id,
    hostPort,
    log: `Started ${containerName} from ${input.image} on ${hostPort}`
  };
}

async function stopInstance(input) {
  if (!input.containerId) {
    return { log: "No container to stop." };
  }

  try {
    await dockerRequest({
      method: "POST",
      path: `/containers/${input.containerId}/stop?t=5`
    });
  } catch (error) {
    if (!String(error.message).includes("304")) {
      throw error;
    }
  }

  await dockerRequest({
    method: "DELETE",
    path: `/containers/${input.containerId}?force=true&v=true`
  });

  return {
    log: `Stopped ${input.containerId}`
  };
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "GET" && req.url === "/healthz") {
      jsonResponse(res, 200, { runner: "ok" });
      return;
    }

    if (req.method === "POST" && req.url === "/instances/start") {
      jsonResponse(res, 200, await startInstance(await readJson(req)));
      return;
    }

    if (req.method === "POST" && req.url === "/instances/stop") {
      jsonResponse(res, 200, await stopInstance(await readJson(req)));
      return;
    }

    jsonResponse(res, 404, { error: "not found" });
  } catch (error) {
    jsonResponse(res, 500, {
      error: error instanceof Error ? error.message : "runner error"
    });
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`hackd runtime runner listening on ${PORT}`);
});
