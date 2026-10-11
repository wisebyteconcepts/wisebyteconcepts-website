/**
 * Formats a date/timestamp in Indian Standard Time (Asia/Kolkata).
 * Example: "10 Oct 2026, 3:45 PM IST"
 */
export function formatISTDate(dateInput: string | number | Date | null | undefined): string {
  if (!dateInput) return '—';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    const day = new Intl.DateTimeFormat('en-GB', { day: 'numeric', timeZone: 'Asia/Kolkata' }).format(d);
    const month = new Intl.DateTimeFormat('en-GB', { month: 'short', timeZone: 'Asia/Kolkata' }).format(d);
    const year = new Intl.DateTimeFormat('en-GB', { year: 'numeric', timeZone: 'Asia/Kolkata' }).format(d);
    const time = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    }).format(d);
    return `${day} ${month} ${year}, ${time} IST`;
  } catch {
    return String(dateInput);
  }
}

/**
 * Generates an uppercase reference token for queries.
 * Example: "WBC-7K3N9X2P"
 */
export function generateReferenceToken(prefix: string = 'WBC'): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let token = '';
  const cryptoObj = typeof window !== 'undefined' ? window.crypto : null;
  if (cryptoObj && cryptoObj.getRandomValues) {
    const bytes = new Uint8Array(8);
    cryptoObj.getRandomValues(bytes);
    for (let i = 0; i < 8; i++) {
      token += chars[bytes[i] % chars.length];
    }
  } else {
    for (let i = 0; i < 8; i++) {
      token += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  return `${prefix}-${token}`.toUpperCase();
}
