import 'dotenv/config';
import express, { Express } from 'express';
import { 
  enqueueQueryNotification, 
  isNotificationsEnabled, 
  isTelegramConfigured, 
  sendTestMessage, 
  setNotificationsEnabled 
} from './telegram.js';

/**
 * Creates and configures the Express application with all API routes.
 * Shared between local development (server.ts) and Vercel serverless functions (api/index.ts).
 */
export function createApp(): Express {
  const app = express();

  app.use(express.json());

  // -------------------------------------------------------------
  // Geo-IP & Country Detection Route (Server-side Only)
  // -------------------------------------------------------------
  /**
   * Detects the visitor's country from proxy headers (Vercel, Cloudflare, Fastly, etc.)
   * Never stores or logs the visitor's IP address.
   * Defaults to 'IN' if headers indicate India, otherwise 'US' (or detected ISO code).
   */
  app.get('/api/geo/country', async (req, res) => {
    try {
      // 1. Check common edge/CDN reverse proxy headers
      const headerCountry = 
        req.headers['x-vercel-ip-country'] ||
        req.headers['cf-ipcountry'] ||
        req.headers['x-country-code'] ||
        req.headers['cloudfront-viewer-country'] ||
        req.headers['x-geoip-country'];

      if (headerCountry && typeof headerCountry === 'string' && headerCountry.length === 2 && headerCountry !== 'XX') {
        const country = headerCountry.toUpperCase();
        return res.json({
          country,
          currency: country === 'IN' ? 'INR' : 'USD',
          source: 'header',
        });
      }

      // 2. Fallback: lightweight IP lookup if client IP is available and not private/loopback
      const forwardedFor = req.headers['x-forwarded-for'];
      const rawIp = typeof forwardedFor === 'string' 
        ? forwardedFor.split(',')[0].trim() 
        : (req.socket?.remoteAddress || '');
      
      const cleanIp = rawIp.replace(/^::ffff:/, '');
      const isPrivateOrLocal = 
        !cleanIp || 
        cleanIp === '127.0.0.1' || 
        cleanIp === '::1' || 
        cleanIp.startsWith('10.') || 
        cleanIp.startsWith('192.168.') || 
        cleanIp.startsWith('172.16.') || 
        cleanIp.startsWith('172.31.');

      if (!isPrivateOrLocal) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 1200);
          const geoRes = await fetch(`https://ipapi.co/${cleanIp}/country/`, {
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          if (geoRes.ok) {
            const detected = (await geoRes.text()).trim().toUpperCase();
            if (detected.length === 2 && detected !== 'UNDEFINED') {
              return res.json({
                country: detected,
                currency: detected === 'IN' ? 'INR' : 'USD',
                source: 'lookup',
              });
            }
          }
        } catch {
          // Ignore external lookup failure, fallback gracefully
        }
      }

      // 3. Graceful fallback: USD default
      return res.json({
        country: 'US',
        currency: 'USD',
        source: 'default',
      });
    } catch {
      return res.json({
        country: 'US',
        currency: 'USD',
        source: 'fallback',
      });
    }
  });

  // -------------------------------------------------------------
  // Telegram Admin Notification API Routes (Server-side Only)
  // -------------------------------------------------------------

  /**
   * Status route for admin panel: check if configured and enabled
   * Sensitive tokens and chat IDs are never returned to the client.
   */
  app.get('/api/notifications/telegram/status', (_req, res) => {
    res.json({
      enabled: isNotificationsEnabled(),
      isConfigured: isTelegramConfigured(),
    });
  });

  /**
   * Admin toggle route: turn notifications on or off in runtime
   */
  app.post('/api/notifications/telegram/toggle', (req, res) => {
    const { enabled } = req.body;
    setNotificationsEnabled(Boolean(enabled));
    res.json({
      success: true,
      enabled: isNotificationsEnabled(),
    });
  });

  /**
   * Test message route: send a test ping to Telegram to confirm setup
   */
  app.post('/api/notifications/telegram/test', async (_req, res) => {
    try {
      const result = await sendTestMessage();
      res.json(result);
    } catch (err) {
      console.error('[API] Telegram test error:', err);
      res.status(500).json({
        success: false,
        error: err instanceof Error ? err.message : 'Unknown server error',
      });
    }
  });

  /**
   * Query notification trigger: called asynchronously after contact form submission
   */
  app.post('/api/notifications/telegram/query', async (req, res) => {
    try {
      const { query } = req.body;
      if (!query || !query.id) {
        return res.status(400).json({ error: 'Query payload is required.' });
      }

      // Determine public base URL for admin links
      const host = req.get('host') || 'localhost:3000';
      const protocol = req.get('x-forwarded-proto') || req.protocol || 'http';
      const defaultUrl = `${protocol}://${host}`;
      const baseUrl = process.env.APP_URL || defaultUrl;

      const result = await enqueueQueryNotification(query, baseUrl);
      res.json({ success: true, ...result });
    } catch (err) {
      console.error('[API] Telegram query notification error:', err);
      // Return 200 with notified: false so client flow never fails
      res.json({
        success: false,
        notified: false,
        error: err instanceof Error ? err.message : 'Failed to queue notification',
      });
    }
  });

  return app;
}

export const app = createApp();
export default app;
