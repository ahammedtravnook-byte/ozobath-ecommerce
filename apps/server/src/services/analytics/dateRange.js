// ============================================
// OZOBATH - Dashboard Date Ranges
// ============================================
// Resolves a range key into concrete bounds, plus the immediately preceding
// window of equal length for period-over-period comparison.
//
// The comparison window is always the same DURATION as the selection, ending
// the instant before it begins. Comparing a 7-day window against a 30-day one
// produces a meaningless delta, so length is never inferred from the calendar.

const MS_PER_DAY = 86400000;

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const endOfDay = (d) => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
};

// Keys the UI may request. Anything else falls back to 30d.
const RANGE_KEYS = ['today', '7d', '30d', '90d', 'mtd', 'ytd', 'custom'];

const resolveRange = ({ range = '30d', from, to } = {}) => {
  const now = new Date();
  let start;
  let end = endOfDay(now);

  switch (range) {
    case 'today':
      start = startOfDay(now);
      break;
    case '7d':
      start = startOfDay(new Date(now.getTime() - 6 * MS_PER_DAY));
      break;
    case '90d':
      start = startOfDay(new Date(now.getTime() - 89 * MS_PER_DAY));
      break;
    case 'mtd':
      start = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
      break;
    case 'ytd':
      start = startOfDay(new Date(now.getFullYear(), 0, 1));
      break;
    case 'custom': {
      // Fall back to 30d if either bound is missing or unparseable, rather
      // than returning an Invalid Date that silently matches nothing.
      const parsedFrom = from && !Number.isNaN(Date.parse(from)) ? new Date(from) : null;
      const parsedTo = to && !Number.isNaN(Date.parse(to)) ? new Date(to) : null;
      if (parsedFrom && parsedTo) {
        start = startOfDay(parsedFrom);
        end = endOfDay(parsedTo);
      } else {
        start = startOfDay(new Date(now.getTime() - 29 * MS_PER_DAY));
      }
      break;
    }
    case '30d':
    default:
      start = startOfDay(new Date(now.getTime() - 29 * MS_PER_DAY));
      break;
  }

  // Previous window: same length, ending 1ms before the current one starts.
  const durationMs = end.getTime() - start.getTime();
  const previousEnd = new Date(start.getTime() - 1);
  const previousStart = new Date(previousEnd.getTime() - durationMs);

  return {
    key: RANGE_KEYS.includes(range) ? range : '30d',
    from: start,
    to: end,
    previousFrom: previousStart,
    previousTo: previousEnd,
    days: Math.max(1, Math.round(durationMs / MS_PER_DAY)),
  };
};

module.exports = { resolveRange, RANGE_KEYS };
