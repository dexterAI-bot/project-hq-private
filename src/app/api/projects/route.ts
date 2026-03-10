import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const adminEmail = (process.env.PROJECT_HQ_ADMIN_EMAIL || '').trim().toLowerCase();
  const userEmail = (user.email || '').trim().toLowerCase();
  if (adminEmail && userEmail !== adminEmail) {
    return NextResponse.json({ error: `forbidden: ${userEmail}` }, { status: 403 });
  }

  // For now, proxy the public GitHub Pages JSON.
  // Next iteration: store projects in Supabase and fetch directly.
  const url = 'https://raw.githubusercontent.com/dexterAI-bot/project-dashboard/main/projects.json';
  const res = await fetch(url, { cache: 'no-store' });
  const json = await res.json();

  return NextResponse.json({ projects: json });
}
