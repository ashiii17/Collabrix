import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { CodeExecutionInput } from "@collabrix/shared";
import { env } from "../config/env.js";

const images: Record<string, string> = {
  python: "python:3.12-alpine",
  javascript: "node:22-alpine",
  typescript: "node:22-alpine",
  java: "eclipse-temurin:21-alpine",
  cpp: "gcc:14"
};

export class CodeRunnerService {
  async execute(input: CodeExecutionInput) {
    if (!env.DOCKER_RUNNER_ENABLED) {
      return this.simulate(input);
    }

    const started = Date.now();
    const workdir = await mkdtemp(join(tmpdir(), "collabrix-run-"));

    try {
      const { fileName, command } = await this.prepare(workdir, input);
      const containerName = `collabrix-${randomUUID()}`;
      const { stdout, stderr, exitCode } = await runProcess(
        "docker",
        [
          "run",
          "--name",
          containerName,
          "--rm",
          "--network",
          "none",
          "--cpus",
          "1",
          "--memory",
          "256m",
          "--pids-limit",
          "64",
          "--read-only",
          "-v",
          `${workdir}:/workspace:ro`,
          "-w",
          "/workspace",
          images[input.language],
          "sh",
          "-lc",
          command
        ],
        input.stdin,
        5000
      );

      return { stdout, stderr, exitCode, durationMs: Date.now() - started, fileName };
    } catch (error) {
      const err = error as { stdout?: string; stderr?: string; code?: number; killed?: boolean };
      return {
        stdout: err.stdout ?? "",
        stderr: err.killed ? "Execution timed out." : err.stderr ?? "Execution failed.",
        exitCode: typeof err.code === "number" ? err.code : 1,
        durationMs: Date.now() - started
      };
    } finally {
      await rm(workdir, { recursive: true, force: true });
    }
  }

  private async prepare(workdir: string, input: CodeExecutionInput) {
    if (input.language === "python") {
      await writeFile(join(workdir, "main.py"), input.code);
      return { fileName: "main.py", command: "python main.py" };
    }

    if (input.language === "javascript") {
      await writeFile(join(workdir, "main.js"), input.code);
      return { fileName: "main.js", command: "node main.js" };
    }

    if (input.language === "java") {
      await writeFile(join(workdir, "Main.java"), input.code);
      return { fileName: "Main.java", command: "javac Main.java && java Main" };
    }

    await writeFile(join(workdir, "main.cpp"), input.code);
    return { fileName: "main.cpp", command: "g++ main.cpp -O2 -std=c++20 -o main && ./main" };
  }

  private simulate(input: CodeExecutionInput) {
    return {
      stdout: `Docker runner disabled. Received ${input.language} program (${input.code.length} chars).`,
      stderr: "",
      exitCode: 0,
      durationMs: 1
    };
  }
}

function runProcess(command: string, args: string[], stdin: string, timeoutMs: number) {
  return new Promise<{ stdout: string; stderr: string; exitCode: number }>((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    let settled = false;

    const timeout = setTimeout(() => {
      settled = true;
      child.kill("SIGKILL");
      reject({ stdout, stderr, killed: true });
    }, timeoutMs);

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
      if (stdout.length > 1024 * 1024) child.kill("SIGKILL");
    });

    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
      if (stderr.length > 1024 * 1024) child.kill("SIGKILL");
    });

    child.on("error", (error) => {
      if (!settled) {
        settled = true;
        clearTimeout(timeout);
        reject({ stdout, stderr: error.message, code: 1 });
      }
    });

    child.on("close", (code) => {
      if (!settled) {
        settled = true;
        clearTimeout(timeout);
        resolve({ stdout, stderr, exitCode: code ?? 1 });
      }
    });

    child.stdin.end(stdin);
  });
}
