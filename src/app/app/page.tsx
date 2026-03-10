'use client';

import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';

type Project = {
  id: string;
  name: string;
  status?: string;
  summary?: string;
  architecture?: string;
  techStack?: string[];
  links?: { label: string; url: string }[];
  externalUrls?: { label: string; url: string }[];
  nextSteps?: string[];
  owners?: string[];
  tags?: string[];
};

const fetcher = async (url: string) => {
  const res = await fetch(url, { cache: 'no-store' });
  const text = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {}
  if (!res.ok) throw new Error(json?.error ? `${json.error} (${res.status})` : `HTTP ${res.status}`);
  return json;
};

function statusClass(status?: string) {
  const s = (status || '').toLowerCase();
  if (s.includes('running')) return 'status-running';
  if (s.includes('planning')) return 'status-planning';
  if (s.includes('paused')) return 'status-paused';
  return 'status-running';
}

function isHttpUrl(url: string) {
  return /^https?:\/\//i.test(url);
}

function renderLinkItem(link: { label: string; url: string }) {
  const url = String(link.url || '');
  const label = String(link.label || url);

  if (url.startsWith('~/') || url.startsWith('/Users/') || url.startsWith('./') || url.startsWith('../')) {
    const safe = url.replace(/"/g, '&quot;');
    return `
      <li class="link-item">
        <span class="link-label">${label}:</span>
        <code class="local-path">${safe}</code>
        <button class="copy-btn" data-copy="${safe}">Copy</button>
      </li>
    `.trim();
  }

  if (isHttpUrl(url)) {
    return `<li class="link-item"><a href="${url}" target="_blank" rel="noreferrer">${label}</a></li>`;
  }

  return `<li class="link-item"><span>${label}: ${url}</span></li>`;
}

export default function ProjectHQApp() {
  const { data, error, isLoading } = useSWR('/api/projects', fetcher);
  const [selected, setSelected] = useState<Project | null>(null);
  const [query, setQuery] = useState('');

  const projects: Project[] = data?.projects ?? [];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((p) => {
      const blob = [p.name, p.summary, ...(p.tags || [])].join(' ').toLowerCase();
      return blob.includes(q);
    });
  }, [projects, query]);

  useEffect(() => {
    // Wire copy buttons inside the detail panel
    const root = document.getElementById('detail-panel');
    if (!root) return;
    const handler = async (e: any) => {
      const btn = e.target?.closest?.('button.copy-btn[data-copy]');
      if (!btn) return;
      const text = btn.getAttribute('data-copy');
      if (!text) return;
      try {
        await navigator.clipboard.writeText(text);
        btn.textContent = 'Copied';
        setTimeout(() => (btn.textContent = 'Copy'), 1200);
      } catch {
        // fallback
        prompt('Copy this path:', text);
      }
    };
    root.addEventListener('click', handler);
    return () => root.removeEventListener('click', handler);
  }, [selected]);

  if (isLoading) {
    return (
      <div style={{ padding: '24px', color: '#fff' }}>
        Loading…
        <link rel="stylesheet" href="/phq/styles.css" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px', color: '#fff' }}>
        <link rel="stylesheet" href="/phq/styles.css" />
        <div className="card" style={{ maxWidth: 700, margin: '0 auto' }}>
          <h2>Failed to load</h2>
          <p>{String((error as any)?.message || '')}</p>
          <a href="/login">Go to login</a>
        </div>
      </div>
    );
  }

  return (
    <>
      <link rel="stylesheet" href="/phq/styles.css" />

      <header>
        <div className="header-content">
          <div>
            <h1>Project HQ</h1>
            <p>Everything you run or plan, plus one tap to tell the bot what we’re working on next.</p>
          </div>
        </div>
      </header>

      <div className="search-wrap">
        <input
          id="search-input"
          placeholder="Search by name, summary, or tag"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <main id="project-grid">
        {filtered.map((p) => (
          <button
            key={p.id}
            className="project-card"
            onClick={() => setSelected(p)}
            style={{ textAlign: 'left' }}
          >
            <div className={`status-pill ${statusClass(p.status)}`}>{p.status || 'running'}</div>
            <h2>{p.name}</h2>
            <p>{p.summary}</p>
            <div className="tag-row">
              {(p.tags || []).slice(0, 4).map((t) => (
                <span key={t} className="tag">
                  {t}
                </span>
              ))}
            </div>
          </button>
        ))}
      </main>

      <div id="detail-panel" className={`detail-panel ${selected ? 'open' : ''}`}>
        <div className="card">
          <button className="close-btn" aria-label="Close detail" onClick={() => setSelected(null)}>
            ×
          </button>

          {selected ? (
            <>
              <div>
                <div className={`status-pill ${statusClass(selected.status)}`}>{selected.status || 'running'}</div>
                <h2 id="detail-name">{selected.name}</h2>
              </div>
              <p id="detail-summary">{selected.summary}</p>

              <div className="detail-row">
                <div>
                  <h3>Architecture</h3>
                  <p id="detail-architecture">{selected.architecture}</p>
                </div>
                <div>
                  <h3>Tech Stack</h3>
                  <p id="detail-tech">{(selected.techStack || []).join(' · ')}</p>
                </div>
              </div>

              <div>
                <h3>Links</h3>
                <ul
                  className="link-list"
                  id="detail-links"
                  dangerouslySetInnerHTML={{
                    __html: (selected.links || []).map(renderLinkItem).join('') || '<li><em>No links configured.</em></li>',
                  }}
                />
              </div>

              <div>
                <h3>External URLs</h3>
                <ul className="link-list" id="detail-external">
                  {(selected.externalUrls || []).length ? (
                    selected.externalUrls!.map((l) => (
                      <li key={l.url} className="link-item">
                        <a href={l.url} target="_blank" rel="noreferrer">
                          {l.label}
                        </a>
                      </li>
                    ))
                  ) : (
                    <li>
                      <em>No external URL configured.</em>
                    </li>
                  )}
                </ul>
              </div>

              <div>
                <h3>Next steps</h3>
                <ul id="detail-next">
                  {(selected.nextSteps || []).map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3>Owners</h3>
                <div className="owners" id="detail-owners">
                  {(selected.owners || []).map((o) => (
                    <span key={o} className="owner-pill">
                      {o}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3>Tags</h3>
                <div className="owners" id="detail-tags">
                  {(selected.tags || []).map((t) => (
                    <span key={t} className="owner-pill">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <a
                className="tele-button"
                target="_blank"
                rel="noreferrer"
                href={`https://t.me/share/url?url=${encodeURIComponent('Project HQ')}&text=${encodeURIComponent(
                  `Working on: ${selected.name}`
                )}`}
              >
                <span className="tele-dot" />
                <span>Ping Telegram</span>
              </a>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}
