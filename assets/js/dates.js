// Partial ISO dates ("2024", "2024-10", "2024-10-15"), shown with the precision
// they were written with. Keep in sync with _includes/date.html: both must
// produce exactly the same text.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Normalises a date value from the embedded JSON to an ISO string ('' if empty). */
export function isoDate(value) {
  return value == null ? '' : String(value).trim().slice(0, 10);
}

/** "2024" -> "2024", "2024-10" -> "Oct 2024", "2024-10-15" -> "15 Oct 2024". */
export function formatDate(value) {
  const iso = isoDate(value);
  if (!iso) return '';
  const [year, month, day] = iso.split('-');
  const monthName = MONTHS[Number(month) - 1];
  if (!monthName) return year;
  if (!day) return `${monthName} ${year}`;
  return `${Number(day)} ${monthName} ${year}`;
}

/**
 * "Oct 2024 – Jan 2026". An empty end means "Present", or just the start
 * for point events ({ single: true }). Equal start and end collapse to one date.
 */
export function formatRange(start, end, { single = false } = {}) {
  const from = formatDate(start);
  const to = formatDate(end);
  if (!to) return single ? from : `${from} – Present`;
  return from === to ? from : `${from} – ${to}`;
}

/** Sorts partial ISO dates by plain string comparison (works with mixed precision). */
export function compareDates(a, b) {
  const left = isoDate(a);
  const right = isoDate(b);
  if (left === right) return 0;
  return left < right ? -1 : 1;
}
