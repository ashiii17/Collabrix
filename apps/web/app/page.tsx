import Link from "next/link";
import { Code2, Github, RadioTower, Trophy, Video } from "lucide-react";

const features = [
  ["Realtime rooms", RadioTower],
  ["Interview mode", Video],
  ["Contest leaderboard", Trophy],
  ["GitHub workflows", Github],
  ["AI code review", Code2]
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f6f8fb]">
      <section className="flex min-h-[88vh] items-center border-b border-slate-200 bg-[linear-gradient(120deg,#f6f8fb_0%,#e8f7f2_55%,#fff5df_100%)]">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-steel">Collabrix workspace</p>
            <h1 className="text-5xl font-bold leading-tight text-ink md:text-7xl">Collabrix</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-700">
              A live coding workspace for pair programming, technical interviews, coding contests, video calls, replay, analytics, GitHub saves, and AI feedback.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link className="rounded-md bg-ink px-5 py-3 text-sm font-semibold text-white hover:bg-steel" href="/login">Enter workspace</Link>
              <Link className="rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-ink hover:bg-slate-50" href="/dashboard">Open dashboard</Link>
            </div>
          </div>
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-ink shadow-2xl">
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
              <span className="h-3 w-3 rounded-full bg-rose" />
              <span className="h-3 w-3 rounded-full bg-amber" />
              <span className="h-3 w-3 rounded-full bg-mint" />
              <span className="ml-3 text-xs text-slate-300">room/alpha-interview</span>
            </div>
            <pre className="min-h-[360px] overflow-hidden p-5 text-sm leading-7 text-slate-100">
{`function solve(nums) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    if (seen.has(target - nums[i])) {
      return [seen.get(target - nums[i]), i];
    }
    seen.set(nums[i], i);
  }
}`}
            </pre>
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl grid-cols-2 gap-3 px-6 py-8 md:grid-cols-5">
        {features.map(([label, Icon]) => (
          <div key={label as string} className="flex items-center gap-2 rounded-md border border-slate-200 bg-white p-3 text-sm font-medium text-ink">
            <Icon className="h-4 w-4 text-mint" />
            {label as string}
          </div>
        ))}
      </section>
    </main>
  );
}
