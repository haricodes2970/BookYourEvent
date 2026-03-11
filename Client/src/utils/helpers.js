/**
 * helpers.js — BookYourEvent shared utilities
 *
 * Drop-in replacements for ad-hoc formatting scattered across components.
 * All helpers are pure functions (no side effects, no imports needed).
 */

// ── Currency ──────────────────────────────────────────────────────────────

/**
 * Format a number as Indian Rupees.
 * formatINR(12500)  →  "₹12,500"
 * formatINR(1234567) → "₹12,34,567"
 */
export const formatINR = (amount) => {
  if (typeof amount !== 'number' || Number.isNaN(amount)) return '₹--';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Compact version for cards/badges.
 * formatINRCompact(125000) → "₹1.25L"
 */
export const formatINRCompact = (amount) => {
  if (typeof amount !== 'number' || Number.isNaN(amount)) return '₹--';
  if (amount >= 1_00_00_000) return `₹${(amount / 1_00_00_000).toFixed(1)}Cr`;
  if (amount >= 1_00_000)    return `₹${(amount / 1_00_000).toFixed(1)}L`;
  if (amount >= 1_000)       return `₹${(amount / 1_000).toFixed(1)}K`;
  return `₹${amount}`;
};


// ── Dates ─────────────────────────────────────────────────────────────────

/**
 * Format a date value (string | Date | number) to Indian locale.
 * formatDateIN('2025-06-15') → "15 Jun 2025"
 */
export const formatDateIN = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });
};

/**
 * Format a datetime value with time.
 * formatDateTimeIN('2025-06-15T14:30:00Z') → "15 Jun 2025, 8:00 pm"
 */
export const formatDateTimeIN = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  });
};

/**
 * Returns a relative time label.
 * timeAgo(new Date(Date.now() - 60000)) → "1 minute ago"
 */
export const timeAgo = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  const intervals = [
    [31536000, 'year'],
    [2592000,  'month'],
    [86400,    'day'],
    [3600,     'hour'],
    [60,       'minute'],
    [1,        'second'],
  ];
  for (const [secs, label] of intervals) {
    const count = Math.floor(seconds / secs);
    if (count >= 1) return `${count} ${label}${count !== 1 ? 's' : ''} ago`;
  }
  return 'just now';
};

/**
 * Returns true if the given date string is in the future.
 * isUpcoming('2030-01-01') → true
 */
export const isUpcoming = (value) => new Date(value) > new Date();

/**
 * Check if a date string (YYYY-MM-DD) is today.
 */
export const isToday = (value) => {
  const d = new Date(value);
  const t = new Date();
  return (
    d.getFullYear() === t.getFullYear() &&
    d.getMonth()    === t.getMonth()    &&
    d.getDate()     === t.getDate()
  );
};


// ── Strings ───────────────────────────────────────────────────────────────

/**
 * Capitalise the first letter of every word.
 * titleCase('hello world') → "Hello World"
 */
export const titleCase = (str = '') =>
  str.replace(/\b\w/g, (c) => c.toUpperCase());

/**
 * Truncate a string with an ellipsis.
 * truncate('Long text here', 10) → "Long text…"
 */
export const truncate = (str = '', max = 80) =>
  str.length > max ? str.slice(0, max).trimEnd() + '…' : str;

/**
 * Extract initials for avatar fallbacks.
 * getInitials('Srihari Prasad') → "SP"
 */
export const getInitials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');


// ── Time slots ────────────────────────────────────────────────────────────

/**
 * Generate an array of time strings for slot pickers.
 * generateTimeSlots(9, 22, 60) → ["09:00", "10:00", ...]
 */
export const generateTimeSlots = (startHour = 6, endHour = 23, intervalMinutes = 30) => {
  const slots = [];
  for (let h = startHour; h <= endHour; h++) {
    for (let m = 0; m < 60; m += intervalMinutes) {
      if (h === endHour && m > 0) break;
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return slots;
};

/**
 * Convert "14:30" to "2:30 PM"
 */
export const to12Hour = (time24 = '') => {
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr || '00';
  const period = h >= 12 ? 'PM' : 'AM';
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${period}`;
};


// ── Booking / venue helpers ───────────────────────────────────────────────

/**
 * Map a booking status to a display colour.
 */
export const statusColor = (status) => {
  const map = {
    pending:   { bg: 'rgba(251,191,36,0.15)',  text: '#92400e' },
    approved:  { bg: 'rgba(74,222,128,0.15)',  text: '#166534' },
    rejected:  { bg: 'rgba(239,68,68,0.15)',   text: '#991b1b' },
    paid:      { bg: 'rgba(59,130,246,0.15)',  text: '#1d4ed8' },
    expired:   { bg: 'rgba(148,163,184,0.15)', text: '#475569' },
    cancelled: { bg: 'rgba(239,68,68,0.12)',   text: '#9f1239' },
  };
  return map[status] ?? { bg: 'rgba(148,163,184,0.1)', text: '#64748b' };
};

/**
 * Compute how many minutes are left until a deadline.
 * Returns 0 if the deadline has passed.
 */
export const minutesUntil = (deadline) => {
  const ms = new Date(deadline) - Date.now();
  return ms > 0 ? Math.floor(ms / 60000) : 0;
};
