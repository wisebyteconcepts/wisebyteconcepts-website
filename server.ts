import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  enqueueQueryNotification, 
  isNotificationsEnabled, 
  isTelegramConfigured, 
  sendTestMessage, 
  setNotificationsEnabled 
} from './server/telegram.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json());

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

  // -------------------------------------------------------------
  // Vite Integration (Dev) / Static Asset Serving (Prod)
  // -------------------------------------------------------------
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[WiseByte] Server listening on http://0.0.0.0:${PORT} (mode: ${isProd ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('[WiseByte] Fatal server start error:', err);
  process.exit(1);
});
