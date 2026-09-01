# Stash — Front-end Prototype

A static, multi-page front end for Stash. Plain HTML/CSS/JS, no build step, no
framework — open it in a browser or deploy it as-is to any static host.

## Structure

```
stash-app/
├── index.html            Entry point — routes to welcome.html or dashboard.html
├── welcome.html            Onboarding intro (3 slides)
├── signup.html              Business setup form
├── dashboard.html            Home screen
├── chat.html                  Redirect stub → dashboard.html?openChat=1
├── camera.html                  Standalone snap-notebook demo flow
│
├── products.html          Products, with Expired / Expires-in-X-days badges + # lookups
├── stockrecords.html      Stock Records (Product | Purchased | Sold | Remaining)
├── sales.html               Sales log with period filters
├── expenses.html              Expenses log
├── debts.html                   Customer debts
├── suppliers.html                 Suppliers + supplier-discovery insight
├── invoices.html                    Invoices (Draft/Sent/Paid/Overdue)
├── reports.html                       Analytical view
├── barcode.html                         Generate/preview/print reusable barcodes
├── bank.html                              Bank reconciliation (future-ready stub)
│
├── profile.html            Profile Details (business info + Security section)
├── referrals.html           Referral link + stats
├── privacy.html                Privacy policy (static)
├── terms.html                    Terms of Service (static)
│
├── css/style.css        Shared design system
├── js/mock-data.js       Mock business data
├── js/app.js               Shared logic: chat sheet, calculator, voice notes,
│                            # product search, progressive record completion,
│                            drawer, sign-out, mock AI replies
├── js/chat-widget.js        Injects the shared chatbox onto every business page
└── assets/                    Logo files
```

## Key interactions implemented

- **Global pullable chatbox**: the chat bottom-sheet (`js/chat-widget.js`) is a
  shared component mounted on every business page (Products, Stock Records,
  Sales, Expenses, Debts, Suppliers, Invoices, Reports, Profile, Referrals,
  Barcode, Bank — not the onboarding/legal pages), not just the dashboard.
  Drag it up from any of those pages and the current page stays put underneath.
- **Auto-scroll**: sending a message smoothly scrolls just the chat thread
  (never the whole page) so the new message and Stash's reply are always
  visible — fixed a real bug here where scroll was being set on the wrong
  (non-scrolling) element.
- **Voice notes**: tap the mic (shown only when the input is empty) for a real
  `getUserMedia` recording with a live timer, animated waveform, and a clear
  cancel. "Send" simulates transcription and feeds the result through the
  same conversational pipeline as typed text — including extracting multiple
  facts (a sale *and* an expense) from one note.
- **`#` product search**: type `#` for live fuzzy-matched suggestions above
  the input (works through misspellings like `#mlk` or `#miloo`). Picking a
  suggestion resolves it immediately; sending `#query` as-is instead posts it
  to the conversation verbatim and Stash searches inside the chat. Using
  `#product` inline in a sentence resolves it directly when there's one clear
  match, or asks you to choose when there are several — never guesses.
  Product cards always show real recorded data only (`Not set` / `Not
  available yet` rather than invented prices; real stock counts, never
  estimated).
- **`+` toolbox**: a single `+` button in the chat input reveals Camera,
  Files, Barcode, Calculator, and "Go to page" (`@`).
- **Calculator**: full operators, %, parentheses, history, backspace/AC/±.
  "Use in Stash" sends the whole equation into the input.
- **Barcode system**: generate a batch of blank reusable labels, preview,
  real browser print. Scan feeds into chat where Stash asks what the item is.
- **Progressive record completion**: `mockStashReply` never invents missing
  data — asks one clarifying question when needed, and confirms immediately
  without asking when enough context is already in the message (fixed a
  fallthrough bug here where a fully-specified expense was being misread as a
  generic query due to a stray keyword match).
- **Bank reconciliation**: matched/needs-review/unmatched, nothing reconciles
  without explicit user confirmation.
