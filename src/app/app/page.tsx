'use client';

import useSWR from 'swr';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const text = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {
    // not JSON
  }
  if (!res.ok) {
    const msg = json?.error ? `${json.error} (${res.status})` : `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return json ?? {};
};

export default function DashboardPage() {
  const { data, error, isLoading } = useSWR('/api/projects', fetcher);

  if (isLoading) {
    return <div className="min-h-screen p-8">Loading…</div>;
  }
  if (error) {
    return (
      <div className="min-h-screen p-8 bg-zinc-50">
        <div className="mx-auto max-w-xl rounded-2xl border bg-white p-5 shadow-sm">
          <div className="font-extrabold text-zinc-900">Failed to load</div>
          <div className="mt-1 text-sm text-zinc-700">
            {String((error as any)?.message || '')}
          </div>
          <div className="mt-2 text-xs text-zinc-600">
            If you see <span className="font-semibold">unauthorized (401)</span>, you need to login.
          </div>
          <a className="mt-4 inline-block text-sm underline" href="/login">
            Go to login
          </a>
        </div>
      </div>
    );
  }

  const projects = data?.projects ?? [];

  return (
    <div className="min-h-screen bg-zinc-50 p-6">
      <div className="mx-auto max-w-5xl space-y-4">
        <header className="rounded-2xl border bg-white p-5 shadow-sm">
          <h1 className="text-2xl font-extrabold">Project HQ</h1>
          <p className="text-sm text-zinc-600">Private view (requires login)</p>
        </header>

        <div className="grid gap-3 md:grid-cols-2">
          {projects.map((p: any) => (
            <div key={p.id} className="rounded-2xl border bg-white p-4">
              <div className="text-xs text-zinc-500">{p.status}</div>
              <div className="text-lg font-extrabold">{p.name}</div>
              <div className="mt-1 text-sm text-zinc-700">{p.summary}</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {(p.links || []).slice(0, 2).map((l: any) => (
                  <a key={l.url} className="text-sm underline" href={l.url} target="_blank" rel="noreferrer">
                    {l.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
