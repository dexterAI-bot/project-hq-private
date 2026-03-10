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

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    try {
      if (mode === 'magic') {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
          },
        });
        if (error) throw error;
        setMsg('Check your email for the login link.');
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
    <div className="min-h-screen flex items-center justify-center p-6 bg-zinc-50">
      <div className="w-full max-w-md rounded-2xl border bg-white p-6 shadow">
        <h1 className="text-2xl font-extrabold">Project HQ</h1>
        <p className="mt-1 text-sm text-zinc-600">Private dashboard</p>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            className={`rounded-full border px-3 py-1 text-sm ${mode === 'magic' ? 'bg-black text-white' : ''}`}
            onClick={() => setMode('magic')}
          >
            Magic link
          </button>
          <button
            type="button"
            className={`rounded-full border px-3 py-1 text-sm ${mode === 'signin' ? 'bg-black text-white' : ''}`}
            onClick={() => setMode('signin')}
          >
            Password
          </button>
        </div>

        <form className="mt-4 space-y-3" onSubmit={submit}>
          <input
            className="w-full rounded-xl border p-2"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
          />

          {mode === 'signin' ? (
            <input
              className="w-full rounded-xl border p-2"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
            />
          ) : null}

          <button className="w-full rounded-xl bg-blue-600 py-2 font-bold text-white disabled:opacity-50" disabled={loading}>
            {loading ? '...' : mode === 'magic' ? 'Send link' : 'Sign in'}
          </button>

          {msg ? <div className="text-sm text-zinc-700">{msg}</div> : null}
        </form>

        <p className="mt-4 text-xs text-zinc-500">
          Tip: magic link avoids password management. Redirect goes to /auth/callback.
        </p>
      </div>
    </div>
  );
}
