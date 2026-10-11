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

import { parsePhoneNumber } from 'libphonenumber-js';

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
  type?: 'Contact message' | 'Quote request' | string;
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
 * Truncates text at maxLen characters with '...' if exceeded.
 */
function truncate(text: string | null | undefined, maxLen = 60): string {
  if (!text) return '';
  const trimmed = text.trim();
  if (trimmed.length <= maxLen) return trimmed;
  return trimmed.slice(0, maxLen - 3) + '...';
}

/**
 * Formats a phone number into international display and clean tel: link.
 */
function formatPhone(raw?: string): { display: string; tel: string } | null {
  if (!raw || !raw.trim()) return null;
  const trimmed = raw.trim();
  try {
    const parsed = parsePhoneNumber(trimmed);
    if (parsed && parsed.isValid()) {
      return {
        display: parsed.formatInternational(),
        tel: parsed.number,
      };
    }
  } catch {
    // fallback
  }
  const cleanDigits = trimmed.replace(/\D/g, '');
  if (!cleanDigits) return null;
  const withPlus = trimmed.startsWith('+') ? trimmed : `+${trimmed}`;
  return {
    display: withPlus,
    tel: withPlus.replace(/\s+/g, ''),
  };
}

/**
 * Formats a single query into the exact requested Telegram layout.
 * HTML parse mode with blank lines between groups and no admin links.
 */
