import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-zinc-50 dark:bg-black">
      <div className="max-w-xl w-full rounded-xl border bg-white dark:bg-zinc-950 p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Project HQ (Private)</h1>
        <p className="text-gray-700 dark:text-gray-200">
          Private Project HQ. GitHub Pages stays up as a backup, but this will be the real private dashboard on Vercel.
        </p>
        <div className="flex gap-3 flex-wrap">
          <Link className="rounded bg-blue-600 text-white px-4 py-2" href="/app">
            Open dashboard
          </Link>
          <a
            className="rounded border px-4 py-2"
            href="https://dexterai-bot.github.io/project-dashboard/"
            target="_blank"
            rel="noreferrer"
          >
            GitHub Pages backup
          </a>
        </div>
        <p className="text-xs text-gray-500">
          Status: scaffold only. Tomorrow we’ll connect Supabase Auth + move the data behind auth.
        </p>
      </div>
    </div>
  );
}
