'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import useSWR from 'swr';

type Project = {
  id: string;
  name: string;
  status: string;
  summary: string;
  architecture: string;
  techStack: string[];
  links: { label: string; url: string }[];
  externalUrls: { label: string; url: string }[];
  nextSteps: string[];
  owners: string[];
  tags: string[];
};

const fetcher = async (url: string) => {
  const res = await fetch(url, { cache: 'no-store' });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error ? `${json.error} (${res.status})` : `HTTP ${res.status}`);
  return json;
};

function statusClass(status: string) {
  if (status === 'running') return 'status-running';
  if (status === 'planning') return 'status-planning';
  return 'status-paused';
}

function telegramShareLink(project: Project) {
  const message = encodeURIComponent(`Working on ${project.name} via Project HQ. What's next?`);
  return `https://t.me/share/url?url=&text=${message}`;
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

  const projects: Project[] = data?.projects ?? [];

  const [activeFilter, setActiveFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Project | null>(null);

  const detailPanelRef = useRef<HTMLDivElement | null>(null);

  const statuses = useMemo(() => {
    const set = new Set(projects.map((p) => p.status));
    return ['all', ...Array.from(set)];
  }, [projects]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects.filter((project) => {
      const matchesStatus = activeFilter === 'all' || project.status === activeFilter;
      const matchesQuery = [project.name, project.summary, (project.tags || []).join(' ')].some((value) =>
        String(value || '').toLowerCase().includes(q)
      );
      return matchesStatus && matchesQuery;
    });
  }, [projects, query, activeFilter]);

  // Wire copy buttons inside the detail panel
  useEffect(() => {
    const root = detailPanelRef.current;
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
        prompt('Copy this path:', text);
      }
    };
    root.addEventListener('click', handler);
    return () => root.removeEventListener('click', handler);
  }, [selected]);

  // close on background click
  useEffect(() => {
    const root = detailPanelRef.current;
    if (!root) return;
    const onClick = (event: any) => {
      if (event.target === root) setSelected(null);
    };
    root.addEventListener('click', onClick);
    return () => root.removeEventListener('click', onClick);
  }, []);

  if (isLoading) {
    return (
      <div style={{ padding: '24px', color: '#fff' }}>
        <link rel="stylesheet" href="/phq/styles.css" />
        Loading…
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

      <div id="filters">
        {statuses.map((status) => (
          <button
            key={status}
            className={`filter-btn ${status === activeFilter ? 'active' : ''}`}
            onClick={() => setActiveFilter(status)}
          >
            {status === 'all' ? 'All projects' : status}
          </button>
        ))}
      </div>

      <div className="search-wrap">
        <input
          id="search-input"
          placeholder="Search by name, summary, or tag"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <main id="project-grid">
        {filtered.length ? (
          filtered.map((project) => (
            <article key={project.id} className="project-card">
              <div className={`status-pill ${statusClass(project.status)}`}>
                <span>{project.status}</span>
              </div>
              <h3>{project.name}</h3>
              <p>{project.summary}</p>
              <div className="owners">
                {(project.owners || []).map((owner) => (
                  <span key={owner} className="owner-chip">
                    {owner}
                  </span>
                ))}
              </div>
              <div className="owners">
                {(project.tags || []).map((tag) => (
                  <span key={tag} className="tag-chip">
                    {tag}
                  </span>
                ))}
              </div>
              <button onClick={() => setSelected(project)}>View details</button>
            </article>
          ))
        ) : (
          <p style={{ color: 'var(--muted)' }}>No projects matched that filter.</p>
        )}
      </main>

      <div id="detail-panel" className={`detail-panel ${selected ? 'visible' : ''}`} ref={detailPanelRef}>
        <div className="card">
          <button className="close-btn" aria-label="Close detail" onClick={() => setSelected(null)}>
            ×
          </button>

          {selected ? (
            <>
              <div>
                <div className={`status-pill ${statusClass(selected.status)}`} id="detail-status">
                  Running
                </div>
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
                  {(selected.externalUrls || []).map((link) => (
                    <li key={link.url} className="link-item">
                      <a href={link.url} target="_blank" rel="noreferrer">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3>Next steps</h3>
                <ul id="detail-next">
                  {(selected.nextSteps || []).map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3>Owners</h3>
                <div className="owners" id="detail-owners">
                  {(selected.owners || []).map((owner) => (
                    <span key={owner} className="owner-chip">
                      {owner}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3>Tags</h3>
                <div className="owners" id="detail-tags">
                  {(selected.tags || []).map((tag) => (
                    <span key={tag} className="tag-chip">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <a id="telegram-action" className="tele-button" target="_blank" rel="noreferrer" href={telegramShareLink(selected)}>
                <span className="tele-dot"></span>
                <span className="tele-icon-wrap">
                  <svg className="tele-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" role="img" aria-hidden="true">
                    <path d="M16 8a8 8 0 1 1-16 0 8 8 0 0 1 16 0zm-7.713-2.094c-1.168.486-4.666 2.01-4.666 2.01-.567.225-.595.442-.604.518-.03.243.275.339.69.47l.175.055c.408.133.958.288 1.243.294.39.01.868-.32 3.374-2.23.05-.012.12-.026.166.016s.042.12.037.141c-.03.129-1.227 1.241-1.846 1.817-.193.18-.33.307-.358.336-.189.198-.664.663-.664.663l-.188.186c-.38.366-.664.64.015 1.088.327.216.589.393.85.571.284.194.568.387.936.629.14.092.27.187.33.22.331.236.63.448.997.414.214-.02.435-.22.547-.82.265-1.417.786-4.486.906-5.751a1.4 1.4 0 0 0-.013-.315.34.34 0 0 0-.114-.217.53.53 0 0 0-.31-.093c-.3.005-.763.166-2.984 1.09z" />
                  </svg>
                </span>
                <span>Ping Telegram</span>
              </a>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}
