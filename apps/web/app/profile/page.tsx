"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../components/Button";
import { api, getToken } from "../../lib/api";

type Profile = { id: string; name: string; email: string; avatarUrl: string | null; createdAt: string };

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }
    api<{ user: Profile }>("/auth/profile")
      .then((r) => { setProfile(r.user); setName(r.user.name); setAvatarUrl(r.user.avatarUrl ?? ""); })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load profile"))
      .finally(() => setLoading(false));
  }, [router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setFormError(""); setSuccess("");
    try {
      const r = await api<{ user: Profile }>("/auth/profile", {
        method: "PATCH",
        body: JSON.stringify({ name, avatarUrl: avatarUrl || "" }),
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
          <img
            src={profile.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&size=80&background=6366f1&color=fff`}
            alt="Avatar"
            className="h-20 w-20 rounded-full object-cover"
          />
          <div className="text-center sm:text-left">
            <h1 className="text-xl font-bold text-slate-900">{profile.name}</h1>
            <p className="text-sm text-slate-500">{profile.email}</p>
            <p className="mt-1 text-xs text-slate-400">Joined {new Date(profile.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        {!editing ? (
          <Button className="mt-6 w-full" onClick={() => setEditing(true)}>Edit Profile</Button>
        ) : (
          <form onSubmit={handleSave} className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Name</label>
              <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={80} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Avatar URL</label>
              <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://example.com/avatar.png" type="url" />
            </div>
            {formError && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>}
            {success && <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p>}
            <div className="flex gap-3">
              <Button className="flex-1" type="submit" disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
              <button type="button" onClick={() => { setEditing(false); setName(profile.name); setAvatarUrl(profile.avatarUrl ?? ""); setFormError(""); }} className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">Cancel</button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
