import { writeFileSync } from 'node:fs';
import { dedupeCommits } from './lib/dedupe-commits.mjs';
import { truncate, xmlEscape } from './lib/format-commit.mjs';
import { renderCommitsSvg } from './lib/svg-template.mjs';

const MAX_COMMITS = 5;
const MAX_MSG_LEN = 60;
const USER = 'Tschonleber';

/**
 * Pure pipeline: raw GitHub events -> deterministic SVG string.
 * Exported for testing; `main()` wraps this with network + filesystem I/O.
 */
export function commitsToSvg(events) {
  const raw = dedupeCommits(events, MAX_COMMITS);
  const formatted = raw.map(c => ({
    sha: c.sha,
    repo: xmlEscape(c.repo),
    message: xmlEscape(truncate(c.message, MAX_MSG_LEN)),
    date: c.date,
  }));
  return renderCommitsSvg(formatted);
}

async function fetchEvents() {
  const token = process.env.GITHUB_TOKEN;
  const url = `https://api.github.com/users/${USER}/events/public?per_page=100`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'tschonleber-profile-updater',
      Accept: 'application/vnd.github+json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    throw new Error(`GitHub API ${res.status} ${res.statusText}`);
  }
  return await res.json();
}

async function main() {
  const events = await fetchEvents();
  const svg = commitsToSvg(events);
  const outPath = new URL('../assets/recent-commits.svg', import.meta.url);
  writeFileSync(outPath, svg, 'utf8');
  console.log(`wrote ${outPath.pathname}`);
}

// Run main() only when invoked directly (not when imported by tests).
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