export function formatSingleQueryMessage(query: QueryPayload, _baseUrl?: string): string {
  const token = (query.referenceToken || query.id || 'WBC-QUERY').toUpperCase();
  const targetDate = query.isUpdate && query.updatedAt ? query.updatedAt : (query.createdAt || Date.now());
  const formattedDateIST = formatISTDate(targetDate);

  // -------------------------------------------------------------
  // Updated Query Layout (Instruction 5)
  // -------------------------------------------------------------
  if (query.isUpdate) {
    const groups: string[] = [];

    // Header & Ref
    groups.push([
      `♻️ <b>Query Updated</b>`,
      `Ref: <code>${escapeHtml(token)}</code>`,
    ].join('\n'));

    // Sender
    if (query.name && query.name.trim()) {
      groups.push(`👤 <b>${escapeHtml(truncate(query.name, 60))}</b>`);
    }

    // Service & Project
    const serviceProjectBlocks: string[] = [];
    if (query.services && query.services.length > 0) {
      const serviceNames = query.services
        .map((s) => s.name?.trim())
        .filter((n): n is string => Boolean(n));
      if (serviceNames.length > 0) {
        serviceProjectBlocks.push([
          `🛠 <b>Service</b>`,
          ...serviceNames.map((n) => escapeHtml(truncate(n, 60))),
        ].join('\n'));
      }
    }

    if (query.projects && query.projects.length > 0) {
      const projectNames = query.projects
        .map((p) => p.name?.trim())
        .filter((n): n is string => Boolean(n));
      if (projectNames.length > 0) {
        serviceProjectBlocks.push([
          `📁 <b>Project</b>`,
          ...projectNames.map((p) => escapeHtml(truncate(p, 60))),
        ].join('\n'));
      }
    }

    if (serviceProjectBlocks.length > 0) {
      groups.push(serviceProjectBlocks.join('\n\n'));
    }

    // Short note for replaced brief
    groups.push(`📝 The requirement brief was replaced.`);

    // Footer IST Time
    groups.push(`🕒 ${escapeHtml(formattedDateIST)}`);

    let msg = groups.filter(Boolean).join('\n\n');
    if (msg.length > 4000) {
      msg = msg.slice(0, 3990) + '...';
    }
    return msg;
  }

  // -------------------------------------------------------------
  // Contact Message Layout (Requirement 6)
  // -------------------------------------------------------------
  if (query.type === 'Contact message') {
    const groups: string[] = [];

    // Header & Ref
    groups.push([
      `🔔 <b>Contact Message</b>`,
      `Ref: <code>${escapeHtml(token)}</code>`,
    ].join('\n'));

    // Sender
    if (query.name && query.name.trim()) {
      groups.push(`👤 <b>${escapeHtml(truncate(query.name, 60))}</b>`);
    }

    // Contact block
    const contactLines: string[] = [];
    if (query.email && query.email.trim()) {
      const cleanEmail = query.email.trim();
      contactLines.push(`✉️ <a href="mailto:${escapeHtml(cleanEmail)}">${escapeHtml(cleanEmail)}</a>`);
    }

    if (query.phone && query.phone.trim()) {
      const phoneData = formatPhone(query.phone);
      if (phoneData) {
        contactLines.push(`📱 <a href="tel:${escapeHtml(phoneData.tel)}">${escapeHtml(phoneData.display)}</a>`);
      }
    }

    if (query.whatsapp && query.whatsapp.trim()) {
      const waDigits = query.whatsapp.replace(/\D/g, '');
      if (waDigits) {
        contactLines.push(`💬 <a href="https://wa.me/${waDigits}">WhatsApp</a>`);
      }
    }

    if (contactLines.length > 0) {
      groups.push([
        `📞 <b>Contact</b>`,
        ...contactLines,
      ].join('\n'));
    }

    // Message
    if (query.message && query.message.trim()) {
      groups.push([
        `💬 <b>Message</b>`,
        escapeHtml(truncate(query.message.trim(), 1000)),
      ].join('\n'));
    }

    // Footer IST Time
    groups.push(`🕒 ${escapeHtml(formattedDateIST)}`);

    let msg = groups.filter(Boolean).join('\n\n');
    if (msg.length > 4000) {
      msg = msg.slice(0, 3990) + '...';
    }
    return msg;
  }

  // -------------------------------------------------------------
  // New Query Layout (Instruction 2, 3, 4, 7)
  // -------------------------------------------------------------
  const groups: string[] = [];

  // Group 1: Header & Ref
  groups.push([
    `🔔 <b>New Query</b>`,
    `Ref: <code>${escapeHtml(token)}</code>`,
  ].join('\n'));

  // Group 2: Sender
  if (query.name && query.name.trim()) {
    groups.push(`👤 <b>${escapeHtml(truncate(query.name, 60))}</b>`);
  }

  // Group 3: Service and Project
  const serviceProjectBlocks: string[] = [];
  if (query.services && query.services.length > 0) {
    const serviceNames = query.services
      .map((s) => s.name?.trim())
      .filter((n): n is string => Boolean(n));
    if (serviceNames.length > 0) {
      serviceProjectBlocks.push([
        `🛠 <b>Service</b>`,
        ...serviceNames.map((n) => escapeHtml(truncate(n, 60))),
      ].join('\n'));
    }
  }

  if (query.projects && query.projects.length > 0) {
    const projectNames = query.projects
      .map((p) => p.name?.trim())
      .filter((n): n is string => Boolean(n));
    if (projectNames.length > 0) {
      serviceProjectBlocks.push([
        `📁 <b>Project</b>`,
        ...projectNames.map((p) => escapeHtml(truncate(p, 60))),
      ].join('\n'));
    }
  }

  if (serviceProjectBlocks.length > 0) {
    groups.push(serviceProjectBlocks.join('\n\n'));
  }

  // Group 4: Budget and Timeline (one per line, skipped if empty)
  const commercialLines: string[] = [];
  if (query.budget && query.budget.trim()) {
    commercialLines.push(`💰 Budget: ${escapeHtml(truncate(query.budget.trim(), 60))}`);
  }
  if (query.timeline && query.timeline.trim()) {
    commercialLines.push(`⏱ Timeline: ${escapeHtml(truncate(query.timeline.trim(), 60))}`);
  }
  if (commercialLines.length > 0) {
    groups.push(commercialLines.join('\n'));
  }

  // Group 5: Contact block (skipped if all contact fields are empty)
  const contactLines: string[] = [];
  if (query.email && query.email.trim()) {
    const cleanEmail = query.email.trim();
    contactLines.push(`✉️ <a href="mailto:${escapeHtml(cleanEmail)}">${escapeHtml(cleanEmail)}</a>`);
  }

  if (query.phone && query.phone.trim()) {
    const phoneData = formatPhone(query.phone);
    if (phoneData) {
      contactLines.push(`📱 <a href="tel:${escapeHtml(phoneData.tel)}">${escapeHtml(phoneData.display)}</a>`);
    }
  }

  if (query.whatsapp && query.whatsapp.trim()) {
    const waDigits = query.whatsapp.replace(/\D/g, '');
    if (waDigits) {
      contactLines.push(`💬 <a href="https://wa.me/${waDigits}">WhatsApp</a>`);
    }
  }

  if (contactLines.length > 0) {
    groups.push([
      `📞 <b>Contact</b>`,
      ...contactLines,
    ].join('\n'));
  }

  // Group 6: Footer IST Time
  groups.push(`🕒 ${escapeHtml(formattedDateIST)}`);

  let msg = groups.filter(Boolean).join('\n\n');
  if (msg.length > 4000) {
    msg = msg.slice(0, 3990) + '...';
  }
  return msg;
}

