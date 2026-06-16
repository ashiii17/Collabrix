import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "@collabrix/db";
import { registerUserSchema } from "@collabrix/shared";

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  const parsed = registerUserSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid registration input",
      issues: parsed.error.flatten().fieldErrors,
    });
  }

  const { email, name, password } = parsed.data;

  const existingUser = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existingUser) {
    return res.status(409).json({ error: "A user with this email already exists." });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: { email, name, passwordHash },
    select: { id: true, email: true, name: true, createdAt: true },
  });

  res.status(201).json({ user });
});
