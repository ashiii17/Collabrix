"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../components/Button";
import { api, getToken } from "../../lib/api";

export default function JoinPage() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(false);

  if (typeof window !== "undefined" && !getToken()) { router.push("/login"); }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setJoining(true);
    try {
      const { room } = await api<{ room: { slug: string } }>("/rooms/join", {
        method: "POST",
        body: JSON.stringify({ roomCode: roomCode.trim() }),
      });
      router.push(`/room/${room.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join room");
      setJoining(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#f6f8fb] px-4">
      <form onSubmit={handleJoin} className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Join a Room</h1>
        <p className="mt-1 text-sm text-slate-500">Enter the room code shared with you</p>
        <input
          className="mt-6 w-full rounded-md border border-slate-300 px-3 py-2 font-mono tracking-wider text-center uppercase"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
          placeholder="Enter room code"
          required
          minLength={1}
        />
        {error && <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <Button className="mt-6 w-full" type="submit" disabled={joining}>{joining ? "Joining..." : "Join Room"}</Button>
      </form>
    </main>
  );
}