/**
 * Formats a burst batch of multiple queries into a single message.
 * Header: 🔔 <b>X New Queries</b>, one compact line per query ("Name · Service · Ref"), footer IST time.
 */
export function formatBatchQueryMessage(queries: QueryPayload[], _baseUrl?: string): string {
  const count = queries.length;
  const targetDate = queries[0]?.createdAt || Date.now();
  const formattedDateIST = formatISTDate(targetDate);

  const header = `🔔 <b>${count} New Queries</b>`;

  const queryLines: string[] = [];
  const maxItems = Math.min(queries.length, 25);

  for (let i = 0; i < maxItems; i++) {
    const q = queries[i];
    const name = escapeHtml(truncate(q.name || 'Anonymous', 60));
    const svc = q.services && q.services.length > 0 && q.services[0].name
      ? escapeHtml(truncate(q.services[0].name, 60))
      : 'General Consultation';
    const token = escapeHtml((q.referenceToken || q.id || 'WBC').toUpperCase());

    queryLines.push(`${name} · ${svc} · <code>${token}</code>`);
  }

  if (queries.length > maxItems) {
    queryLines.push(`<i>...and ${queries.length - maxItems} more</i>`);
  }

  const footer = `🕒 ${escapeHtml(formattedDateIST)}`;

  let msg = [header, queryLines.join('\n'), footer].filter(Boolean).join('\n\n');
  if (msg.length > 4000) {
    msg = msg.slice(0, 3990) + '...';
  }
  return msg;
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
    `🔔 <b>Telegram Notification Test</b>`,
    `Ref: <code>TEST-PING</code>`,
    ``,
    `Wise Byte Concepts admin notification integration is active!`,
    ``,
    `🕒 ${formatISTDate(Date.now())}`,
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
 * Sends a single query notification directly without in-memory queue delays.
 * Critical for serverless environments (e.g. Vercel) where background event loop timers freeze after HTTP responses.
 */
export async function sendSingleQueryNotification(
  query: QueryPayload,
  baseUrl: string
): Promise<{ notified: boolean; skipped?: boolean }> {
  if (query.isSpam || (query.honeypot && query.honeypot.trim().length > 0)) {
    return { notified: false, skipped: true };
  }

  if (!isNotificationsEnabled() || !isTelegramConfigured()) {
    return { notified: false, skipped: true };
  }

  const textToSend = formatSingleQueryMessage(query, baseUrl);
  const success = await sendTelegramMessage(textToSend);
  lastSendTime = Date.now();
  return { notified: success };
}

/**
 * Enqueues a query notification with abuse rate limiting and burst batching.
 * In serverless environments (Vercel, AWS Lambda), dispatches directly to prevent frozen background timers.
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

  // Serverless execution check (Vercel, AWS Lambda, Cloud Run serverless):
  // Serverless functions freeze or terminate timers when the response returns.
  // Immediate dispatch guarantees reliable delivery before function freeze.
  const isServerless = Boolean(
    process.env.VERCEL || 
    process.env.NOW_REGION || 
    process.env.AWS_LAMBDA_FUNCTION_NAME
  );

  if (isServerless) {
    return sendSingleQueryNotification(query, baseUrl);
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
