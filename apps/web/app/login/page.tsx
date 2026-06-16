"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../components/Button";
import { api, setToken } from "../../lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);

    try {
      const { token } = await api<{ token: string; user: { id: string; email: string; name: string } }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
        }),
      });
      setToken(token);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#f6f8fb] px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Sign in</h1>
        <div className="mt-6 space-y-4">
          <input className="w-full rounded-md border border-slate-300 px-3 py-2" name="email" placeholder="Email" type="email" required />
          <input className="w-full rounded-md border border-slate-300 px-3 py-2" name="password" placeholder="Password" type="password" required />
        </div>
        {error && <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <Button className="mt-6 w-full" type="submit">Sign in</Button>
      </form>
    </main>
  );
}
