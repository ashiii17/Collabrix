"use client";

import { useState } from "react";
import { Button } from "../../components/Button";
import { api } from "../../lib/api";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [createdUser, setCreatedUser] = useState("");

  async function submit(formData: FormData) {
    setError("");
    setCreatedUser("");
    try {
      const result = await api<{ user: { name: string; email: string } }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email: formData.get("email"),
          name: formData.get("name"),
          password: formData.get("password")
        })
      });
      setCreatedUser(`${result.user.name} (${result.user.email})`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to register");
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#f6f8fb] px-4">
      <form action={submit} className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-ink">Create account</h1>
        <div className="mt-6 space-y-4">
          <input className="w-full rounded-md border border-slate-300 px-3 py-2" name="name" placeholder="Name" required />
          <input className="w-full rounded-md border border-slate-300 px-3 py-2" name="email" placeholder="Email" type="email" required />
          <input className="w-full rounded-md border border-slate-300 px-3 py-2" name="password" placeholder="Password" type="password" required />
        </div>
        {error && <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {createdUser && <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Registered {createdUser}</p>}
        <Button className="mt-6 w-full" type="submit">Register</Button>
      </form>
    </main>
  );
}
