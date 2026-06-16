import { Router } from "express";
import { nanoid } from "nanoid";
import { prisma } from "@collabrix/db";
import { createRoomSchema } from "@collabrix/shared";
import { requireAuth } from "../middleware/auth.js";

export const roomsRouter = Router();

roomsRouter.use(requireAuth);

// List rooms owned by user
roomsRouter.get("/", async (req, res) => {
  const rooms = await prisma.room.findMany({
    where: { ownerId: req.user!.id },
    select: { id: true, slug: true, name: true, language: true, createdAt: true, updatedAt: true },
    orderBy: { createdAt: "desc" },
  });
  res.json({ rooms });
});

// Create room
roomsRouter.post("/", async (req, res) => {
  const parsed = createRoomSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", issues: parsed.error.flatten().fieldErrors });
  }
  const room = await prisma.room.create({
    data: {
      slug: nanoid(8),
      name: parsed.data.name,
      language: parsed.data.language,
      mode: parsed.data.mode,
      ownerId: req.user!.id,
    },
    select: { id: true, slug: true, name: true, language: true, createdAt: true, updatedAt: true },
  });
  res.status(201).json({ room });
});

// Get room by roomCode (slug)
roomsRouter.get("/:roomCode", async (req, res) => {
  const room = await prisma.room.findUnique({
    where: { slug: req.params.roomCode },
    select: {
      id: true, slug: true, name: true, language: true, createdAt: true, updatedAt: true,
      owner: { select: { id: true, name: true, email: true, avatarUrl: true } },
    },
  });
  if (!room) return res.status(404).json({ error: "Room not found" });
  res.json({ room });
});
