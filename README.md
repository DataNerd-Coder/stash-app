# Stash

Mobile-first business assistant for small shops.

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS v4
- **Backend:** Vercel Functions (`api/`) + Neon Postgres via Drizzle ORM
- **AI chat:** Groq (`openai/gpt-oss-120b`), answering from the live business data

Everything deploys as one Vercel project.

## Getting started

Requires Node 20.19+ (or 22.12+) and [pnpm](https://pnpm.io).

```bash
pnpm install
cp .env.example .env.local      # then fill in DATABASE_URL (Neon) and GROQ_API_KEY (Groq)
pnpm db:migrate                 # create the tables
pnpm db:seed                    # load demo data (Chidi's Provisions)
pnpm dev                        # http://localhost:5173 — frontend + API together
```

`pnpm dev` also serves the `api/` functions with hot reload (see `server/dev/vite-api.ts`), so you don't
need the Vercel CLI. `pnpm preview` serves only the built frontend, without the API.

| Command                | What it does                                                      |
| ---------------------- | ----------------------------------------------------------------- |
| `pnpm dev`             | Frontend + API with hot reload                                    |
| `pnpm build`           | Type-check everything, then production build to `dist/`           |
| `pnpm lint`            | ESLint                                                            |
| `pnpm typecheck`       | TypeScript only                                                   |
| `pnpm db:generate`     | After editing `server/db/schema.ts`: write a new SQL migration    |
| `pnpm db:migrate`      | Apply pending migrations to `DATABASE_URL`                        |
| `pnpm db:seed`         | Load demo data, only if the database is empty                     |
| `pnpm db:seed --reset` | **Delete all business data** and reload fresh demo data           |
| `pnpm db:studio`       | Browse the database in Drizzle Studio                             |

The demo sales are generated for the last 30 days relative to when you seed. Run `pnpm db:seed --reset`
to refresh "today".

The app is designed for phones. On a desktop, use a narrow window or device mode (390px wide).

## Deploying to Vercel

1. Import the repo in Vercel. `vercel.json` already sets the pnpm install/build commands, the `dist`
   output, the routing (pages go to the React app, `/api/*` goes to the functions) and asset caching.
2. Under Project → Settings → Environment Variables, add **`DATABASE_URL`** (same Neon string as
   `.env.local`, or connect Neon through Vercel's Storage tab) and **`GROQ_API_KEY`**.
3. Deploy. Visit `/api/health` to check the API can reach the database (`{"ok":true}`).

Migrations are **not** run automatically on deploy. After changing the schema, run `pnpm db:migrate`
against the production database yourself.

Old links from the static version (`/dashboard.html?openChat=1` etc.) still work and redirect to the new routes.

## ⚠️ Before real users: no login yet

There is no authentication. The API serves the **first business in the database**
(`server/business.ts`), and anyone with the URL can read the data, use the two write endpoints
(signup details, bank reconcile), and spend your Groq quota through `/api/chat`. That's fine for a demo. Add auth before real business data goes in.
Every query already filters by `business_id`, so only `getCurrentBusiness()` needs to change.

## Project structure

```
api/                         Vercel Functions — one file per endpoint (thin wrappers)
server/
├── db/schema.ts             Database tables (Drizzle) — money stored as integer kobo
├── db/client.ts             Neon HTTP driver connection
├── services/                The queries: dashboard, products, records, reports, bank, profile
├── business.ts              Which business is "current" (placeholder until auth)
├── http.ts                  route() wrapper, JSON errors
├── time.ts                  Africa/Lagos "today" / period filters
└── dev/vite-api.ts          Serves api/ during `pnpm dev`
drizzle/                     Generated SQL migrations (commit these)
scripts/                     migrate.ts, seed.ts
src/
├── App.tsx / main.tsx       Routes; React Query setup
├── data/types.ts            Types shared by API and frontend
├── data/mock.ts             What's still mock: chat history, photo-reading demo, referrals
├── hooks/queries.ts         React Query hooks — one per endpoint
├── lib/                     api client, dates, formatting, chat "brain", product search
├── components/              ui/ primitives, chat/ (pullable chatbox), layout/
└── pages/                   One file per screen
```

### API

| Endpoint | Returns |
| -------- | ------- |
| `GET /api/dashboard` | Today's sales (vs. this time yesterday), 7-day bars, top products, low stock, expiry count, insight |
| `GET /api/products` · `?view=low` | Products with expiry and average selling price · low-stock list |
| `GET /api/stock-records?period=` | Purchased/sold in period, current stock |
| `GET /api/sales?period=` · `/api/expenses?period=` | Records (`today`, `7d`, `month`, `all`) |
| `GET /api/debts` · `/api/suppliers` · `/api/invoices` | Lists (suppliers include cheaper offers) |
| `GET /api/reports` | 30-day revenue, profit, margin, expenses, best sellers |
| `GET /api/bank` · `POST /api/bank {transactionId}` | Account + transactions · confirm a reconciliation |
| `GET /api/business` · `PUT /api/business` | Owner/business details (signup writes here) |
| `POST /api/chat {messages}` | AI reply (Groq), grounded in a fresh snapshot of the business data |
| `GET /api/health` | Database connectivity check |

## What's real and what's still mock

**Real (Neon):** every list and number on the business pages, the dashboard, reports, the `#` product
search in chat, signup details and bank reconciliation.

**Real (Groq AI):** free-text chat. `api/chat.ts` rebuilds a compact snapshot of the business
(`server/ai/context.ts`, ~1,200 tokens) on every message and sends it with the last 12 messages to
Groq (`server/ai/groq.ts`, same approach as gitcap: plain fetch, model fallback, friendly errors).
The rules for tone and honesty live in `server/ai/prompt.ts`. It replies in Pidgin when asked in
Pidgin, and says "I don't have that" rather than inventing numbers. `#` lookups and `@` navigation
stay instant and local.

Groq's free tier allows **8,000 tokens per minute** (roughly 4–5 chat messages a minute) and 1,000
requests a day. Past that, the chat shows a "give me a minute" message. A paid Groq plan raises the
limits. Change the model with `GROQ_MODEL`.

**Still mock:**
- **Recording from chat:** the AI understands "I sold…" / "I spent…" and says plainly that it was
  **not saved**. Next step: give the model tools (create sale/expense) backed by POST endpoints.
- **Chat history:** in `src/data/mock.ts`; not stored.
- **Voice notes:** audio is recorded but the transcript is canned. The Groq account also offers
  `whisper-large-v3`, which could transcribe the recording for real.
- **Notebook photos:** always "reads" the same sample products (needs an image-reading API).
- **Barcodes:** IDs are random (`src/pages/Barcode.tsx`).
- **Bank linking:** the account is seeded; real linking needs Mono/Okra.
- **Referrals:** static.
- **Login:** see the warning above.

## Styling

Design tokens live in `src/index.css` under `@theme`. They become Tailwind utilities (`bg-primary`,
`text-muted-2`, `shadow-card`, `rounded-card`, `font-display`, `desk:` breakpoint). The chat sheet's
drag states are plain CSS classes toggled by `sheet-controller.ts`. Children react to them with
`group-[.expanded]:` utilities.
