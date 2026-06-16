"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Bot, Camera, CircleDot, GitBranch, Mic, Play, Send, Share2 } from "lucide-react";
import { Button } from "../../../components/Button";
import { api } from "../../../lib/api";
import { getSocket } from "../../../lib/socket";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

type Message = { id: string; body: string; kind: string; createdAt: string; user: { name: string } };
type Room = {
  id: string;
  slug: string;
  name: string;
  mode: string;
  language: "javascript" | "python" | "java" | "cpp";
  code: string;
  version: number;
  problemTitle?: string;
  problemBody?: string;
  messages: Message[];
  replayEvents: Array<{ id: string; type: string; sequence: number; createdAt: string }>;
  members: Array<{ user: { id: string; name: string; avatarUrl?: string | null }; role: string }>;
};

export default function RoomPage() {
  const params = useParams<{ roomId: string }>();
  const [room, setRoom] = useState<Room | null>(null);
  const [code, setCode] = useState("");
  const [stdin, setStdin] = useState("");
  const [output, setOutput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [review, setReview] = useState("");

  const socket = useMemo(() => getSocket(), []);

  useEffect(() => {
    api<{ room: Room }>(`/rooms/${params.roomId}`).then(({ room }) => {
      setRoom(room);
      setCode(room.code);
      setMessages(room.messages);
      socket.emit("room:join", { roomId: room.id });
    });
  }, [params.roomId, socket]);

  useEffect(() => {
    socket.on("editor:change", (event: { code: string }) => setCode(event.code));
    socket.on("chat:message", (message: Message) => setMessages((current) => [...current, message]));
    return () => {
      socket.off("editor:change");
      socket.off("chat:message");
    };
  }, [socket]);

  function updateCode(nextCode = "") {
    setCode(nextCode);
    if (room) socket.emit("editor:change", { roomId: room.id, code: nextCode, language: room.language, version: room.version + 1 });
  }

  async function runCode() {
    if (!room) return;
    const result = await api<{ execution: { stdout: string; stderr: string; durationMs: number; exitCode: number } }>(`/execute/${room.id}`, {
      method: "POST",
      body: JSON.stringify({ language: room.language, code, stdin })
    });
    setOutput([result.execution.stdout, result.execution.stderr].filter(Boolean).join("\n"));
  }

  async function sendMessage(formData: FormData) {
    const body = String(formData.get("message") ?? "");
    if (!room || !body.trim()) return;
    socket.emit("chat:send", { roomId: room.id, body, kind: "text" });
  }

  async function reviewCode() {
    if (!room) return;
    const result = await api<{ review: unknown }>("/ai/code-review", {
      method: "POST",
      body: JSON.stringify({ language: room.language, code, context: room.problemBody })
    });
    setReview(JSON.stringify(result.review, null, 2));
  }

  if (!room) return <main className="grid min-h-screen place-items-center bg-[#f6f8fb] text-ink">Loading room...</main>;

  return (
    <main className="grid min-h-screen grid-rows-[56px_1fr] bg-[#f6f8fb]">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4">
        <div>
          <h1 className="font-bold text-ink">{room.name}</h1>
          <p className="text-xs text-slate-500">{room.mode} · {room.language} · {room.slug}</p>
        </div>
        <div className="flex items-center gap-2">
          <button title="Camera" className="rounded-md border border-slate-300 p-2"><Camera className="h-4 w-4" /></button>
          <button title="Microphone" className="rounded-md border border-slate-300 p-2"><Mic className="h-4 w-4" /></button>
          <button title="Screen share" className="rounded-md border border-slate-300 p-2"><Share2 className="h-4 w-4" /></button>
          <button title="GitHub" className="rounded-md border border-slate-300 p-2"><GitBranch className="h-4 w-4" /></button>
        </div>
      </header>

      <div className="grid min-h-0 grid-cols-[280px_1fr_340px] gap-0">
        <aside className="min-h-0 border-r border-slate-200 bg-white p-4">
          <h2 className="text-sm font-bold text-ink">Participants</h2>
          <div className="mt-3 space-y-2">
            {room.members.map((member) => (
              <div key={member.user.id} className="flex items-center gap-2 rounded-md bg-slate-50 p-2 text-sm">
                <CircleDot className="h-3 w-3 text-mint" />
                <span className="font-medium text-ink">{member.user.name}</span>
                <span className="ml-auto text-xs text-slate-500">{member.role}</span>
              </div>
            ))}
          </div>
          <h2 className="mt-6 text-sm font-bold text-ink">Replay timeline</h2>
          <div className="mt-3 max-h-72 space-y-2 overflow-auto text-xs text-slate-600">
            {room.replayEvents.map((event) => (
              <div key={event.id} className="rounded-md border border-slate-200 p-2">#{event.sequence} {event.type}</div>
            ))}
          </div>
        </aside>

        <section className="grid min-h-0 grid-rows-[1fr_190px]">
          <div className="min-h-0">
            <MonacoEditor
              height="100%"
              language={room.language === "cpp" ? "cpp" : room.language}
              theme="vs-dark"
              value={code}
              onChange={(value) => updateCode(value)}
              options={{ minimap: { enabled: false }, fontSize: 14, padding: { top: 16 } }}
            />
          </div>
          <div className="grid grid-cols-2 border-t border-slate-200 bg-white">
            <textarea className="resize-none border-r border-slate-200 p-3 text-sm outline-none" placeholder="Custom input" value={stdin} onChange={(event) => setStdin(event.target.value)} />
            <pre className="overflow-auto p-3 text-sm text-ink">{output || "Output console"}</pre>
          </div>
        </section>

        <aside className="grid min-h-0 grid-rows-[auto_1fr_auto] border-l border-slate-200 bg-white">
          <div className="space-y-2 border-b border-slate-200 p-4">
            <Button onClick={runCode} className="w-full bg-mint text-ink hover:bg-[#27a987]"><Play className="h-4 w-4" /> Run code</Button>
            <Button onClick={reviewCode} className="w-full"><Bot className="h-4 w-4" /> AI review</Button>
          </div>
          <div className="min-h-0 overflow-auto p-4">
            <h2 className="text-sm font-bold text-ink">Room chat</h2>
            <div className="mt-3 space-y-3">
              {messages.map((message) => (
                <div key={message.id} className="rounded-md bg-slate-50 p-3 text-sm">
                  <p className="font-semibold text-ink">{message.user.name}</p>
                  <p className="mt-1 whitespace-pre-wrap text-slate-700">{message.body}</p>
                </div>
              ))}
            </div>
            {review && <pre className="mt-4 overflow-auto rounded-md bg-ink p-3 text-xs text-slate-100">{review}</pre>}
          </div>
          <form action={sendMessage} className="flex gap-2 border-t border-slate-200 p-3">
            <input className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm" name="message" placeholder="Message" />
            <button title="Send" className="rounded-md bg-ink p-2 text-white"><Send className="h-4 w-4" /></button>
          </form>
        </aside>
      </div>
    </main>
  );
}
