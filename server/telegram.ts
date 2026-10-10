/**
 * Telegram Admin Notifications Service
 *
 * Implements server-only Telegram Bot notifications for new Contact form queries.
 * Features:
 * - HTML parse mode with robust user-input escaping
 * - 3x retry with backoff on network failures
 * - Silent skip when disabled or missing credentials
 * - Rate limiting (minimum delay between messages)
 * - Burst batching (aggregates multiple submissions arriving within window)
 * - Honeypot spam suppression
 * - Test message support
 */

export interface QueryServiceEntry {
  id: string;
  name: string;
  category?: string;
}

export interface QueryProjectEntry {
  id: string;
  name: string;
  parentService?: string;
}

export interface QueryPayload {
  id: string;
  referenceToken?: string;
  name: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  message?: string;
  services?: QueryServiceEntry[];
  projects?: QueryProjectEntry[];
  budget?: string;
  timeline?: string;
  contactMethod?: string;
  createdAt?: string;
  updatedAt?: string;
  isUpdate?: boolean;
  honeypot?: string;
  isSpam?: boolean;
}

// Runtime toggle state (can override env var in-memory via Admin settings)
let runtimeEnabled: boolean | null = null;

// Rate-limiting and burst-batching state
let lastSendTime = 0;
const BURST_WINDOW_MS = 2000;
const MIN_INTERVAL_MS = 3000;

interface QueueItem {
  query: QueryPayload;
  baseUrl: string;
  resolve: (value: { notified: boolean; skipped?: boolean }) => void;
}

let pendingQueue: QueueItem[] = [];
let flushTimeout: NodeJS.Timeout | null = null;

/**
 * Escapes user-provided text for Telegram HTML parse mode.
 * Telegram HTML supports: <b>, <i>, <u>, <s>, <a>, <code>, <pre>.
 * All other tags and characters (<, >, &, ", ') must be escaped.
 */
export function escapeHtml(text: string | null | undefined): string {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Checks if Telegram notifications are enabled.
 */
export function isNotificationsEnabled(): boolean {
  if (runtimeEnabled !== null) {
    return runtimeEnabled;
  }
  const envVal = (process.env.TELEGRAM_NOTIFICATIONS_ENABLED || 'true').trim().toLowerCase();
  return envVal !== 'false' && envVal !== 'off' && envVal !== '0';
}

/**
 * Sets the runtime notification state.
 */
export function setNotificationsEnabled(enabled: boolean): void {
  runtimeEnabled = enabled;
}

/**
 * Checks if required Telegram credentials are present in env.
 */
export function isTelegramConfigured(): boolean {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  return Boolean(token && token.trim().length > 0 && chatId && chatId.trim().length > 0);
}

/**
 * Formats date and time in Indian Standard Time (Asia/Kolkata).
 * Output example: "10 Oct 2026, 3:45 PM IST"
 */
function formatISTDate(dateInput: string | number | Date | null | undefined): string {
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
 * Formats a single query into a concise Telegram notification message.
 * Strict requirement: short, no full message body.
 */
export function formatSingleQueryMessage(query: QueryPayload, baseUrl: string): string {
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  const adminLink = `${cleanBaseUrl}/admin/queries?id=${encodeURIComponent(query.id)}`;

  const servicesList = query.services && query.services.length > 0
    ? query.services.map((s) => escapeHtml(s.name)).join(', ')
    : 'None';

  const projectsList = query.projects && query.projects.length > 0
    ? query.projects.map((p) => escapeHtml(p.name)).join(', ')
    : 'None';

  const budgetText = query.budget ? escapeHtml(query.budget) : 'Flexible / TBD';
  const timelineText = query.timeline ? escapeHtml(query.timeline) : 'Flexible';
  
  const targetDate = query.isUpdate && query.updatedAt ? query.updatedAt : (query.createdAt || Date.now());
  const formattedDateIST = formatISTDate(targetDate);
  const token = query.referenceToken ? query.referenceToken.toUpperCase() : (query.id ? query.id.toUpperCase() : 'WBC-QUERY');

  const titleHeader = query.isUpdate 
    ? `🔄 <b>Query updated</b>`
    : `📬 <b>New query received</b>`;

  const lines: string[] = [
    titleHeader,
    ``,
    `🏷 <b>Reference:</b> <code>${escapeHtml(token)}</code>`,
    `👤 <b>Sender:</b> ${escapeHtml(query.name)}`,
  ];

  // Email tappable link (mailto:)
  if (query.email && query.email.trim()) {
    const cleanEmail = query.email.trim();
    lines.push(`✉️ <b>Email:</b> <a href="mailto:${escapeHtml(cleanEmail)}">${escapeHtml(cleanEmail)}</a>`);
  }

  // Phone tappable link (tel:)
  if (query.phone && query.phone.trim()) {
    const cleanPhone = query.phone.trim();
    lines.push(`📞 <b>Phone:</b> <a href="tel:${escapeHtml(cleanPhone)}">${escapeHtml(cleanPhone)}</a>`);
  }

  // WhatsApp tappable link (https://wa.me/<digits only>)
  const waTarget = query.whatsapp && query.whatsapp.trim() ? query.whatsapp : query.phone;
  if (waTarget && waTarget.trim()) {
    const digitsOnly = waTarget.replace(/\D/g, '');
    if (digitsOnly) {
      lines.push(`💬 <b>WhatsApp:</b> <a href="https://wa.me/${digitsOnly}">+${digitsOnly}</a>`);
    }
  }

  lines.push(`🛠 <b>Service:</b> ${servicesList}`);
  lines.push(`📦 <b>Project:</b> ${projectsList}`);
  lines.push(`💰 <b>Budget:</b> ${budgetText}`);
  lines.push(`⏱ <b>Timeline:</b> ${timelineText}`);
  lines.push(`📅 <b>Time:</b> ${escapeHtml(formattedDateIST)}`);
  lines.push(``);
  lines.push(`🔗 <a href="${adminLink}">View Query in Admin Panel</a>`);

  return lines.join('\n');
}

/**
 * Formats a burst batch of multiple queries into a single message.
 */
export function formatBatchQueryMessage(queries: QueryPayload[], baseUrl: string): string {
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  const adminLink = `${cleanBaseUrl}/admin/queries`;

  const lines = [
    `🚨 <b>${queries.length} New queries received</b>`,
    ``,
  ];

  queries.slice(0, 8).forEach((q, idx) => {
    const svcs = q.services && q.services.length > 0 ? q.services.map((s) => s.name).join(', ') : 'Inquiry';
    const bud = q.budget ? ` (${q.budget})` : '';
    lines.push(
      `${idx + 1}. <b>${escapeHtml(q.name)}</b> – ${escapeHtml(svcs)}${escapeHtml(bud)}`
    );
  });

  if (queries.length > 8) {
    lines.push(`<i>...and ${queries.length - 8} more</i>`);
  }

  lines.push('');
  lines.push(`🔗 <a href="${adminLink}">Open Admin Queries</a>`);

  return lines.join('\n');
}

/**
 * Sends a message via the Telegram Bot API with retries and exponential backoff.
 * Endpoint: POST https://api.telegram.org/bot<TOKEN>/sendMessage
 */
export async function sendTelegramMessage(text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!isNotificationsEnabled() || !token || !chatId) {
    // Skip silently if notifications are disabled or env vars are missing (Requirement 4)
    return false;
  }

  const endpoint = `https://api.telegram.org/bot${token}/sendMessage`;
  const payload = {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: false,
  };

  const MAX_RETRIES = 3;
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        return true;
      }

      const errorBody = await response.text();
      console.warn(`[Telegram] Delivery attempt ${attempt + 1} failed (${response.status}): ${errorBody}`);
    } catch (err) {
      console.warn(`[Telegram] Delivery attempt ${attempt + 1} network error:`, err);
    }

    attempt++;
    if (attempt < MAX_RETRIES) {
      // Short backoff (500ms, 1000ms)
      await new Promise((resolve) => setTimeout(resolve, attempt * 500));
    }
  }

  console.error(`[Telegram] Delivery failed after ${MAX_RETRIES} attempts.`);
  return false;
}

