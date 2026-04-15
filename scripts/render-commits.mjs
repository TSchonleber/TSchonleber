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
  const headers = {
    'User-Agent': 'tschonleber-profile-updater',
    Accept: 'application/vnd.github+json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // Step 1: Fetch recent public events. The /events/public endpoint returns
  // PushEvents with metadata (ref, head SHA, before SHA) but NOT the commits
  // array — that has to be fetched separately.
  const eventsRes = await fetch(
    `https://api.github.com/users/${USER}/events/public?per_page=100`,
    { headers },
  );
  if (!eventsRes.ok) {
    throw new Error(`GitHub events API ${eventsRes.status} ${eventsRes.statusText}`);
  }
  const rawEvents = await eventsRes.json();

  // Step 2: For each PushEvent (up to a cap), fetch the head commit's details
  // and rebuild the event into the shape dedupeCommits expects.
  const MAX_PUSH_LOOKUPS = 10;
  const pushes = rawEvents.filter(e => e.type === 'PushEvent').slice(0, MAX_PUSH_LOOKUPS);

  const enriched = [];
  for (const e of pushes) {
    const sha = e.payload?.head;
    const repoFull = e.repo?.name;
    if (!sha || !repoFull) continue;

    try {
      const commitRes = await fetch(
        `https://api.github.com/repos/${repoFull}/commits/${sha}`,
        { headers },
      );
      if (!commitRes.ok) continue;
      const commitJson = await commitRes.json();
      const fullMessage = commitJson.commit?.message ?? '';
      // Only keep the first line of the commit message (the summary)
      const summaryMessage = fullMessage.split('\n')[0];

      enriched.push({
        type: 'PushEvent',
        created_at: e.created_at,
        repo: { name: repoFull },
        payload: {
          commits: [{ sha, message: summaryMessage }],
        },
      });
    } catch (err) {
      // Skip this push and continue — don't break the whole render on one bad commit fetch
      continue;
    }
  }

  return enriched;
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
