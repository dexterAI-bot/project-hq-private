'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';

export function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/app';

  const supabase = useMemo(() => createClient(), []);
  const [mode, setMode] = useState<'signin' | 'magic'>('magic');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const allowedEmail = (process.env.NEXT_PUBLIC_PROJECT_HQ_ADMIN_EMAIL || '').toLowerCase();
  const emailLower = email.trim().toLowerCase();
  const isAllowed = !allowedEmail || emailLower === allowedEmail;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    try {
      if (!isAllowed) {
        setMsg('This dashboard is private. This email is not allowed.');
        return;
      }

      if (mode === 'magic') {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
          },
        });
        if (error) throw error;
        setMsg('Magic link sent. Check your email.');
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      window.location.href = next;
    } catch (e: any) {
      console.error(e);
      setMsg(e?.message ?? 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-indigo-50 p-6 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border bg-white/80 backdrop-blur p-6 shadow-[0_20px_60px_rgba(2,6,23,0.12)]">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">Project HQ</h1>
              <p className="mt-1 text-sm text-zinc-600">Private dashboard</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-400 shadow" />
          </div>

          <div className="mt-5 rounded-2xl bg-zinc-50 p-1 flex gap-1">
            <button
              type="button"
              onClick={() => setMode('magic')}
              className={`flex-1 rounded-2xl px-3 py-2 text-sm font-bold ${
                mode === 'magic' ? 'bg-white shadow border' : 'text-zinc-600'
              }`}
            >
              Magic link
            </button>
            <button
              type="button"
              onClick={() => setMode('signin')}
              className={`flex-1 rounded-2xl px-3 py-2 text-sm font-bold ${
                mode === 'signin' ? 'bg-white shadow border' : 'text-zinc-600'
              }`}
            >
              Password
            </button>
          </div>

          <form className="mt-5 space-y-3" onSubmit={submit}>
            <div>
              <label className="text-xs font-semibold text-zinc-600">Email</label>
              <input
                className={`mt-1 w-full rounded-2xl border p-3 outline-none focus:ring-2 focus:ring-sky-300 ${
                  !isAllowed && email ? 'border-rose-300 bg-rose-50' : ''
                }`}
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
                autoComplete="email"
              />
            </div>

            {mode === 'signin' ? (
              <div>
                <label className="text-xs font-semibold text-zinc-600">Password</label>
                <input
                  className="mt-1 w-full rounded-2xl border p-3 outline-none focus:ring-2 focus:ring-sky-300"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  required
                  autoComplete="current-password"
                />
              </div>
            ) : (
              <p className="text-xs text-zinc-500">
                We’ll email you a one-time login link. No password needed.
              </p>
            )}

            <button
              className="w-full rounded-2xl bg-indigo-600 py-3 font-extrabold text-white shadow hover:bg-indigo-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? '...' : mode === 'magic' ? 'Send magic link' : 'Sign in'}
            </button>

            {msg ? (
              <div className="rounded-2xl border bg-white p-3 text-sm text-zinc-700">{msg}</div>
            ) : null}

            {allowedEmail ? (
              <p className="text-xs text-zinc-500">
                Allowed email: <span className="font-semibold">{allowedEmail}</span>
              </p>
            ) : null}
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-zinc-500">
          Tip: bookmark <span className="font-semibold">/app</span> — it will prompt login when needed.
        </p>
      </div>
    </div>
  );
}
