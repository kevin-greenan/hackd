import { describe, expect, it } from "vitest";
import {
  isRuntimeImageAllowed,
  parseDockerRuntimeConfig,
  publicChallengeUrl
} from "@/lib/core/challenge-runtime";

describe("docker runtime config", () => {
  it("parses a minimal docker web runtime config with safe defaults", () => {
    expect(
      parseDockerRuntimeConfig({
        type: "docker_web",
        image: "nginx:alpine"
      })
    ).toEqual({
      type: "docker_web",
      image: "nginx:alpine",
      containerPort: 80,
      memoryMb: 128,
      cpuCount: 0.25,
      ttlMinutes: 30,
      env: {}
    });
  });

  it("rejects unsafe resource limits", () => {
    expect(
      parseDockerRuntimeConfig({
        type: "docker_web",
        image: "nginx:alpine",
        memoryMb: 4096
      })
    ).toBeNull();
    expect(
      parseDockerRuntimeConfig({
        type: "docker_web",
        image: "nginx:alpine",
        cpuCount: 4
      })
    ).toBeNull();
  });

  it("formats the public challenge URL from configured host and runner port", () => {
    expect(publicChallengeUrl(32768)).toBe("http://localhost:32768");
  });

  it("allows exact and prefix-matched runtime images", () => {
    expect(isRuntimeImageAllowed("nginx:alpine", ["nginx:alpine"])).toBe(true);
    expect(isRuntimeImageAllowed("ghcr.io/acme/lab:latest", ["ghcr.io/acme/*"])).toBe(true);
    expect(isRuntimeImageAllowed("docker.io/library/nginx:latest", ["nginx:alpine"])).toBe(false);
    expect(isRuntimeImageAllowed("ghcr.io/other/lab:latest", ["ghcr.io/acme/*"])).toBe(false);
  });
});
