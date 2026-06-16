import type { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { prisma } from "@collabrix/db";
import { chatMessageSchema } from "@collabrix/shared";
import { env } from "../config/env.js";
import { recordReplayEvent } from "../services/replay.js";
import type { AuthUser } from "../middleware/auth.js";

type AuthedSocket = Socket & { user?: AuthUser };

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
    socket.on("room:join", async ({ roomId }: { roomId: string }) => {
      socket.join(roomId);
      socket.to(roomId).emit("presence:joined", socket.user);
      await recordReplayEvent({ roomId, userId: socket.user!.id, type: "user.joined", payload: socket.user });
    });

    socket.on("editor:change", async ({ roomId, code, language, version }) => {
      await prisma.room.update({ where: { id: roomId }, data: { code, language, version: { increment: 1 } } });
      socket.to(roomId).emit("editor:change", { code, language, version, user: socket.user });
      await recordReplayEvent({ roomId, userId: socket.user!.id, type: "code.changed", payload: { code, language, version } });
    });

    socket.on("cursor:move", ({ roomId, cursor }) => {
      socket.to(roomId).emit("cursor:move", { user: socket.user, cursor });
    });

    socket.on("chat:send", async (raw) => {
      const input = chatMessageSchema.parse(raw);
      const message = await prisma.chatMessage.create({
        data: { roomId: input.roomId, userId: socket.user!.id, body: input.body, kind: input.kind },
        include: { user: true }
      });
      io.to(input.roomId).emit("chat:message", message);
      await recordReplayEvent({ roomId: input.roomId, userId: socket.user!.id, type: "chat.sent", payload: message });
    });

    socket.on("whiteboard:change", async ({ roomId, state }) => {
      await prisma.room.update({ where: { id: roomId }, data: { whiteboardState: state } });
      socket.to(roomId).emit("whiteboard:change", { state, user: socket.user });
      await recordReplayEvent({ roomId, userId: socket.user!.id, type: "whiteboard.changed", payload: state });
    });

    socket.on("webrtc:offer", ({ roomId, targetId, offer }) => socket.to(roomId).emit("webrtc:offer", { from: socket.id, targetId, offer }));
    socket.on("webrtc:answer", ({ roomId, targetId, answer }) => socket.to(roomId).emit("webrtc:answer", { from: socket.id, targetId, answer }));
    socket.on("webrtc:ice", ({ roomId, targetId, candidate }) => socket.to(roomId).emit("webrtc:ice", { from: socket.id, targetId, candidate }));

    socket.on("disconnecting", () => {
      for (const roomId of socket.rooms) {
        if (roomId !== socket.id) socket.to(roomId).emit("presence:left", socket.user);
      }
    });
  });
}
