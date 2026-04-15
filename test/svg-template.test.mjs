import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderCommitsSvg } from '../scripts/lib/svg-template.mjs';

const sampleCommits = [
  { sha: 'a', repo: 'brainctl', date: '2026-04-15T10:00:00Z', message: 'refactor memory bus TTL pruning' },
  { sha: 'b', repo: 'brainctl', date: '2026-04-15T09:30:00Z', message: 'bump version to 1.6.0' },
  { sha: 'c', repo: 'costclock', date: '2026-04-14T22:15:00Z', message: 'drop 400 lines from auth layer' },
  { sha: 'd', repo: 'brainctl', date: '2026-04-14T18:00:00Z', message: 'add plugin integration surface' },
  { sha: 'e', repo: 'windsurf-mcp', date: '2026-04-13T20:00:00Z', message: 'add batch edit support' },
];

test('produces an SVG string', () => {
  const svg = renderCommitsSvg(sampleCommits);
  assert.ok(svg.startsWith('<svg'));
  assert.ok(svg.endsWith('</svg>'));
});

test('is deterministic — same input yields identical output', () => {
  const first = renderCommitsSvg(sampleCommits);
  const second = renderCommitsSvg(sampleCommits);
  assert.equal(first, second);
});

test('contains no timestamps, random IDs, or wall-clock values', () => {
  const svg = renderCommitsSvg(sampleCommits);
  // rough sanity — these would make two calls diverge
  const now = String(Date.now()).slice(0, 6);
  assert.ok(!svg.includes(now));
  assert.ok(!/\bid="[a-f0-9]{6,}"/.test(svg));
});

test('contains the aged-paper background color', () => {
  const svg = renderCommitsSvg(sampleCommits);
  assert.ok(svg.includes('#1f1a10'));
});

test('contains the paper-text color', () => {
  const svg = renderCommitsSvg(sampleCommits);
  assert.ok(svg.includes('#d4c4a3'));
});

test('contains the heading "RECENT COMMITS"', () => {
  const svg = renderCommitsSvg(sampleCommits);
  assert.ok(svg.includes('RECENT COMMITS'));
});

test('contains the live auto-updated subtitle', () => {
  const svg = renderCommitsSvg(sampleCommits);
  assert.ok(svg.includes('live · auto-updated hourly'));
});

test('contains each commit repo name as a bracketed tag', () => {
  const svg = renderCommitsSvg(sampleCommits);
  assert.ok(svg.includes('[brainctl]'));
  assert.ok(svg.includes('[costclock]'));
  assert.ok(svg.includes('[windsurf-mcp]'));
});

test('contains each commit message', () => {
  const svg = renderCommitsSvg(sampleCommits);
  for (const c of sampleCommits) {
    assert.ok(svg.includes(c.message), `missing: ${c.message}`);
  }
});

test('formats date as MM-DD from ISO timestamp', () => {
  const svg = renderCommitsSvg([
    { sha: 'x', repo: 'r', date: '2026-04-15T10:00:00Z', message: 'm' },
  ]);
  assert.ok(svg.includes('04-15'));
});

test('uses serif font-family for body text', () => {
  const svg = renderCommitsSvg(sampleCommits);
  assert.ok(svg.includes("Iowan Old Style") || svg.includes('Georgia'));
});

test('uses monospace font-family for repo tags', () => {
  const svg = renderCommitsSvg(sampleCommits);
  assert.ok(svg.includes('SF Mono') || svg.includes('Monaco'));
});

test('scales svg height with commit count', () => {
  const one = renderCommitsSvg([sampleCommits[0]]);
  const five = renderCommitsSvg(sampleCommits);
  const oneHeight = Number(one.match(/height="(\d+)"/)[1]);
  const fiveHeight = Number(five.match(/height="(\d+)"/)[1]);
  assert.ok(fiveHeight > oneHeight);
});

test('handles empty commit list without crashing', () => {
  const svg = renderCommitsSvg([]);
  assert.ok(svg.startsWith('<svg'));
  assert.ok(svg.includes('#1f1a10'));
});
