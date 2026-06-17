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
      members: { create: { userId: req.user!.id, role: "owner" } },
    },
    select: { id: true, slug: true, name: true, language: true, createdAt: true, updatedAt: true },
  });
  res.status(201).json({ room });
});

// Join room by code
roomsRouter.post("/join", async (req, res) => {
  const { roomCode } = req.body;
  if (!roomCode || typeof roomCode !== "string") {
    return res.status(400).json({ error: "Room code is required." });
  }
  const room = await prisma.room.findUnique({ where: { slug: roomCode }, select: { id: true, slug: true, name: true, language: true } });
  if (!room) return res.status(404).json({ error: "Room not found." });

  const existing = await prisma.roomMember.findUnique({ where: { roomId_userId: { roomId: room.id, userId: req.user!.id } } });
  if (existing) return res.status(409).json({ error: "You have already joined this room." });

  await prisma.roomMember.create({ data: { roomId: room.id, userId: req.user!.id, role: "participant" } });
  res.json({ room });
});

// Leave room
roomsRouter.post("/:roomCode/leave", async (req, res) => {
  const room = await prisma.room.findUnique({ where: { slug: req.params.roomCode }, select: { id: true, ownerId: true } });
  if (!room) return res.status(404).json({ error: "Room not found." });
  if (room.ownerId === req.user!.id) return res.status(400).json({ error: "Owner cannot leave the room." });

  await prisma.roomMember.deleteMany({ where: { roomId: room.id, userId: req.user!.id } });
  res.json({ message: "Left the room." });
});

// Get participants
roomsRouter.get("/:roomCode/participants", async (req, res) => {
  const room = await prisma.room.findUnique({ where: { slug: req.params.roomCode }, select: { id: true } });
  if (!room) return res.status(404).json({ error: "Room not found." });

  const members = await prisma.roomMember.findMany({
    where: { roomId: room.id },
    select: { joinedAt: true, role: true, user: { select: { id: true, name: true, avatarUrl: true } } },
    orderBy: { joinedAt: "asc" },
  });
  const participants = members.map((m) => ({ id: m.user.id, name: m.user.name, avatar: m.user.avatarUrl, role: m.role, joinedAt: m.joinedAt }));
  res.json({ participants });
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
