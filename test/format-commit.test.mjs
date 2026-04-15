import { test } from 'node:test';
import assert from 'node:assert/strict';
import { truncate, xmlEscape } from '../scripts/lib/format-commit.mjs';

test('truncate leaves short strings unchanged', () => {
  assert.equal(truncate('hello', 60), 'hello');
});

test('truncate leaves boundary-length strings unchanged', () => {
  const sixty = 'a'.repeat(60);
  assert.equal(truncate(sixty, 60), sixty);
});

test('truncate shortens long strings and appends ellipsis', () => {
  const longMsg = 'a'.repeat(70);
  const result = truncate(longMsg, 60);
  assert.equal(result.length, 60);
  assert.ok(result.endsWith('…'));
  assert.equal(result, 'a'.repeat(59) + '…');
});

test('truncate handles empty string', () => {
  assert.equal(truncate('', 60), '');
});

test('xmlEscape replaces ampersand', () => {
  assert.equal(xmlEscape('a & b'), 'a &amp; b');
});

test('xmlEscape replaces less-than', () => {
  assert.equal(xmlEscape('x < y'), 'x &lt; y');
});

test('xmlEscape replaces greater-than', () => {
  assert.equal(xmlEscape('x > y'), 'x &gt; y');
});

test('xmlEscape replaces all three in one string', () => {
  assert.equal(xmlEscape('<a & b>'), '&lt;a &amp; b&gt;');
});

test('xmlEscape leaves safe characters alone', () => {
  assert.equal(xmlEscape("brainctl's memory bus"), "brainctl's memory bus");
});

test('xmlEscape replaces ampersand first (avoiding double-escape)', () => {
  // If we replaced < first, then &, we'd turn "<" into "&lt;" then "&amp;lt;"
  assert.equal(xmlEscape('<'), '&lt;');
});