- **Supplier discovery**: a "Stash Noticed" insight on Suppliers, built only
  from real mock cost data.
- **Homepage expiry alert**: a 4th row under Top Products only when products
  are expired or expiring within 7 days.
- **App menu**: hamburger (top right) opens a full page — not an overlay —
  with a profile avatar top-right, chevrons on every row, generous row
  spacing, and a subtitle on the Profile Details row.
- **Chat history**: hamburger icon top-left of the *expanded chat*
  (ChatGPT-style) opens a half-page slide-out with live search, separate from
  app navigation.
- **`@` page shortcuts**: type `@` for a lightweight page-navigation
  autocomplete. Picking one only fills the input — navigation happens only on
  Send.

## Running it locally

```bash
npx serve .
```
or open `index.html` directly in a browser. Voice notes need microphone
permission and a page served over `http://localhost` or `https://` — some
browsers block `getUserMedia` on `file://` URLs.

## Deploying it

Drag the whole `stash-app` folder onto [Netlify Drop](https://app.netlify.com/drop),
or push it to a GitHub repo and enable GitHub Pages — no build step needed.

## Wiring up real data

Everything reads from `STASH_MOCK` in `js/mock-data.js`. To connect a real backend:

1. Replace `STASH_MOCK` reads with `fetch()` calls on each page's load script.
2. Replace `mockStashReply()` (in `js/app.js`) with a real AI/chat endpoint.
3. Replace `VOICE_TRANSCRIPTS[0]` in `StashVoice.finish()` with a real
   speech-to-text API call on the recorded `Blob` (currently captured by
   `MediaRecorder` but discarded, since there's no STT backend to send it to
   yet).
4. `searchProducts()` / `fuzzyProductScore()` in `js/app.js` run entirely
   client-side against `STASH_MOCK.products` — swap for a real search
   endpoint, or keep the client-side fuzzy matching over a synced product
   list; either works with the same UI.
5. In `barcode.html`, replace `randomBarcodeId()` with real server-issued
   identifiers.
6. In `bank.html`, replace the mock transaction list with a real bank-linking
   integration (e.g. Mono/Okra for Nigerian accounts).
7. `StashSession` in `js/app.js` uses `localStorage` for onboarding/business
   info — swap for real auth/session handling when you add a backend.

## Notes

- **The app is a real responsive layout now, not a phone-mockup screenshot.**
  Earlier builds wrapped every page in a fixed 400×844px "device" frame with a
  fake status bar and rounded black bezel — that was only ever meant for
  previewing inside this chat, but it was shipping to the real deployed site
  too, which is exactly what broke the chatbox on an actual phone (a fake
  phone nested inside the real one, clipped by a hardcoded height that didn't
  match the real viewport). That's fixed: on real mobile viewports the app is
  edge-to-edge with no fake bezel/status bar, the chat dock is genuinely
  `position:fixed` to the real viewport, and the page itself scrolls
  naturally. A max-width centered card only appears on wide desktop windows,
  purely for convenient preview — never on an actual phone.
- Two real bugs were caught and fixed while making this change: the compact
  chat bar's resting position had an inverted `translateY` (pushing it further
  off-screen instead of leaving it in place), and a CSS specificity tie meant
  `.dragging{ transition:none }` was silently losing to `.expanded`'s own
  transition rule, causing the drag gesture to visibly fight itself and
  usually snap back to collapsed instead of expanding. Both were found by
  measuring actual computed styles during a simulated drag, not by eyeballing
  screenshots.
- `js/chat-widget.js` is the single source of truth for the chat sheet's
  markup — injected via `mountStashChat()` rather than duplicated across
  files.
- Currency formatting is hand-rolled in `formatNaira()` rather than relying on
  `toLocaleString`, since `en-NG` locale data support varies across
  environments.
- Every interactive flow in this build was tested end-to-end with real
  headless Chromium (Playwright) at real mobile viewport dimensions (390×844),
  including microphone capture (via Chromium's fake-device flags) — not just
  visually inspected.
