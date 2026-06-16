"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "../../components/Button";
import { api, getToken } from "../../lib/api";

type Room = { id: string; slug: string; name: string; language: string; createdAt: string };

export default function DashboardPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }
    api<{ rooms: Room[] }>("/rooms")
      .then((r) => setRooms(r.rooms))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCreating(true); setError("");
    const form = new FormData(e.currentTarget);
    try {
      const { room } = await api<{ room: Room }>("/rooms", {
        method: "POST",
        body: JSON.stringify({ name: form.get("name"), language: form.get("language") }),
      });
      router.push(`/room/${room.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create room");
      setCreating(false);
    }
  }

  if (loading) return <main className="grid min-h-screen place-items-center"><p className="text-slate-500">Loading...</p></main>;

  return (
    <main className="min-h-screen bg-[#f6f8fb] px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <div className="flex gap-3">
            <Link href="/profile" className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">Profile</Link>
            <Button onClick={() => setShowForm(!showForm)}>{showForm ? "Cancel" : "Create Room"}</Button>
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Total Rooms</p>
          <p className="text-3xl font-bold text-slate-900">{rooms.length}</p>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="mt-6 rounded-lg border border-slate-200 bg-white p-5 space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Create Room</h2>
            <input className="w-full rounded-md border border-slate-300 px-3 py-2" name="name" placeholder="Room Name" required minLength={2} maxLength={80} />
            <select className="w-full rounded-md border border-slate-300 px-3 py-2" name="language" required>
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
            </select>
            {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <Button type="submit" className="w-full" disabled={creating}>{creating ? "Creating..." : "Create"}</Button>
          </form>
        )}

        <div className="mt-6 rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4 font-bold text-slate-900">Recent Rooms</div>
          <div className="divide-y divide-slate-100">
            {rooms.map((room) => (
              <Link key={room.id} href={`/room/${room.slug}`} className="flex items-center justify-between px-5 py-4 hover:bg-slate-50">
                <div>
                  <p className="font-medium text-slate-900">{room.name}</p>
                  <p className="text-xs text-slate-500">{room.language} · {new Date(room.createdAt).toLocaleDateString()}</p>
                </div>
                <span className="text-xs font-mono text-slate-400">{room.slug}</span>
              </Link>
            ))}
            {rooms.length === 0 && <p className="px-5 py-8 text-center text-sm text-slate-500">No rooms yet. Create one to get started.</p>}
          </div>
        </div>
      </div>
    </main>
  );
}
