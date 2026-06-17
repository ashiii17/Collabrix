import type { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { prisma } from "@collabrix/db";
import { env } from "../config/env.js";
import type { AuthUser } from "../middleware/auth.js";

type AuthedSocket = Socket & { user?: AuthUser };
type ConnectedUser = { socketId: string; userId: string; name: string; avatar: string | null; roomCode: string | null };

const connectedUsers = new Map<string, ConnectedUser>();

// Debounced persistence: per-room timers
const saveTimers = new Map<string, ReturnType<typeof setTimeout>>();
const pendingSaves = new Map<string, { code?: string; language?: string }>();

function debouncedSave(roomCode: string, data: { code?: string; language?: string }) {
  const existing = pendingSaves.get(roomCode) ?? {};
  pendingSaves.set(roomCode, { ...existing, ...data });

  const timer = saveTimers.get(roomCode);
  if (timer) clearTimeout(timer);

  saveTimers.set(roomCode, setTimeout(async () => {
    const payload = pendingSaves.get(roomCode);
    pendingSaves.delete(roomCode);
    saveTimers.delete(roomCode);
    if (!payload) return;
    try {
      await prisma.room.update({ where: { slug: roomCode }, data: payload as any });
    } catch { /* room may have been deleted */ }
  }, 2000));
}

export function getActiveUsersForRoom(roomCode: string) {
  return [...connectedUsers.values()].filter((u) => u.roomCode === roomCode).map(({ userId, name, avatar }) => ({ userId, name, avatar }));
}

export function registerCollaborationGateway(io: Server) {
  io.use((socket: AuthedSocket, next) => {
    const token = socket.handshake.auth.token as string | undefined;
    if (!token) return next(new Error("Unauthorized"));
    try {
      socket.user = jwt.verify(token, env.JWT_SECRET) as AuthUser;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket: AuthedSocket) => {
    const user = socket.user!;
    connectedUsers.set(socket.id, { socketId: socket.id, userId: user.id, name: user.name, avatar: null, roomCode: null });

    socket.on("room:join", async ({ roomCode }: { roomCode: string }) => {
      const room = await prisma.room.findUnique({ where: { slug: roomCode }, select: { id: true } });
      if (!room) { socket.emit("error", { message: "Room not found" }); return; }

      const member = await prisma.roomMember.findUnique({ where: { roomId_userId: { roomId: room.id, userId: user.id } } });
      if (!member) { socket.emit("error", { message: "Not a participant" }); return; }

      const profile = await prisma.user.findUnique({ where: { id: user.id }, select: { avatarUrl: true } });
      const entry = connectedUsers.get(socket.id)!;
      entry.roomCode = roomCode;
      entry.avatar = profile?.avatarUrl ?? null;

      socket.join(roomCode);
      socket.to(roomCode).emit("user:joined", { userId: user.id, name: user.name, avatar: entry.avatar });
      socket.emit("room:users", getActiveUsersForRoom(roomCode));
    });

    // Code change: broadcast to room, debounce persist
    socket.on("code:change", ({ roomCode, code }: { roomCode: string; code: string }) => {
      socket.to(roomCode).emit("code:change", { code, userId: user.id });
      debouncedSave(roomCode, { code });
    });

    // Language change: broadcast to room, persist immediately
    socket.on("language:change", async ({ roomCode, language }: { roomCode: string; language: string }) => {
      socket.to(roomCode).emit("language:change", { language, userId: user.id });
      await prisma.room.update({ where: { slug: roomCode }, data: { language: language as any } }).catch(() => {});
    });

    socket.on("room:leave", ({ roomCode }: { roomCode: string }) => {
      socket.leave(roomCode);
      const entry = connectedUsers.get(socket.id);
      if (entry) entry.roomCode = null;
      socket.to(roomCode).emit("user:left", { userId: user.id, name: user.name });
    });

    socket.on("disconnecting", () => {
      const entry = connectedUsers.get(socket.id);
      if (entry?.roomCode) {
        socket.to(entry.roomCode).emit("user:left", { userId: user.id, name: user.name });
      }
    });

    socket.on("disconnect", () => {
      connectedUsers.delete(socket.id);
    });
  });
}
