# Micromart product catalog

Product Engineer take-home: a responsive operator catalog for people running autonomous Smart Stores.

The app is a phone-first catalog inside a device-preview shell. **Review the catalog, not the chrome around the frame.**

[Run](#run) · [Review path](#review-path) · [Assumptions](#assumptions) · [Design decisions](#design-decisions) · [How it is built](#how-it-is-built) · [AI usage](#ai-usage) · [More time](#what-we-would-improve-with-more-time)

## Run

Requires **Node 20.19+** (Vite 8). Node 22+ is fine.

```bash
nvm use 20
npm install
npm run dev
```

Opens at [http://localhost:5173](http://localhost:5173). Vite proxies `/api` (and `/health`) to:

`https://micromart-frontend-takehome.up.railway.app`

Production builds call that origin directly.

```bash
npm test          # Vitest, one run
npm run test:watch
npm run check     # typecheck + tests
```

## Review path

The tab bar starts on **iPhone SE**. Stay there first. Device tabs are the reviewer — phone, tablet, and desktop are three layouts of the same catalog.

| | Do this | What you should see |
| --- | --- | --- |
| **1. Find** | Type in search (name, brand, SKU, or tags). Try **Sort** (A–Z, price, **Stock · lowest first**, newest), a category chip, and **Brand** → Coca-Cola or Celsius. | Brand hits the API `brand` param, not a client slice. **All brands**, or a second tap on the selected brand or category, clears it. |
| **2. Scroll** | Scroll the list. Keep going near the bottom. | The Catalog / Products / count heading leaves. Stuck chrome collapses to **Products** + search. Chips scroll with the list. The next page of 20 loads — no Load more, no “Loading more…”. |
| **3. Inspect** | Tap a row. Close it. | Full-frame sheet. Glance: pack, name, brand, stock or draft, price, size. Then SKU, cost, margin, category, tags, description. Close restores focus to the row. |
| **4. Planted draft** | Search **Draft Test Product**. There is no Draft chip on the rail — the API cannot filter by status. | Missing pack photo, Draft chip on the row, no stock column. |
| **5. Tablet** | Switch to **iPad Mini**. | Real tablet layout (status dot on the row). Inspect is a top-aligned card. **iPad Pro 13** is the larger tablet. **iPhone 16** / **16 Pro Max** are taller phones of the same layout. |
| **6. Desktop** | Switch to **Desktop**. | Wide catalog, not a laptop bezel and not their screenshot table. Columns: Name, SKU, category, stock, price, cost. Inspect is a side panel. Escape closes it. |

## Assumptions

- This is an operator catalog, not a consumer shop. The prompt’s desktop table does not work on a phone. The job is to redesign the experience, not shrink the table.
- Phone gets the most care. Tablet is a real second layout. Desktop is a wide operator list with a side inspect — we did not shrink or recreate their table. `CatalogScreen` is `phone`, `tablet`, or `desktop`.
- Shopper trust constrains data quality (image, price, status). Shoppers never use this screen, but AI checkout and shelf tags depend on the catalog being honest.
- Stock on the row is for a single machine — the one this operator has, or has already selected. The take-home API has one `stock` number and no machine or store field, so we do not invent a per-door split. Out / low / “12 in stock” mean this unit.

## Design decisions

### Find is the product

An operator is not browsing 20 snacks. They are jumping across drinks, energy, zero sugar, frozen, personal care, and whatever that location actually stocks. On a phone, search + filter + sort are the product. The list is just what those tools return. If those are slow or sloppy, the app fails in a store.

- **Search** hits the API `search` param after 300ms of typing. Clear (X or Escape) hits immediately. The placeholder says name, brand, SKU, or tags — we stay inside that copy. We do not download the full catalog and filter it in the browser.
- **Attention** is **Stock · lowest first**, which the API can do. It has no stock or status query params — `stock=0` and `status=draft` are ignored. Out / Low / Draft chips would only slice the current page and lie about empty. Those states still show on the row when that SKU is on screen.
- **Brand** is a short menu next to Sort: Coca-Cola, Gatorade, Fairlife, Celsius, Alani Nu, Cheetos, Starbucks. We do not dump ~60 brand chips on the rail. Tags and the full brand list are later.
- **Pages** of 20. Scrolling near the bottom loads the next page before they hit the wall. If that page still leaves the end on screen, we load the next one. The next request prefers the API `nextCursor`; if the payload has none, it falls back to `page + 1`. An empty result does not fetch another page. A failed page pauses the sentinel so we do not hammer.

### One-row bar when scrolled

At rest: Catalog + Products + the count, then search. On scroll that heading leaves and the stuck chrome collapses to one row — **Products** on the left, search on the right.

Changing search, filter, brand, or sort already starts a new list at page 1 and scrolls that pane to the top. After they type or reorder, the full heading is waiting there again. Pinning Catalog / Products / count while they browse does not pay — it is a 135px slab on SE (~21% of the pane) and collapsing it only buys about one extra row.

Search is the one control that is still useful halfway down: start a new find without climbing back, then get sent to the top of that result. Sort and chips are weaker as sticky. To reorder they have to reach the rail anyway, and tapping it also sends them to the top.

Tried first: title rolls away, search only. That was the smallest useful sticky, but mid-list it was not obvious what screen you were on. The one-row bar keeps a Products label beside find without bringing the slab back.

Also tried and not taken: keep the full slab pinned; slim title + search always pinned; pin search + chips; Out / Low / Draft chips against an API that cannot filter them; a 61-brand chip rail.

### List row

On the row: name, brand, price, stock. Category and size stay on the quiet line (`Drink · 12 oz`). Out / Low / Draft replace that line. Thumbs are 64px on a white tile so the pack still reads after padding. Status dot is tablet-only; phone drops it so the name can use that space. Draft hides the stock column. Desktop adds SKU and cost on the row so inspect is not a second copy of the table.

### Inspect

Tap a row to inspect.

- **Phone** — full-frame sheet. **Tablet** — top-aligned card. **Desktop** — side panel.
- Glance: pack, name, brand, stock or draft, price, size. Then SKU, cost, margin (price − cost), category, tags, description. Empty description and tags are omitted. Draft hides stock.
- Stock here can say “in this machine”; the row stays “in stock” so it stays readable. No edit, restock, or other units.
- Opens on the list row so the pack is instant, then refetches `/products/:id`. That fetch does not retry — fail fast, keep the snapshot, say “Could not refresh. This is the list snapshot.” We do not hide the pack behind a spinner.
- Opening a row moves focus to Close; Close puts it back on the row. The focus trap stays off so device tabs still work. The list scroll position is restored if MUI left `inert` on the catalog.

### Stretch, not v1

Barcode scan and voice-to-search sit in the same bucket: extra inputs into find, only if the data can support them. With more time, barcode if the catalog had a UPC field — that shows we understand the in-store job and did not fake a demo against missing data. Voice would type into the same search box. Excel at find-and-trust before adding camera and mic.

## How it is built

Tests sit next to the code they cover (`*.test.ts` / `*.test.tsx`). Update them in the same change as the product or API behavior. Shared fixtures live in `src/test/factories.ts`. The suite locks search, category, brand, sort, cursor pagination, infinite scroll, compact find, inspect refresh, the desktop list + side panel, image allowlisting, 429 cool-down, last-good data, `/health`, and the categories banner.

### Performance

This is an operator tool used on a phone in a store. Slow search/filter fails the product.

- Search, category, brand, sort, and pagination go to the API. We do not download the catalog and filter it in the browser.
- List requests are capped at the API max (100). We ask for 20. React Query caches for 30s, cancels in-flight requests on unmount, and does not refetch every time the tab refocuses.
- Transient failures fail fast (**3.5s**) and retry three times at 200ms / 400ms / 800ms. 4xx is not retried. **429** waits on Retry-After (2s if the header is missing). Infinite scroll pauses; the banner says the catalog is busy.
- Categories failing uses the same banner — chips disappear, copy says search and the list still work.
- `GET /health` is a liveness check, not a green badge. When health and the catalog both fail, the banner says the take-home API is unreachable. If the list still works, a health blip stays quiet.
- Coming back online always refetches. Last good data stays on screen; we never blank the list because a refresh failed.
- Thumbnails use Cloudinary resize (`q_auto,f_auto`) so a 64px row does not download a full packaging photo. Images are lazy-loaded with width/height reserved.
- Missing photos use a category atmosphere (sage drinks, kraft snacks, ice for frozen, and the same idea for cold and personal care) and a pack mark from category + tags — bottle, can, chip bag, candy, bar, carton, scoop, or pump. An empty plate that still reads as that SKU type is more honest than a dead square. Micromart checkout depends on packaging images.
- System fonts only. No Google Fonts request on first paint.

### Security

A sloppy client also fails shopper trust if we render bad catalog data.

- No API keys. The take-home API is public; we send no cookies (`credentials: omit`).
- Requests are allowlisted to `/api/v1/*` and `GET /health` against the known origin, with a 3.5s timeout (not 10s).
- Query values are encoded with `URLSearchParams`.
- `imageUrl` renders only if it is `https` on `res.cloudinary.com`. Anything else (empty, `javascript:`, unknown host) is a fallback tile. Any Cloudinary cloud on that host is allowed.
- Responses are parsed before render. Missing price, cost, or stock stay `—`. We do not invent `$0.00`, out of stock, or `finalized`. Explicit zeros from the API stay `$0.00` / 0. A product with only an `id` still parses — Untitled and dashes, not a fake priced SKU.
- A categories payload that is not an array is an error, not an empty chip rail.
- React handles text escaping. No `dangerouslySetInnerHTML`.
- Referrer is stripped in HTML (`<meta name="referrer" content="no-referrer">`). `X-Frame-Options: DENY` and `X-Content-Type-Options: nosniff` are set on the Vite dev and preview servers. A static host will not send those headers.
- Unexpected UI failures hit an error boundary (“Something went wrong loading this view. Refresh to try again”) instead of a blank screen.

## AI usage

Cursor (Grok 4.6) was used as a thought partner for product framing, decision logging, and implementation — including inspect refresh, the short Brand menu, 429 cool-down, the categories banner, the desktop list + side panel, and using `/health` only to name an unreachable API. Decisions and tradeoffs were made by the candidate. Suggestions that did not ship are in the stretch and more-time sections.

## What we would improve with more time

**Product**

- Opening screen as a to-do for this machine — out, low, draft, missing photo or price — if the API can filter those. Search stays for when they already know the SKU.
- Inspect actions that queue a typed issue on this phone (flag photo, damaged, request restock) and say “saved on this phone” until a write API exists. No no-op Edit or Restock.
- A machine picker, and other units of the same SKU on the detail, if the API gained location stock.

**Find**

- Expand the Brand menu to the full catalog (~60 brands), add tags, and offer brands that appear in the current find.
- Shareable find in the URL (search, category, brand, sort, open SKU) once the catalog is the route, not the device-preview frame. Back would close inspect. Device tabs stay out of the URL.
- Recent searches and last-opened SKUs on this phone. On zero results, offer “search all” and clear a stuck category — do not download the catalog to suggest names.
- Barcode scan if the catalog gained a UPC field. Voice input into the same search box.
- Out / Low / Draft chips if the API gained stock and status params.

**Client that survives a store**

- Persist last-good list pages across a dead tab (IndexedDB, last-synced time). Offline search of what is already on the phone, labeled as such. Do not download the full catalog.
- Typed failures beyond offline / last-good / busy / missing categories: parse vs 5xx vs timeout as distinct copy. Error boundary retries the catalog query instead of a full page refresh.
- A capability map the UI reads (search, category, brand, sort, cursor, stock/status filters) so planted SKUs and ignored params cannot sneak back in.
- OpenAPI of the take-home API we actually observed. Not a Swagger UI in the app; we do not host this API.
- Check in recorded Railway payloads and parse those in CI. Do not hit the live API from tests.

**Structure and a11y**

- CatalogScreen as the real route; device bezel at `/review`. Tests lock operator outcomes on the catalog, not pixel locks on the frame. Shareable find waits on this split.
- Move money, empty fields, and stock copy out of `review/locks` into product display/stock modules.
- Full accessibility for a store, not a checklist. Opening a row already moves focus to Close and Close restores it. With more time: keyboard the chip rail, announce result-count changes, trap focus in inspect once this is a real product, respect `prefers-reduced-motion`, VoiceOver on SE plus a hardware keyboard. Design for glare, gloves, and one hand — a high-contrast daylight theme, not decorative dark mode. Do that work on `CatalogScreen`, not the review bezel.
- Test on real phones and an iPad in a store. Load-test search, filter, and long scroll. If a long session gets heavy: virtualize after ~80 rows, pin imageUrl to the take-home Cloudinary cloud, prefetch only the next page’s first thumbs.
- Find telemetry as a small event schema (submitted, empty, row opened, 429) with query length, not the raw search string. Local debug overlay. No third-party analytics.
