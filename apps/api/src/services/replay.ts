import { prisma } from "@collabrix/db";
import type { ReplayEventType } from "@collabrix/shared";

const replayTypeMap: Record<ReplayEventType, string> = {
  "user.joined": "user_joined",
  "user.left": "user_left",
  "code.changed": "code_changed",
  "code.executed": "code_executed",
  "chat.sent": "chat_sent",
  "solution.submitted": "solution_submitted",
  "whiteboard.changed": "whiteboard_changed"
};

export async function recordReplayEvent(args: {
  roomId: string;
  userId?: string;
  type: ReplayEventType;
  payload: unknown;
}) {
  const count = await prisma.replayEvent.count({ where: { roomId: args.roomId } });
  return prisma.replayEvent.create({
    data: {
      roomId: args.roomId,
      userId: args.userId,
      type: replayTypeMap[args.type] as never,
      payload: args.payload as object,
      sequence: count + 1
    }
  });
}
