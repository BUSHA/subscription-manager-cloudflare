# Subscription Manager CF

A Cloudflare-native rewrite of `dh1011/subscription-manager` for small personal or family use. The app keeps subscription tracking, totals, currency settings, and basic metadata, while removing Docker, Next.js server runtime, local SQLite files, filesystem persistence, NTFY, notifications, and cron jobs.

## Stack

- React + Vite static frontend
- Cloudflare Worker API under `/api`
- Cloudflare D1 database
- Cloudflare Access-compatible identity from `Cf-Access-Authenticated-User-Email`
- Local development fallback user from `DEV_AUTH_EMAIL` or `dev@example.com`

## Local Setup

Install dependencies:

```bash
npm install
```

Copy the example configuration and fill in your values:

```bash
cp wrangler.jsonc.example wrangler.jsonc
```

Edit `wrangler.jsonc` with your D1 database ID (see below) and app name.

Create a D1 database:

```bash
npm run db:create
```

Copy the returned database ID into `wrangler.jsonc` as `database_id`.

Apply migrations locally:

```bash
npm run db:migrate:local
```

Build the frontend and run the Worker locally:

```bash
npm run build
npm run cf:dev
```

Open the Wrangler URL, usually `http://localhost:8787`. The Worker serves the built frontend and the API together. For frontend-only iteration you can run `npm run dev`, but API calls expect a Worker on `127.0.0.1:8787`.

## Deployment

Apply migrations to the remote D1 database:

```bash
npm run db:migrate:remote
```

Deploy the Worker and static assets:

```bash
npm run build
npm run cf:deploy
```

## Cloudflare Access

For a real deployment, protect the deployed app with Cloudflare Access:

1. Go to Cloudflare Zero Trust.
2. Open Access, then Applications.
3. Add a self-hosted application.
4. Use the deployed app domain.
5. Add a policy that allows only the emails or identity providers you trust.

The Worker reads `Cf-Access-Authenticated-User-Email`. On first request, it creates a local user profile with a default display name derived from the email address. Every subscription and setting query is scoped to that user. In local development, the Worker falls back to `DEV_AUTH_EMAIL` from `wrangler.jsonc`, then `dev@example.com`.

The profile button in the header lets the signed-in user update their display name or log out through `/cdn-cgi/access/logout`.

## API

- `GET /api/health`
- `GET /api/me`
- `PATCH /api/me`
- `GET /api/subscriptions`
- `POST /api/subscriptions`
- `GET /api/subscriptions/:id`
- `PUT /api/subscriptions/:id`
- `DELETE /api/subscriptions/:id`
- `GET /api/user-configuration`
- `PUT /api/user-configuration`

Errors use this shape:

```json
{ "error": "Human readable error message" }
```

## Migrating From The Original App

The original app uses a local SQLite database. This rewrite uses Cloudflare D1, which is SQLite-compatible but not a direct drop-in for the old app schema.

A basic starting point is:

```bash
sqlite3 old-subscriptions.db .dump > dump.sql
```

Review and adjust the dump before importing it into D1. The new schema adds per-user ownership through Cloudflare Access identity and removes notification-related tables and fields.

## Currency Conversion

The app supports multi-currency subscriptions. Each subscription stores its own currency code, and all charts display amounts converted to your selected currency using live exchange rates from the [ExchangeRate-API](https://open.er-api.com).

- Exchange rates are fetched on app startup and cached for up to 1 hour.
- If the API is unavailable, conversion is disabled and charts will not render to avoid showing incorrect data.
- The cost trend line chart, spending history bar chart, and composition pie charts all convert subscription amounts to your configured currency.
- The sort-by-amount option in the subscription list also converts currencies before comparing, so values in different currencies are sorted correctly.
- Summary totals display per-currency amounts (no conversion) so you can see the original values.

## Current Limitations

- Notifications, NTFY, email reminders, and scheduled jobs are intentionally removed.
- This is intended for a few trusted users behind Cloudflare Access, not a public multi-tenant SaaS product.
