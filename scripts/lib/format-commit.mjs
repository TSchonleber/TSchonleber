/**
 * Truncate a string to at most `max` characters, appending an ellipsis
 * if it had to be cut. The ellipsis counts toward `max`.
 * Pure function.
 */
export function truncate(str, max) {
  if (str.length <= max) return str;
  return str.slice(0, max - 1) + '…';
}

/**
 * XML-escape the three characters that break SVG text content.
 * Order matters: `&` must be replaced first, otherwise replacing `<` -> `&lt;`
 * would cause a second pass to turn the new `&` into `&amp;`.
 * Pure function.
 */
export function xmlEscape(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
