"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { api, getToken } from "../../../lib/api";
import { getSocket, disconnectSocket } from "../../../lib/socket";

const CodeEditor = dynamic(() => import("../../../components/CodeEditor").then(m => ({ default: m.CodeEditor })), { ssr: false });

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const LANGUAGES = ["javascript", "typescript", "python", "java", "cpp"];

type Room = { id: string; slug: string; name: string; language: string; createdAt: string; owner: { id: string; name: string; avatarUrl: string | null } };
type Participant = { id: string; name: string; avatar: string | null; role: string; joinedAt: string };
type OnlineUser = { userId: string; name: string; avatar: string | null };

export default function RoomPage() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const router = useRouter();
  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [error, setError] = useState("");
  const socketJoined = useRef(false);

  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }
    Promise.all([
      api<{ room: Room }>(`/rooms/${roomCode}`),
      api<{ participants: Participant[] }>(`/rooms/${roomCode}/participants`),
      api<{ code: string; language: string }>(`/rooms/${roomCode}/code`),
    ])
      .then(([r, p, c]) => {
        setRoom(r.room);
        setParticipants(p.participants);
        setCode(c.code);
        setLanguage(c.language);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load room"))
      .finally(() => setLoading(false));
  }, [roomCode, router]);

  // Socket connection + presence
  useEffect(() => {
    if (!room || socketJoined.current) return;
    const socket = getSocket();

    socket.emit("room:join", { roomCode });
    socketJoined.current = true;

    socket.on("room:users", (users: OnlineUser[]) => setOnlineUsers(users));
    socket.on("user:joined", (user: OnlineUser) => setOnlineUsers((prev) => prev.some(u => u.userId === user.userId) ? prev : [...prev, user]));
    socket.on("user:left", ({ userId }: { userId: string }) => setOnlineUsers((prev) => prev.filter(u => u.userId !== userId)));

    return () => {
      socket.emit("room:leave", { roomCode });
      socket.off("room:users");
      socket.off("user:joined");
      socket.off("user:left");
      socketJoined.current = false;
      disconnectSocket();
    };
  }, [room, roomCode]);

  const handleSave = useCallback(async () => {
    setSaving(true); setSaveMsg("");
    try {
      await api(`/rooms/${roomCode}/code`, { method: "PATCH", body: JSON.stringify({ code, language }) });
      setSaveMsg("Saved");
      setTimeout(() => setSaveMsg(""), 2000);
    } catch { setSaveMsg("Failed to save"); }
    finally { setSaving(false); }
  }, [code, language, roomCode]);

  if (loading) return <main className="grid h-screen place-items-center"><p className="text-slate-500">Loading...</p></main>;
  if (error) return <main className="grid h-screen place-items-center"><p className="text-red-600">{error}</p></main>;
  if (!room) return null;

  const onlineIds = new Set(onlineUsers.map(u => u.userId));

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-slate-700 bg-[#1e1e1e] px-4 py-2">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm text-slate-400 hover:text-white">← Dashboard</Link>
          <h1 className="text-sm font-bold text-white">{room.name}</h1>
          <span className="font-mono text-xs text-slate-500">{room.slug}</span>
        </div>
        <div className="flex items-center gap-3">
          <select value={language} onChange={(e) => setLanguage(e.target.value)} className="rounded border border-slate-600 bg-slate-800 px-2 py-1 text-xs text-white">
            {LANGUAGES.map((l) => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
          </select>
          <button onClick={handleSave} disabled={saving} className="rounded bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50">
            {saving ? "Saving..." : "Save Code"}
          </button>
          {saveMsg && <span className="text-xs text-emerald-400">{saveMsg}</span>}
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Participants Panel */}
        <aside className="hidden w-56 flex-shrink-0 overflow-y-auto border-r border-slate-700 bg-[#252526] p-3 md:block">
          <p className="text-xs font-bold uppercase text-slate-400">Participants ({participants.length})</p>
          <div className="mt-3 space-y-2">
            {participants.map((p) => (
              <div key={p.id} className="flex items-center gap-2">
                <div className="relative">
                  {p.avatar ? (
                    <img src={p.avatar.startsWith("/") ? `${API_URL}${p.avatar}` : p.avatar} alt="" className="h-6 w-6 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-bold text-white">
                      {p.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#252526] ${onlineIds.has(p.id) ? "bg-green-400" : "bg-slate-500"}`} />
                </div>
                <div>
                  <p className="text-xs text-white">{p.name}</p>
                  <p className="text-[10px] text-slate-500">{p.role}</p>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Editor */}
        <main className="flex-1">
          <CodeEditor value={code} language={language} onChange={setCode} />
        </main>
      </div>
    </div>
  );
}
