/**
 * Walks a reverse-chronological list of GitHub events and returns up to `max`
 * unique commits (by SHA), preserving the order in which they appear.
 *
 * Input: array of GitHub API events from /users/:u/events/public
 * Output: array of { sha, repo, message, date }
 *
 * Pure function. No I/O.
 */
export function dedupeCommits(events, max) {
  const seen = new Set();
  const out = [];

  for (const event of events) {
    if (event.type !== 'PushEvent') continue;

    const repoFull = event.repo?.name ?? '';
    const repo = repoFull.includes('/') ? repoFull.split('/')[1] : repoFull;
    const date = event.created_at;
    const commits = event.payload?.commits ?? [];

    for (const commit of commits) {
      if (seen.has(commit.sha)) continue;
      seen.add(commit.sha);
      out.push({
        sha: commit.sha,
        repo,
        message: commit.message,
        date,
      });
      if (out.length >= max) return out;
    }
  }

  return out;
}
