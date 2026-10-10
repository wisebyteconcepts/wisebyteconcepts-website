/**
 * Indian Standard Time (IST, Asia/Kolkata) date and time formatter.
 * Formats dates like: "10 Oct 2026, 3:45 PM IST"
 */
export function formatToIST(dateInput: string | number | Date | null | undefined): string {
  if (!dateInput) return '—';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);

    // Format parts in Asia/Kolkata timezone
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
 * Format: WBC-XXXXXX (always uppercase)
 */
export function generateReferenceToken(idOrSeed?: string): string {
  if (idOrSeed && idOrSeed.startsWith('WBC-')) {
    return idOrSeed.toUpperCase();
  }
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // exclude ambiguous characters
  let randomPart = '';
  for (let i = 0; i < 6; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `WBC-${randomPart}`.toUpperCase();
}
