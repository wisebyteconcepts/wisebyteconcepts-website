# Implementation Plan: Fix Telegram Notifications on Vercel Production Deployment

## Problem Analysis & Root Cause

1. **Missing Vercel Serverless Entry Point**:
   Vercel is a serverless platform that deploys Vite projects as static assets from `dist/`. Vercel does not execute `node server.ts` or persistent Express listeners in production.
2. **Wildcard Rewrite Interception**:
   In `vercel.json`, the configuration currently contains:
   ```json
   {
     "rewrites": [
       { "source": "/(.*)", "destination": "/" }
     ]
   }
   ```
   Because there is no `/api` rule preceding the wildcard, all requests to `/api/notifications/telegram/query` and `/api/geo/country` are intercepted and rewritten directly to the static `index.html` frontend, returning HTML rather than executing backend code.
3. **Serverless Lambda Freezing on Delayed Timers**:
   In `server/telegram.ts`, `enqueueQueryNotification` queues submissions and delays dispatch using `setTimeout(..., 2000-3000ms)`. In Vercel Serverless Functions, lambdas freeze and discard background timer callbacks once the HTTP response is completed. Immediate dispatch is required in serverless runtime.

---

## Proposed Solution Architecture

### 1. Extract Modular Express Application (`server/app.ts`)
- Factor the Express application setup, JSON middleware, and all `/api/*` route handlers into `server/app.ts`.
- Ensure clean exports so both the local development server (`server.ts`) and Vercel's serverless handler (`api/index.ts`) share the exact same routes and business logic.

### 2. Create Vercel Serverless API Handler (`api/index.ts`)
- Create `api/index.ts` exporting the Express application as the default export.
- Vercel automatically maps incoming serverless requests to this handler.

### 3. Update Vercel Routing Configuration (`vercel.json`)
- Update `vercel.json` with an explicit `/api/(.*)` rewrite routed to `/api`, placed before the SPA fallback rule:
  ```json
  {
    "rewrites": [
      { "source": "/api/(.*)", "destination": "/api" },
      { "source": "/(.*)", "destination": "/" }
    ]
  }
  ```

### 4. Enable Immediate Dispatch for Serverless Runtime (`server/telegram.ts`)
- Update notification dispatch logic to detect serverless runtime (e.g. `process.env.VERCEL`) or execute immediate delivery for query submissions.
- Ensure `enqueueQueryNotification` awaits message transmission directly when running under serverless execution, returning `{ notified: true }` reliably to the client.

### 5. Verification & Diagnostics
- Verify the build via `compile_applet` and type safety via `lint_applet`.
- Ensure local dev (`npm run dev`) and static production build (`npm run build`) remain fully operational without regression.
