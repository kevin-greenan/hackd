import { ChallengeType, ContentStatus, InstanceStatus, Role } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../db/prisma";

const DEFAULT_TTL_MINUTES = 30;

const dockerRuntimeConfigSchema = z.object({
  type: z.literal("docker_web"),
  image: z.string().trim().min(3).max(200),
  containerPort: z.number().int().min(1).max(65535).default(80),
  memoryMb: z.number().int().min(64).max(512).default(128),
  cpuCount: z.number().min(0.1).max(1).default(0.25),
  ttlMinutes: z.number().int().min(1).max(120).default(DEFAULT_TTL_MINUTES),
  env: z.record(z.string()).default({})
});

export type DockerRuntimeConfig = z.infer<typeof dockerRuntimeConfigSchema>;

type RunnerStartResult = {
  containerId: string;
  hostPort: number;
  log: string;
};

type RunnerStopResult = {
  log: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function parseDockerRuntimeConfig(value: unknown): DockerRuntimeConfig | null {
  if (!isRecord(value) || value.type !== "docker_web") {
    return null;
  }

  const parsed = dockerRuntimeConfigSchema.safeParse(value);

  return parsed.success ? parsed.data : null;
}

export function publicChallengeUrl(hostPort: number) {
  const publicHost = (process.env.CHALLENGE_PUBLIC_HOST || "http://localhost").replace(/\/$/, "");

  return `${publicHost}:${hostPort}`;
}

function runnerUrl(path: string) {
  const baseUrl = (process.env.RUNTIME_RUNNER_URL || "http://runner:4010").replace(/\/$/, "");

  return `${baseUrl}${path}`;
}

async function runnerPost<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(runnerUrl(path), {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? `Runtime runner returned ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function launchChallengeInstance({
  userId,
  role,
  moduleSlug,
  challengeId
}: {
  userId: string;
  role: Role;
  moduleSlug: string;
  challengeId: string;
}) {
  if (role === Role.ADMIN) {
    throw new Error("Admin preview mode does not launch learner challenge instances.");
  }

  const challenge = await prisma.challenge.findFirst({
    where: {
      id: challengeId,
      type: ChallengeType.DOCKER_WEB,
      status: ContentStatus.PUBLISHED,
      modules: {
        some: {
          module: {
            slug: moduleSlug,
            status: ContentStatus.PUBLISHED,
            assignments: {
              some: {
                OR: [
                  { userId },
                  {
                    group: {
                      memberships: {
                        some: { userId }
                      }
                    }
                  }
                ]
              }
            }
          }
        }
      }
    }
  });

  if (!challenge) {
    throw new Error("Challenge is not available.");
  }

  const config = parseDockerRuntimeConfig(challenge.runtimeConfig);

  if (!config) {
    throw new Error("Challenge runtime is not configured.");
  }

  const existing = await prisma.challengeInstance.findFirst({
    where: {
      userId,
      challengeId,
      status: { in: [InstanceStatus.STARTING, InstanceStatus.RUNNING] },
      expiresAt: { gt: new Date() }
    },
    orderBy: { createdAt: "desc" }
  });

  if (existing?.url) {
    return existing;
  }

  const expiresAt = new Date(Date.now() + config.ttlMinutes * 60 * 1000);
  const instance = await prisma.challengeInstance.create({
    data: {
      userId,
      challengeId,
      status: InstanceStatus.STARTING,
      image: config.image,
      expiresAt
    }
  });

  try {
    const result = await runnerPost<RunnerStartResult>("/instances/start", {
      instanceId: instance.id,
      image: config.image,
      containerPort: config.containerPort,
      memoryMb: config.memoryMb,
      cpuCount: config.cpuCount,
      env: config.env,
      expiresAt: expiresAt.toISOString()
    });

    return prisma.challengeInstance.update({
      where: { id: instance.id },
      data: {
        status: InstanceStatus.RUNNING,
        containerId: result.containerId,
        port: result.hostPort,
        url: publicChallengeUrl(result.hostPort),
        startedAt: new Date(),
        runnerLog: result.log,
        statusMessage: "Challenge instance is running."
      }
    });
  } catch (error) {
    await prisma.challengeInstance.update({
      where: { id: instance.id },
      data: {
        status: InstanceStatus.FAILED,
        stoppedAt: new Date(),
        statusMessage: error instanceof Error ? error.message : "Runtime launch failed."
      }
    });

    throw error;
  }
}

export async function stopChallengeInstance({
  userId,
  role,
  instanceId,
  expired = false
}: {
  userId?: string;
  role: Role;
  instanceId: string;
  expired?: boolean;
}) {
  const instance = await prisma.challengeInstance.findFirst({
    where: {
      id: instanceId,
      ...(role === Role.ADMIN ? {} : { userId })
    }
  });

  if (!instance) {
    throw new Error("Challenge instance not found.");
  }

  let runnerLog = instance.runnerLog;

  if (instance.containerId && instance.status !== InstanceStatus.STOPPED) {
    const result = await runnerPost<RunnerStopResult>("/instances/stop", {
      containerId: instance.containerId
    });
    runnerLog = [runnerLog, result.log].filter(Boolean).join("\n");
  }

  return prisma.challengeInstance.update({
    where: { id: instance.id },
    data: {
      status: expired ? InstanceStatus.EXPIRED : InstanceStatus.STOPPED,
      stoppedAt: new Date(),
      runnerLog,
      statusMessage: expired ? "Challenge instance expired." : "Challenge instance stopped."
    }
  });
}

export async function cleanupExpiredChallengeInstances() {
  const expiredInstances = await prisma.challengeInstance.findMany({
    where: {
      status: { in: [InstanceStatus.STARTING, InstanceStatus.RUNNING] },
      expiresAt: { lte: new Date() }
    }
  });

  const results = [];

  for (const instance of expiredInstances) {
    results.push(
      await stopChallengeInstance({
        role: Role.ADMIN,
        instanceId: instance.id,
        expired: true
      })
    );
  }

  return results;
}

export async function getAdminChallengeInstances(limit = 100) {
  await cleanupExpiredChallengeInstances();

  return prisma.challengeInstance.findMany({
    take: limit,
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      user: {
        select: {
          name: true,
          email: true
        }
      },
      challenge: {
        select: {
          title: true,
          slug: true
        }
      }
    }
  });
}
