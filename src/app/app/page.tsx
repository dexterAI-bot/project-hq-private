export default function DashboardPage() {
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-semibold">Project HQ</h1>
      <p className="mt-2 text-gray-600">
        Coming next: Supabase login + private API route to fetch projects.
      </p>
      <div className="mt-6 rounded-xl border p-4">
        <p className="text-sm">
          For now, use the GitHub Pages backup: <a className="underline" href="https://dexterai-bot.github.io/project-dashboard/" target="_blank" rel="noreferrer">Project HQ</a>
        </p>
      </div>
    </div>
  );
}
