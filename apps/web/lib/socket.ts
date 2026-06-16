import { io, type Socket } from "socket.io-client";
import { getToken } from "./api";

let socket: Socket | null = null;

export function getSocket() {
  const url = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4000";
  const token = getToken();
  const currentAuth = typeof socket?.auth === "object" ? socket.auth : undefined;

  if (!socket || currentAuth?.token !== token) {
    socket?.disconnect();
    socket = io(url, { auth: { token }, transports: ["websocket"] });
  }

  return socket;
}
