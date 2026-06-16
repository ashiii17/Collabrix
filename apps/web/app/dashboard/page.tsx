"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Video, Trophy, BarChart3 } from "lucide-react";
import { Button } from "../../components/Button";
import { api } from "../../lib/api";

type Room = { id: string; slug: string; name: string; mode: string; language: string; updatedAt: string };

export default function DashboardPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [stats, setStats] = useState<Record<string, number | string[]> | null>(null);

  useEffect(() => {
    api<{ rooms: Room[] }>("/rooms").then((r) => setRooms(r.rooms)).catch(() => {});
    api<{ stats: Record<string, number | string[]> }>("/dashboard").then((r) => setStats(r.stats)).catch(() => {});
  }, []);

  async function createRoom(formData: FormData) {
    const result = await api<{ room: Room }>("/rooms", {
      method: "POST",
      body: JSON.stringify({
        name: formData.get("name"),
        mode: formData.get("mode"),
        language: formData.get("language")
      })
    });
    window.location.href = `/rooms/${result.room.slug}`;
  }

  return (
    <main className="min-h-screen bg-[#f6f8fb]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-bold text-ink">Collabrix</Link>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Video className="h-4 w-4" /> Interviews
            <Trophy className="ml-3 h-4 w-4" /> Contests
            <BarChart3 className="ml-3 h-4 w-4" /> Analytics
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[360px_1fr]">
        <form action={createRoom} className="rounded-lg border border-slate-200 bg-white p-5">
          <h1 className="text-lg font-bold text-ink">Create room</h1>
          <div className="mt-5 space-y-3">
            <input className="w-full rounded-md border border-slate-300 px-3 py-2" name="name" placeholder="Room name" required />
            <select className="w-full rounded-md border border-slate-300 px-3 py-2" name="mode" defaultValue="collaboration">
              <option value="collaboration">Collaboration</option>
              <option value="interview">Interview</option>
              <option value="contest">Contest</option>
            </select>
            <select className="w-full rounded-md border border-slate-300 px-3 py-2" name="language" defaultValue="javascript">
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
            </select>
          </div>
          <Button className="mt-5 w-full"><Plus className="h-4 w-4" /> Create</Button>
        </form>
        <section>
          <div className="grid gap-3 sm:grid-cols-4">
            {["roomsCreated", "totalSessions", "executions", "submissions"].map((key) => (
              <div key={key} className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">{key}</p>
                <p className="mt-2 text-2xl font-bold text-ink">{String(stats?.[key] ?? 0)}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-4 font-bold text-ink">Your rooms</div>
            <div className="divide-y divide-slate-100">
              {rooms.map((room) => (
                <Link key={room.id} href={`/rooms/${room.slug}`} className="grid gap-2 px-5 py-4 hover:bg-slate-50 md:grid-cols-[1fr_120px_120px]">
                  <span className="font-semibold text-ink">{room.name}</span>
                  <span className="text-sm text-slate-600">{room.mode}</span>
                  <span className="text-sm text-slate-600">{room.language}</span>
                </Link>
              ))}
              {rooms.length === 0 && <p className="px-5 py-8 text-sm text-slate-500">No rooms yet.</p>}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
