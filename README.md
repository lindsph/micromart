# Micromart product catalog

Product Engineer take-home: a responsive operator catalog for people running autonomous Smart Stores.

Phone-first catalog inside a device-preview shell. **Review the catalog, not the chrome around the frame.**

[Run](#run) · [Review path](#review-path) · [Assumptions](#assumptions) · [Design decisions](#design-decisions) · [How it is built](#how-it-is-built) · [AI usage](#ai-usage) · [More time](#what-we-would-improve-with-more-time)

## Run

Requires **Node 20.19+** (Vite 8). Node 22+ is fine.

```bash
nvm use 20
npm install
npm run dev
```

Opens at [http://localhost:5173](http://localhost:5173). Vite proxies `/api` and `/health` to `https://micromart-frontend-takehome.up.railway.app`. Production builds call that origin directly.

```bash
npm test          # Vitest, one run
npm run test:watch
npm run check     # typecheck + tests
```

## Review path

Starts on **iPhone SE**. Stay there first. Device tabs are the reviewer — phone, tablet, and desktop are three layouts of the same catalog.

| Step | Do this | What you should see |
| --- | --- | --- |
| **1. Find** | Search (name, brand, SKU, or tags). Try **Sort** (A–Z, price, **Stock · lowest first**, newest), a category chip, and **Brand** → Coca-Cola or Celsius. | Brand hits the API `brand` param, not a client slice. **All brands**, or a second tap on the selected brand or category, clears it. |
| **2. Scroll** | Scroll the list. Keep going near the bottom. | Catalog / Products / count leaves. Stuck chrome is **Products** + search. Chips scroll with the list. The next page of 20 loads — no Load more. |
| **3. Inspect** | Tap a row. Close it. | Full-frame sheet. Glance: pack, name, brand, stock or draft, price, size. Then SKU, cost, margin, category, tags, description. Close restores focus to the row. |
| **4. Planted draft** | Search **Draft Test Product**. No Draft chip on the rail — the API cannot filter by status. | Missing pack photo, Draft on the row, no stock column. |
| **5. Tablet** | Switch to **iPad Mini**. | Status dot on the row. Inspect is a top-aligned card. **iPad Pro 13** is the larger tablet. **iPhone 16** / **16 Pro Max** are taller phones. |
| **6. Desktop** | Switch to **Desktop**. | Wide catalog, not a laptop bezel. Columns: Name, SKU, category, stock, price, cost. Inspect is a side panel. Escape closes it. Close restores focus to the row. |

## Assumptions

- Operator catalog, not a shop. The prompt’s desktop table does not work on a phone. The job is to redesign the experience, not shrink the table.
- Phone gets the most care. Tablet is a real second layout. Desktop is a wide list with a side panel — still the same catalog, not their table. `CatalogScreen` is `phone`, `tablet`, or `desktop`.
- Shoppers never use this screen, but AI checkout and shelf tags do. Image, price, and status have to be honest.
- Stock is one number for one machine. The API has no store or door field, so we do not invent a split. Out / low / “12 in stock” mean this unit.

## Design decisions

### Find is the product

An operator is not browsing 20 snacks. They are jumping across drinks, energy, zero sugar, frozen, personal care, and whatever that location actually stocks. On a phone, search + filter + sort are the product. The list is just what those tools return. If those are slow or sloppy, the app fails in a store.

- **Search** hits the API after 300ms. Clear (X or Escape) hits immediately. Placeholder: name, brand, SKU, or tags. We do not download the catalog and filter it in the browser.
- **Attention** is **Stock · lowest first**. The API ignores `stock=0` and `status=draft`, so Out / Low / Draft chips would only slice the current page and lie about empty. Those states still show on the row when the SKU is on screen.
- **Brand** is a short menu: Coca-Cola, Gatorade, Fairlife, Celsius, Alani Nu, Cheetos, Starbucks. Not ~60 chips. Tags and the full brand list are later.
- **Pages** of 20. Scroll near the bottom and the next page loads. Prefer `nextCursor`; fall back to `page + 1`. Empty results do not fetch again. A failed page pauses the sentinel.

### One-row bar when scrolled

At rest: Catalog + Products + count, then search. On scroll, that heading leaves and the stuck chrome collapses to **Products** + search.

A new search, filter, or sort already jumps to page 1 and the top of the pane — the full heading is waiting there. Pinning the 135px slab on SE (~21% of the pane) only buys about one extra row. Search is the control that is still useful halfway down.

Tried first: search only. Mid-list it was not obvious what screen you were on. Not taken: pin the full slab; pin search + chips; Out / Low / Draft chips; a 61-brand rail.

### List row

Phone / tablet: name, brand, price, stock. Category and size stay quiet (`Drink · 12 oz`) unless Out / Low / Draft replace that line. 64px thumbs on a white tile. Status dot is tablet-only. Draft hides stock.

Desktop adds SKU and cost as columns so a restock scan does not require opening every row. Inspect still has the full fact list.

### Inspect

- **Phone** — sheet. **Tablet** — card. **Desktop** — side panel.
- Glance, then SKU, cost, margin (price − cost), category, tags, description. Empty tags and description are omitted. Draft hides stock. No edit or restock.
- Row stock says “in stock”; inspect can say “in this machine.”
- Opens on the list snapshot so the pack is instant, then refetches `/products/:id` with no retry. On failure: keep the snapshot, say “Could not refresh. This is the list snapshot.”
- Focus moves to Close and back to the row. The trap stays off so device tabs still work.

### Stretch, not v1

Barcode and voice are extra inputs into find, only if the data can support them. Barcode later, if the catalog gains a UPC. Voice would type into the same search box. Excel at find-and-trust before adding camera and mic.

## How it is built

Tests sit next to the code (`*.test.ts` / `*.test.tsx`). Fixtures in `src/test/factories.ts`. The suite locks search, category, brand, sort, cursor pagination, infinite scroll, compact find, inspect refresh, desktop + side panel, image allowlisting, 429 cool-down, last-good data, `/health`, and the categories banner.

### Performance

Slow search fails this product.

- Find and pagination go to the API. Limit 20 (API max 100). React Query caches 30s, cancels on unmount, does not refetch on tab focus. Reconnect always refetches.
- Fail fast at **3.5s**. Retry three times at 200 / 400 / 800ms. 4xx is not retried. **429** waits on Retry-After (2s if missing); the sentinel pauses; the banner says busy.
- Categories failing: same banner, chips gone, search and the list still work.
- `GET /health` is liveness, not a badge. Health + catalog both down → “take-home API is unreachable.” List still working → stay quiet.
- Last good data stays on screen. We never blank the list because a refresh failed.
- Cloudinary thumbs (`q_auto,f_auto`), lazy-loaded, size reserved. Missing photos get a category atmosphere and a pack mark (bottle, can, bag, …) — more honest than a dead square.
- System fonts only.

### Security

- No API keys, no cookies (`credentials: omit`). Allowlist: `/api/v1/*` and `/health`, 3.5s timeout.
- `URLSearchParams` for query values. `imageUrl` only if `https` on `res.cloudinary.com`.
- Parse before render. Missing price / cost / stock are `—`, not `$0.00` / out / `finalized`. Explicit zeros stay. An `id`-only product is Untitled and dashes.
- Non-array categories is an error, not an empty rail. No `dangerouslySetInnerHTML`.
- HTML referrer is `no-referrer`. Vite dev/preview send `X-Frame-Options: DENY` and `nosniff`. A static host will not.
- Error boundary instead of a blank screen.

## AI usage

I used Cursor (Grok 4.6) as a sounding board — talking through the operator job, writing down decisions, and implementing from there. The product choices are mine.

Places it helped: inspect refresh, the short Brand menu, 429 cool-down, the categories banner, the desktop side panel, and `/health` copy when the API is down.

Some ideas we talked through and left for later: barcode and voice without a UPC field, Out / Low / Draft chips the API cannot honor, a 60-brand rail, and a Swagger page in the app. Those are in stretch and more time.

## What we would improve with more time

**Product** — To-do queue for this machine (out, low, draft, missing photo/price) if the API can filter those. Inspect actions that queue a typed issue on this phone until a write API exists. Machine picker and other units if location stock exists.

**Find** — Full brand list and tags. Shareable URL once the catalog is the route. Recent finds; on zero results, offer “search all.” Barcode if UPC exists; voice into the same box. Out / Low / Draft chips if the API gains those params.

**Client** — IndexedDB last-good (labeled offline search of what is already on the phone). Distinct copy for parse / 5xx / timeout; error boundary retries the query. Capability map so ignored params cannot sneak back. Observed OpenAPI file — not a Swagger UI. Recorded Railway fixtures in CI.

**Structure** — Catalog as the route; bezel at `/review`. Display/stock modules out of `review/locks`. Store a11y (chip keyboard, live region, reduced motion, VoiceOver, daylight contrast) on `CatalogScreen`. Real-device and load tests; virtualize after ~80 rows if needed. Find telemetry by query length, not the raw string.
