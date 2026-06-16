import { Router } from "express";
import { prisma } from "@collabrix/db";
import { requireAuth } from "../middleware/auth.js";

export const contestsRouter = Router();

contestsRouter.use(requireAuth);

contestsRouter.get("/", async (_req, res) => {
  const contests = await prisma.contest.findMany({ orderBy: { startsAt: "desc" } });
  res.json({ contests });
});

contestsRouter.post("/", async (req, res) => {
  const contest = await prisma.contest.create({ data: req.body });
  res.status(201).json({ contest });
});
