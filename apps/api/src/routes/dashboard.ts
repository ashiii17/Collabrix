import { Router } from "express";
import { prisma } from "@collabrix/db";
import { requireAuth } from "../middleware/auth.js";

export const dashboardRouter = Router();

dashboardRouter.use(requireAuth);

dashboardRouter.get("/", async (req, res) => {
  const [roomsCreated, totalSessions, executions, submissions] = await Promise.all([
    prisma.room.count({ where: { ownerId: req.user!.id } }),
    prisma.roomMember.count({ where: { userId: req.user!.id } }),
    prisma.codeExecution.count({ where: { userId: req.user!.id } }),
    prisma.submission.count({ where: { userId: req.user!.id } })
  ]);

  res.json({
    stats: {
      roomsCreated,
      totalSessions,
      executions,
      submissions,
      timeSpentCodingMinutes: Math.max(0, executions * 12),
      languagesUsed: ["javascript", "python", "java", "cpp"]
    }
  });
});
