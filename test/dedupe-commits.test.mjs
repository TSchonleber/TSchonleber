import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dedupeCommits } from '../scripts/lib/dedupe-commits.mjs';

const events = JSON.parse(
  readFileSync(new URL('./fixtures/events-sample.json', import.meta.url), 'utf8')
);

test('returns exactly max commits when enough exist', () => {
  const result = dedupeCommits(events, 5);
  assert.equal(result.length, 5);
});

test('returns all unique commits when max exceeds available', () => {
  const result = dedupeCommits(events, 100);
  // 7 push commits in fixture - 1 duplicate (aaa in events 1 and 6) = 6 unique
  assert.equal(result.length, 6);
});

test('filters out non-PushEvent entries', () => {
  const result = dedupeCommits(events, 100);
  // WatchEvent (event 7) must not contribute
  assert.ok(!result.some(c => c.sha === undefined));
  assert.equal(result.length, 6);
});

test('deduplicates by SHA across events', () => {
  const result = dedupeCommits(events, 100);
  const shas = result.map(c => c.sha);
  assert.equal(shas.length, new Set(shas).size);
});

test('preserves reverse-chronological order from input', () => {
  const result = dedupeCommits(events, 100);
  // Event 1 is newest, so its commits come first (aaa, bbb)
  assert.equal(result[0].sha, 'aaa');
  assert.equal(result[1].sha, 'bbb');
  // Event 2 next
  assert.equal(result[2].sha, 'ccc');
});

test('returns objects with sha, repo, message, date', () => {
  const result = dedupeCommits(events, 1);
  assert.equal(result[0].sha, 'aaa');
  assert.equal(result[0].repo, 'brainctl');
  assert.equal(result[0].message, 'refactor memory bus TTL pruning');
  assert.equal(result[0].date, '2026-04-15T10:00:00Z');
});

test('strips owner prefix from repo name', () => {
  const result = dedupeCommits(events, 100);
  for (const c of result) {
    assert.ok(!c.repo.includes('/'), `repo "${c.repo}" should not contain slash`);
  }
});

test('returns empty array when no PushEvents present', () => {
  const onlyWatch = [{ type: 'WatchEvent', created_at: '2026-01-01T00:00:00Z' }];
  assert.deepEqual(dedupeCommits(onlyWatch, 5), []);
});

test('returns empty array for empty input', () => {
  assert.deepEqual(dedupeCommits([], 5), []);
});
