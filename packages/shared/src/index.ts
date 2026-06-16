import { z } from "zod";

export const languageSchema = z.enum(["python", "javascript", "typescript", "java", "cpp"]);
export type Language = z.infer<typeof languageSchema>;

export const roomModeSchema = z.enum(["collaboration", "interview", "contest"]);
export type RoomMode = z.infer<typeof roomModeSchema>;

export const createRoomSchema = z.object({
  name: z.string().min(2).max(80),
  mode: roomModeSchema.default("collaboration"),
  language: languageSchema.default("javascript")
});

export const registerUserSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(80, "Name must be at most 80 characters."),
  email: z.string().trim().email("Email must be valid.").max(255, "Email must be at most 255 characters.").toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(128, "Password must be at most 128 characters.")
    .regex(/[A-Z]/, "Password must include an uppercase letter.")
    .regex(/[a-z]/, "Password must include a lowercase letter.")
    .regex(/[0-9]/, "Password must include a number.")
});

export const codeExecutionSchema = z.object({
  language: languageSchema,
  code: z.string().max(100_000),
  stdin: z.string().max(20_000).optional().default("")
});

export const chatMessageSchema = z.object({
  roomId: z.string(),
  body: z.string().min(1).max(4000),
  kind: z.enum(["text", "code", "file"]).default("text")
});

export const loginUserSchema = z.object({
  email: z.string().trim().email("Email must be valid.").toLowerCase(),
  password: z.string().min(1, "Password is required."),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(80, "Name must be at most 80 characters.").optional(),
  avatarUrl: z.string().url("Avatar must be a valid URL.").max(500).optional().or(z.literal("")),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type RegisterUserInput = z.infer<typeof registerUserSchema>;
export type LoginUserInput = z.infer<typeof loginUserSchema>;
export type CodeExecutionInput = z.infer<typeof codeExecutionSchema>;
export type ChatMessageInput = z.infer<typeof chatMessageSchema>;

export type AuthUser = { id: string; email: string; name: string };
export type AuthResponse = { token: string; user: AuthUser };

export type ReplayEventType =
  | "user.joined"
  | "user.left"
  | "code.changed"
  | "code.executed"
  | "chat.sent"
  | "solution.submitted"
  | "whiteboard.changed";

export type RoomParticipant = {
  id: string;
  name: string;
  avatarUrl?: string | null;
  role: "owner" | "interviewer" | "candidate" | "participant";
  cursor?: { line: number; column: number };
};

export type EditorState = {
  code: string;
  language: Language;
  version: number;
  updatedAt: string;
};