/**
 * Sends a manual test message to verify Telegram credentials and delivery.
 */
export async function sendTestMessage(): Promise<{ success: boolean; error?: string }> {
  if (!isTelegramConfigured()) {
    return {
      success: false,
      error: 'TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not configured in the server environment.',
    };
  }

  const testContent = [
    `🧪 <b>Telegram Notification Test</b>`,
    ``,
    `Wise Byte Concepts admin notification integration is active!`,
    `When visitors submit inquiries on the Contact page, notifications will be delivered here automatically.`,
  ].join('\n');

  const success = await sendTelegramMessage(testContent);
  if (success) {
    return { success: true };
  }
  return {
    success: false,
    error: 'Failed to deliver message to Telegram. Please verify your Bot Token and Chat ID.',
  };
}

/**
 * Enqueues a query notification with abuse rate limiting and burst batching.
 * - Honeypot spam submissions are rejected immediately without notification.
 * - If multiple queries arrive within BURST_WINDOW_MS, they are batched.
 * - Enforces MIN_INTERVAL_MS between deliveries.
 */
export function enqueueQueryNotification(
  query: QueryPayload,
  baseUrl: string
): Promise<{ notified: boolean; skipped?: boolean }> {
  // Requirement 5: Do not notify for submissions flagged as spam (honeypot)
  if (query.isSpam || (query.honeypot && query.honeypot.trim().length > 0)) {
    return Promise.resolve({ notified: false, skipped: true });
  }

  // Requirement 4: Skip silently if notifications are disabled or env vars are missing
  if (!isNotificationsEnabled() || !isTelegramConfigured()) {
    return Promise.resolve({ notified: false, skipped: true });
  }

  return new Promise((resolve) => {
    pendingQueue.push({ query, baseUrl, resolve });

    if (!flushTimeout) {
      const timeSinceLast = Date.now() - lastSendTime;
      const delay = Math.max(BURST_WINDOW_MS, MIN_INTERVAL_MS - timeSinceLast);

      flushTimeout = setTimeout(async () => {
        flushTimeout = null;
        await processPendingQueue();
      }, delay);
    }
  });
}

/**
 * Flushes all pending queued queries either as a single message or batch.
 */
async function processPendingQueue(): Promise<void> {
  if (pendingQueue.length === 0) return;

  const currentBatch = [...pendingQueue];
  pendingQueue = [];

  const baseUrl = currentBatch[0].baseUrl;
  let textToSend = '';

  if (currentBatch.length === 1) {
    textToSend = formatSingleQueryMessage(currentBatch[0].query, baseUrl);
  } else {
    textToSend = formatBatchQueryMessage(
      currentBatch.map((item) => item.query),
      baseUrl
    );
  }

  const success = await sendTelegramMessage(textToSend);
  lastSendTime = Date.now();

  for (const item of currentBatch) {
    item.resolve({ notified: success });
  }
}
