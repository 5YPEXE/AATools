/**
 * Formats a transit line ID for display.
 * Line IDs > 999 encode a variant/direction suffix in the last digit:
 *   1001 → "100-1"   (line 100, variant 1)
 *   1491 → "149-1"   (line 149, variant 1)
 *   1052 → "105-2"   (line 105, variant 2)
 * Line IDs ≤ 999 are displayed as-is.
 */
export function formatLineId(id) {
  if (id > 999) {
    const base   = Math.floor(id / 10);
    const suffix = id % 10;
    return `${base}-${suffix}`;
  }
  return String(id);
}
