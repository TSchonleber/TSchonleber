/**
 * Renders an array of formatted commits into a deterministic SVG string.
 * Same input produces byte-identical output. No timestamps, no random IDs.
 * Pure function.
 *
 * Expects each commit shaped as { sha, repo, message, date } where date
 * is an ISO-8601 string and message has already been truncated / escaped.
 */

const PALETTE = {
  bg: '#1f1a10',
  text: '#d4c4a3',
  heading: '#c9a877',
  dates: '#e8d8b4',
  repoTag: '#ffb85c',
  border: '#5a4a2e',
  subtitle: '#8b7a55',
};

const WIDTH = 850;
const PAD_X = 30;
const HEADING_Y = 34;
const RULE_Y = 46;
const FIRST_ROW_Y = 78;
const LINE_H = 24;
const BOTTOM_PAD = 24;

const SERIF = "'Iowan Old Style', Georgia, serif";
const MONO = "'SF Mono', Monaco, Consolas, monospace";

function formatMonthDay(iso) {
  const d = new Date(iso);
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${mm}-${dd}`;
}

export function renderCommitsSvg(commits) {
  const rowCount = Math.max(commits.length, 1);
  const height = FIRST_ROW_Y + rowCount * LINE_H + BOTTOM_PAD;

  const rows = commits.map((c, i) => {
    const y = FIRST_ROW_Y + i * LINE_H;
    const date = formatMonthDay(c.date);
    return `  <text x="${PAD_X}" y="${y}" font-size="14" fill="${PALETTE.text}" font-family="${SERIF}"><tspan fill="${PALETTE.dates}" font-weight="700">${date}</tspan>  <tspan font-family="${MONO}" fill="${PALETTE.repoTag}">[${c.repo}]</tspan>  ${c.message}</text>`;
  }).join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${height}" viewBox="0 0 ${WIDTH} ${height}" xml:space="preserve">
  <rect width="${WIDTH}" height="${height}" fill="${PALETTE.bg}"/>
  <text x="${PAD_X}" y="${HEADING_Y}" font-size="12" font-weight="700" letter-spacing="2" fill="${PALETTE.heading}" font-family="${SERIF}">RECENT COMMITS</text>
  <text x="${WIDTH - PAD_X}" y="${HEADING_Y}" font-size="10" font-style="italic" text-anchor="end" fill="${PALETTE.subtitle}" font-family="${SERIF}">live · auto-updated hourly</text>
  <line x1="${PAD_X}" y1="${RULE_Y}" x2="${WIDTH - PAD_X}" y2="${RULE_Y}" stroke="${PALETTE.border}" stroke-dasharray="4 3"/>
${rows}
</svg>`;
}
