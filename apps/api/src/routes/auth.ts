import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "@collabrix/db";
import { registerUserSchema, loginUserSchema, updateProfileSchema } from "@collabrix/shared";
import { signToken, requireAuth } from "../middleware/auth.js";

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  const parsed = registerUserSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", issues: parsed.error.flatten().fieldErrors });
  }

  const { email, name, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    return res.status(409).json({ error: "A user with this email already exists." });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, name, passwordHash },
    select: { id: true, email: true, name: true, createdAt: true },
  });

  res.status(201).json({ user });
});

authRouter.post("/login", async (req, res) => {
  const parsed = loginUserSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", issues: parsed.error.flatten().fieldErrors });
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true, name: true, passwordHash: true } });
  if (!user) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  const token = signToken({ id: user.id, email: user.email, name: user.name });
  res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { id: true, name: true, email: true, createdAt: true },
  });
  if (!user) {
    return res.status(404).json({ error: "User not found." });
  }
  res.json({ user });
});

const profileSelect = { id: true, name: true, email: true, avatarUrl: true, createdAt: true };

authRouter.get("/profile", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id }, select: profileSelect });
  if (!user) return res.status(404).json({ error: "User not found." });
  res.json({ user });
});

authRouter.patch("/profile", requireAuth, async (req, res) => {
  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", issues: parsed.error.flatten().fieldErrors });
  }

  const data: Record<string, string | null> = {};
  if (parsed.data.name !== undefined) data.name = parsed.data.name;
  if (parsed.data.avatarUrl !== undefined) data.avatarUrl = parsed.data.avatarUrl || null;

  const user = await prisma.user.update({ where: { id: req.user!.id }, data, select: profileSelect });
  res.json({ user });
});
