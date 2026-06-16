"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api, getToken } from "../../../lib/api";

type Room = {
  id: string; slug: string; name: string; language: string; createdAt: string; updatedAt: string;
  owner: { id: string; name: string; email: string; avatarUrl: string | null };
};

export default function RoomDetailPage() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const router = useRouter();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }
    api<{ room: Room }>(`/rooms/${roomCode}`)
      .then((r) => setRoom(r.room))
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
              <p className="text-xs text-slate-500">{room.owner.email}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-500">Last Updated</p>
              <p className="mt-1 font-medium text-slate-900">{new Date(room.updatedAt).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
