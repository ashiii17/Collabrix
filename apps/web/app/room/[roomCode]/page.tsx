"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api, getToken } from "../../../lib/api";

type Room = {
  id: string; slug: string; name: string; language: string; createdAt: string; updatedAt: string;
  owner: { id: string; name: string; email: string; avatarUrl: string | null };
};
type Participant = { id: string; name: string; avatar: string | null; role: string; joinedAt: string };

export default function RoomDetailPage() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const router = useRouter();
  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }
    Promise.all([
      api<{ room: Room }>(`/rooms/${roomCode}`),
      api<{ participants: Participant[] }>(`/rooms/${roomCode}/participants`),
    ])
      .then(([r, p]) => { setRoom(r.room); setParticipants(p.participants); })
      .catch((e) => setError(e instanceof Error ? e.message : "Room not found"))
      .finally(() => setLoading(false));
  }, [roomCode, router]);

  if (loading) return <main className="grid min-h-screen place-items-center"><p className="text-slate-500">Loading...</p></main>;
  if (error) return <main className="grid min-h-screen place-items-center"><p className="text-red-600">{error}</p></main>;
  if (!room) return null;

  return (
    <main className="min-h-screen bg-[#f6f8fb] px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <Link href="/dashboard" className="text-sm text-indigo-600 hover:underline">← Back to Dashboard</Link>
        <div className="mt-4 rounded-lg border border-slate-200 bg-white p-6">
          <h1 className="text-2xl font-bold text-slate-900">{room.name}</h1>
          <p className="mt-1 font-mono text-sm text-slate-400">Code: {room.slug}</p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase text-slate-500">Language</p>
              <p className="mt-1 font-medium text-slate-900 capitalize">{room.language}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-500">Created</p>
              <p className="mt-1 font-medium text-slate-900">{new Date(room.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-500">Owner</p>
              <p className="mt-1 font-medium text-slate-900">{room.owner.name}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-500">Participants</p>
              <p className="mt-1 font-medium text-slate-900">{participants.length}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4 font-bold text-slate-900">Participants ({participants.length})</div>
          <div className="divide-y divide-slate-100">
            {participants.map((p) => (
              <div key={p.id} className="flex items-center gap-3 px-5 py-3">
                {p.avatar ? (
                  <img src={p.avatar.startsWith("/") ? `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}${p.avatar}` : p.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500 text-xs font-bold text-white">
                    {p.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">{p.name}</p>
                  <p className="text-xs text-slate-500">{p.role} · Joined {new Date(p.joinedAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
            {participants.length === 0 && <p className="px-5 py-4 text-sm text-slate-500">No participants yet.</p>}
          </div>
        </div>
      </div>
    </main>
  );
}
