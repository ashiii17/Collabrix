import http from "node:http";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { Server } from "socket.io";
import { env } from "./config/env.js";
import { authRouter } from "./routes/auth.js";
import { roomsRouter } from "./routes/rooms.js";
import { executionRouter } from "./routes/execution.js";
import { aiRouter } from "./routes/ai.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { integrationsRouter } from "./routes/integrations.js";
import { contestsRouter } from "./routes/contests.js";
import { registerCollaborationGateway } from "./sockets/collaboration.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: env.WEB_ORIGIN, credentials: true }
});

app.use(helmet());
app.use(cors({ origin: env.WEB_ORIGIN, credentials: true }));
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => res.json({ ok: true, service: "collabrix-api" }));
app.use("/auth", authRouter);
app.use("/rooms", roomsRouter);
app.use("/execute", executionRouter);
app.use("/ai", aiRouter);
app.use("/dashboard", dashboardRouter);
app.use("/integrations", integrationsRouter);
app.use("/contests", contestsRouter);

registerCollaborationGateway(io);

server.listen(env.PORT, () => {
  console.log(`Collabrix API listening on http://localhost:${env.PORT}`);
});
