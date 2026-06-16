import { Router } from "express";
import { prisma } from "@collabrix/db";
import { codeExecutionSchema } from "@collabrix/shared";
import { requireAuth } from "../middleware/auth.js";
import { CodeRunnerService } from "../services/codeRunner.js";
import { recordReplayEvent } from "../services/replay.js";

export const executionRouter = Router();
const runner = new CodeRunnerService();

executionRouter.use(requireAuth);

executionRouter.post("/:roomId", async (req, res) => {
  const input = codeExecutionSchema.parse(req.body);
  const result = await runner.execute(input);
  const execution = await prisma.codeExecution.create({
    data: {
      roomId: req.params.roomId,
      userId: req.user!.id,
      language: input.language,
      code: input.code,
      stdin: input.stdin,
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
      durationMs: result.durationMs
    }
  });

  await recordReplayEvent({ roomId: req.params.roomId, userId: req.user!.id, type: "code.executed", payload: execution });
  res.json({ execution });
});
