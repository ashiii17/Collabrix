"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../components/Button";
import { api, getToken } from "../../lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
type Profile = { id: string; name: string; email: string; avatarUrl: string | null; createdAt: string };

export default function ProfilePage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }
    api<{ user: Profile }>("/auth/profile")
      .then((r) => { setProfile(r.user); setName(r.user.name); })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load profile"))
      .finally(() => setLoading(false));
  }, [router]);

  function avatarSrc(p: Profile) {
    if (!p.avatarUrl) return null;
    return p.avatarUrl.startsWith("/") ? `${API_URL}${p.avatarUrl}` : p.avatarUrl;
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormError(""); setSuccess("");
    const form = new FormData();
    form.append("avatar", file);
    try {
      const res = await fetch(`${API_URL}/auth/avatar`, {
        method: "POST",
        headers: { authorization: `Bearer ${getToken()}` },
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setProfile(data.user);
      setSuccess("Avatar updated.");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Upload failed");
    }
  }

  async function handleRemoveAvatar() {
    setFormError(""); setSuccess("");
    try {
      const r = await api<{ user: Profile }>("/auth/profile", {
        method: "PATCH",
        body: JSON.stringify({ avatarUrl: "" }),
      });
      setProfile(r.user);
      setSuccess("Avatar removed.");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to remove avatar");
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setFormError(""); setSuccess("");
    try {
      const r = await api<{ user: Profile }>("/auth/profile", {
        method: "PATCH",
        body: JSON.stringify({ name }),
      });
      setProfile(r.user);
      setSuccess("Profile updated.");
      setEditing(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Update failed");
    } finally { setSaving(false); }
  }

  if (loading) return <main className="grid min-h-screen place-items-center"><p className="text-slate-500">Loading...</p></main>;
  if (error) return <main className="grid min-h-screen place-items-center"><p className="text-red-600">{error}</p></main>;
  if (!profile) return null;

  return (
    <main className="min-h-screen bg-[#f6f8fb] px-4 py-12">
      <div className="mx-auto w-full max-w-lg rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <div className="relative group">
            {avatarSrc(profile) ? (
              <img src={avatarSrc(profile)!} alt="Avatar" className="h-20 w-20 rounded-full object-cover" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-500 text-2xl font-bold text-white">
                {profile.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >Change</button>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={handleAvatarUpload} />
            {avatarSrc(profile) && (
              <button type="button" onClick={handleRemoveAvatar} className="mt-1 text-xs text-red-500 hover:text-red-700">Remove</button>
            )}
          </div>
          <div className="text-center sm:text-left">
            <h1 className="text-xl font-bold text-slate-900">{profile.name}</h1>
            <p className="text-sm text-slate-500">{profile.email}</p>
            <p className="mt-1 text-xs text-slate-400">Joined {new Date(profile.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        {success && <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p>}
        {formError && <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>}

        {!editing ? (
          <Button className="mt-6 w-full" onClick={() => setEditing(true)}>Edit Profile</Button>
        ) : (
          <form onSubmit={handleSave} className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Name</label>
              <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={80} />
            </div>
            <div className="flex gap-3">
              <Button className="flex-1" type="submit" disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
              <button type="button" onClick={() => { setEditing(false); setName(profile.name); setFormError(""); }} className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">Cancel</button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
