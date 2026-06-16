import { Router } from "express";
import { prisma } from "@collabrix/db";
import { requireAuth } from "../middleware/auth.js";
import { AiService } from "../services/ai.js";

export const aiRouter = Router();
const ai = new AiService();

aiRouter.use(requireAuth);

aiRouter.post("/code-review", async (req, res) => {
  const output = await ai.reviewCode(req.body);
  await prisma.aiReview.create({ data: { userId: req.user!.id, subject: "code-review", input: req.body, output: output as object } });
  res.json({ review: output });
});

aiRouter.post("/interview-feedback", async (req, res) => {
  const output = await ai.interviewFeedback(req.body);
  await prisma.aiReview.create({ data: { userId: req.user!.id, subject: "interview-feedback", input: req.body, output: output as object } });
  res.json({ feedback: output });
});
