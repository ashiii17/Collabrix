import type { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { prisma } from "@collabrix/db";
import { env } from "../config/env.js";
import type { AuthUser } from "../middleware/auth.js";

type AuthedSocket = Socket & { user?: AuthUser };
type ConnectedUser = { socketId: string; userId: string; name: string; avatar: string | null; roomCode: string | null };

// In-memory presence store
const connectedUsers = new Map<string, ConnectedUser>();

export function getActiveUsersForRoom(roomCode: string) {
  return [...connectedUsers.values()].filter((u) => u.roomCode === roomCode).map(({ userId, name, avatar }) => ({ userId, name, avatar }));
}

export function registerCollaborationGateway(io: Server) {
  // JWT auth middleware
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

    // Join room
    socket.on("room:join", async ({ roomCode }: { roomCode: string }) => {
      // Verify room exists
      const room = await prisma.room.findUnique({ where: { slug: roomCode }, select: { id: true } });
      if (!room) { socket.emit("error", { message: "Room not found" }); return; }

      // Verify user is participant
      const member = await prisma.roomMember.findUnique({ where: { roomId_userId: { roomId: room.id, userId: user.id } } });
      if (!member) { socket.emit("error", { message: "Not a participant" }); return; }

      // Get avatar
      const profile = await prisma.user.findUnique({ where: { id: user.id }, select: { avatarUrl: true } });

      // Update presence
      const entry = connectedUsers.get(socket.id)!;
      entry.roomCode = roomCode;
      entry.avatar = profile?.avatarUrl ?? null;

      socket.join(roomCode);

      // Broadcast to others in room
      socket.to(roomCode).emit("user:joined", { userId: user.id, name: user.name, avatar: entry.avatar });

      // Send current active users to the joining client
      socket.emit("room:users", getActiveUsersForRoom(roomCode));
    });

    // Leave room
    socket.on("room:leave", ({ roomCode }: { roomCode: string }) => {
      socket.leave(roomCode);
      const entry = connectedUsers.get(socket.id);
      if (entry) entry.roomCode = null;
      socket.to(roomCode).emit("user:left", { userId: user.id, name: user.name });
    });

    // Disconnect
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
