import { Router } from "express";
import { nanoid } from "nanoid";
import { prisma } from "@collabrix/db";
import { createRoomSchema } from "@collabrix/shared";
import { requireAuth } from "../middleware/auth.js";

export const roomsRouter = Router();

roomsRouter.use(requireAuth);

roomsRouter.get("/", async (req, res) => {
  const rooms = await prisma.room.findMany({
    where: { members: { some: { userId: req.user!.id } } },
    include: { members: { include: { user: true } } },
    orderBy: { updatedAt: "desc" }
  });
  res.json({ rooms });
});

roomsRouter.post("/", async (req, res) => {
  const input = createRoomSchema.parse(req.body);
  const room = await prisma.room.create({
    data: {
      slug: nanoid(8),
      name: input.name,
      mode: input.mode,
      language: input.language,
      ownerId: req.user!.id,
      code: defaultCode(input.language),
      members: { create: { userId: req.user!.id, role: "owner" } }
    }
  });
  res.status(201).json({ room });
});

roomsRouter.get("/:slug", async (req, res) => {
  const room = await prisma.room.findUnique({
    where: { slug: req.params.slug },
    include: {
      members: { include: { user: true } },
      messages: { include: { user: true }, orderBy: { createdAt: "asc" }, take: 100 },
      replayEvents: { orderBy: { sequence: "asc" }, take: 250 }
    }
  });

  if (!room) return res.status(404).json({ error: "Room not found" });
  res.json({ room });
});

roomsRouter.post("/:slug/join", async (req, res) => {
  const room = await prisma.room.findUnique({ where: { slug: req.params.slug } });
  if (!room) return res.status(404).json({ error: "Room not found" });

  await prisma.roomMember.upsert({
    where: { roomId_userId: { roomId: room.id, userId: req.user!.id } },
    create: { roomId: room.id, userId: req.user!.id, role: "participant" },
    update: {}
  });

  res.json({ room });
});

function defaultCode(language: string) {
  if (language === "python") return "print('Hello from Collabrix')\n";
  if (language === "java") return "class Main {\n  public static void main(String[] args) {\n    System.out.println(\"Hello from Collabrix\");\n  }\n}\n";
  if (language === "cpp") return "#include <iostream>\nint main() {\n  std::cout << \"Hello from Collabrix\\n\";\n}\n";
  return "console.log('Hello from Collabrix');\n";
}
