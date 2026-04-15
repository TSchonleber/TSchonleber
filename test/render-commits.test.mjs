import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { commitsToSvg } from '../scripts/render-commits.mjs';

const events = JSON.parse(
  readFileSync(new URL('./fixtures/events-sample.json', import.meta.url), 'utf8')
);

test('commitsToSvg produces deterministic output', () => {
  assert.equal(commitsToSvg(events), commitsToSvg(events));
});

test('commitsToSvg returns a valid SVG root', () => {
  const svg = commitsToSvg(events);
  assert.ok(svg.startsWith('<svg'));
  assert.ok(svg.endsWith('</svg>'));
});

test('commitsToSvg truncates long commit messages', () => {
  const svg = commitsToSvg(events);
  // Event 3 has the intentionally-long message
  assert.ok(svg.includes('…'), 'expected truncation ellipsis');
  // The full long message must NOT be present
  assert.ok(!svg.includes('exceeds the sixty character truncation limit'));
});

test('commitsToSvg includes five repo tags for a populated fixture', () => {
  const svg = commitsToSvg(events);
  const matches = svg.match(/\[(brainctl|costclock|windsurf-mcp)\]/g) ?? [];
  assert.equal(matches.length, 5);
});

test('commitsToSvg escapes commit messages containing XML-hostile chars', () => {
  const hostile = [
    {
      type: 'PushEvent',
      created_at: '2026-04-15T00:00:00Z',
      repo: { name: 'Tschonleber/x' },
      payload: {
        commits: [{ sha: 'h1', message: 'fix <script> & >redirect' }],
      },
    },
  ];
  const svg = commitsToSvg(hostile);
  assert.ok(svg.includes('&lt;script&gt;'));
  assert.ok(svg.includes('&amp;'));
  assert.ok(svg.includes('&gt;redirect'));
});

test('commitsToSvg truncates BEFORE escaping (order matters)', () => {
  // A message that is both >60 chars long AND contains an XML-hostile char
  // near the truncation point. Correct order (truncate-then-escape) yields
  // a valid entity (`&lt;ta…`) before the ellipsis. Wrong order (escape-then-truncate)
  // would cut inside the `&lt;` entity, producing a broken `&lt` (unterminated).
  const events = [{
    type: 'PushEvent',
    created_at: '2026-04-15T00:00:00Z',
    repo: { name: 'Tschonleber/x' },
    payload: { commits: [{ sha: 'ord', message: 'a'.repeat(55) + 'x<tail' }] },
  }];
  const svg = commitsToSvg(events);
  // Correct output contains the complete escaped entity followed by truncation
  assert.ok(svg.includes('&lt;ta…'), 'truncate-then-escape must produce complete entity before ellipsis');
  // Wrong output would have an unterminated &lt followed by ellipsis
  assert.ok(!/&lt…/.test(svg), 'ellipsis must not land directly after &lt (unterminated entity)');
});
