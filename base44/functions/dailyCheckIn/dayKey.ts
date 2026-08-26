const MAX_TIMEZONE_LENGTH = 100;

function getUtcDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function getDayKeyForTimezone(timezone: string, date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));

  if (!values.year || !values.month || !values.day) {
    throw new RangeError('Unable to derive a local day key');
  }

  return `${values.year}-${values.month}-${values.day}`;
}

export function resolveDayKey(timezone: unknown, date = new Date()): string {
  const normalized = typeof timezone === 'string' ? timezone.trim() : '';
  if (!normalized || normalized.length > MAX_TIMEZONE_LENGTH) {
    return getUtcDayKey(date);
  }

  try {
    return getDayKeyForTimezone(normalized, date);
  } catch {
    return getUtcDayKey(date);
  }
}
