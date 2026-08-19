# Micromart product catalog

Product Engineer take-home: a responsive operator catalog for people running autonomous Smart Stores.

## Setup

Requires Node 20+.

```bash
npm install
npm run dev
```

## How to review

```bash
nvm use 20
npm run dev
```

The tab bar starts on **iPhone SE**. Try search, sort, and a category. Tap a row to inspect. Switch to **iPad Mini** for the tablet card.

There is no Draft chip — the API cannot filter by status, so a chip would only slice the current page. To see the planted draft (missing photo, incomplete fields), search **Draft Test Product**.

## Tests

```bash
npm test          # Vitest, one run
npm run test:watch
npm run check     # typecheck + tests
```

Tests sit next to the code they cover (`*.test.ts`). Update them in the same change as the product or API behavior. The suite is the lock on search, category, brand, sort, cursor pagination, inspect refresh, image allowlisting, 429 cool-down, and the categories banner. Shared fixtures live in `src/test/factories.ts`.

The app reads from the public take-home API:

`https://micromart-frontend-takehome.up.railway.app`

In `npm run dev`, Vite proxies `/api` to that origin. Production builds call the origin directly.

## Assumptions

- This is an operator catalog, not a consumer shop. The prompt’s desktop table does not work on a phone. The job is to redesign the experience, not shrink the table.
- Phone gets the most care. Tablet is a real second layout (iPad Mini and iPad Pro 13). There is no Desktop tab and no desktop catalog layout — `CatalogScreen` is `phone` or `tablet`. The chrome around the device frame is the reviewer, not a third product.
- Shopper trust constrains data quality (image, price, status). Shoppers never use this screen, but AI checkout and shelf tags depend on the catalog being honest.
- Stock on the row is for a single machine — the one this operator has, or has already selected. The take-home API has one `stock` number and no machine or store field, so we do not invent a per-door split. Out / low / “12 in stock” mean this unit.

## Design decisions

### Find is the product

An operator is not browsing 20 snacks. They are jumping across drinks, energy, zero sugar, frozen, personal care, and whatever that location actually stocks. On a phone, search + filter + sort are the product. The list is just what those tools return. If those are slow or sloppy, the app fails in a store.

Search hits the API `search` param. The field placeholder says name, brand, SKU, or tags — we stay inside that copy. We do not download the full catalog and filter it in the browser.

The API has no stock or status query params — `stock=0` and `status=draft` are ignored. Out / Low / Draft chips would only slice the current page and lie about empty. Attention is **Stock · lowest first**, which the API can do. Out / low / draft still show on the row when that SKU is on screen.

A second tap on a selected category clears it. No category selected is the empty state.

Brand is a short menu next to Sort: Coca-Cola, Gatorade, Fairlife, Celsius, Alani Nu, Cheetos, Starbucks. It sends the API `brand` param, not a client slice. **All brands** clears it. We do not dump ~60 brand chips on the rail. Tags and the full brand list are later.

The list pages at 20. Scrolling near the bottom loads the next page before they hit the wall. If that page still leaves the end on screen, we load the next one. The next request sends the API `nextCursor`, not `page + 1`. There is no Load more button, no “Loading more…” line, and no skeleton flash at the end — the next rows just appear. An empty result does not fetch another page. A failed page pauses the sentinel so we do not hammer.

### One-row bar when scrolled

At rest: Catalog + Products + the count, then search. On scroll that heading leaves and the stuck chrome collapses to one row — **Products** on the left, search on the right. The chip rail (sort, brand, then categories) still scrolls with the list.

The consideration: changing search, filter, brand, or sort already starts a new list at page 1 and scrolls that pane to the top. After they type or reorder, the full heading is waiting there again. Pinning Catalog / Products / count while they browse does not pay — it is a 135px slab on SE (~21% of the pane) and collapsing it only buys about one extra row. The question was whether that block should still look like a page header mid-list.

Search is the one control that is still useful halfway down: start a new find without climbing back, then get sent to the top of that result. Sort and chips are weaker as sticky. To reorder they have to reach the rail anyway, and tapping it also sends them to the top.

Tried first: title rolls away, search only. That was the smallest useful sticky, but mid-list it was not obvious what screen you were on. The one-row bar keeps a Products label beside find without bringing the slab back. Also tried and not taken: keep the full slab pinned; slim title + search always pinned; pin search + chips; Out / Low / Draft chips against an API that cannot filter them; a 61-brand chip rail.

### Stretch, not v1

Barcode scan: with more time, if the catalog had a UPC field. That shows we understand the in-store job and did not fake a demo against missing data. That is stronger than a camera button that cannot work.

Voice-to-search sits in the same bucket: another input into the same search box.

That is also Build to last: excel at find-and-trust before adding camera and mic.

### List row

On the row: name, brand, size, price, stock. Category stays quiet. Thumbs are 64px on a white tile so the pack still reads after padding. Status dot is tablet-only; phone drops it so the name can use that space. Status still lives in the row copy (Out / Low / Draft).

### Device review

A tab bar, one frame at a time: iPhone SE, iPhone 16, iPhone 16 Pro Max, iPad Mini, iPad Pro 13. Phone inspect is a full-frame sheet. iPad inspect is a top-aligned card. There is no Desktop tab.

### Inspect sheet

Tap a row to inspect. Glance is the pack shot, name, brand, stock or draft, price, and size. Then SKU, cost, margin (price − cost), category, tags, and description — the fields that do not belong on the row. Stock here can say “in this machine”; the row stays “in stock” so it stays readable. No edit, restock, or other units. Empty description and tags are omitted. Draft hides stock. Opening a row moves focus to Close; Close puts it back on the row. The focus trap stays off so device tabs still work. The list scroll position is restored if MUI left `inert` on the catalog.

The sheet opens on the list row so the pack is instant. Then we refetch `/products/:id`. Stock and price change while they restock; a 30s-old list page is not the SKU in the machine. That fetch does not retry — fail fast, keep the snapshot, say “Could not refresh. This is the list snapshot.” We do not hide the pack behind a spinner.

### Performance and security (from the start)

This is an operator tool used on a phone in a store. Slow search/filter fails the product. A sloppy client also fails shopper trust if we render bad catalog data.

Performance
- Search, category, brand, sort, and pagination go to the API. We do not download the catalog and filter it in the browser.
- List requests are capped at the API max (100). React Query caches for 30s, cancels in-flight requests on unmount, and does not refetch every time the tab refocuses.
- Transient failures fail fast (3.5s) and retry three times at 200ms / 400ms / 800ms. 4xx is not retried. 429 waits on Retry-After (2s if the header is missing) instead of hammering. Infinite scroll pauses while that cools down and the banner says the catalog is busy. A failed categories request uses the same banner — chips disappear, but we say so and the list stays. Coming back online always refetches. Last good data stays on screen; we never blank the list because a refresh failed.
- Thumbnails use Cloudinary resize (`q_auto,f_auto`) so a 64px row does not download a full packaging photo. Images are lazy-loaded with width/height reserved to avoid layout shift.
- Missing photos use a category atmosphere (sage drinks, kraft snacks, ice for frozen) and a pack mark from category + tags — bottle, can, chip bag, candy, bar, carton, scoop, or pump. Micromart checkout depends on packaging images; an empty plate that still reads as that SKU type is more honest than a dead square.
- System fonts only. No Google Fonts request on first paint.

Security
- No API keys in the client. The take-home API is public; we send no cookies (`credentials: omit`).
- Requests are allowlisted to `/api/v1/*` against the known origin, with a 3.5s timeout (not 10s).
- Query values are encoded with `URLSearchParams` so search text cannot break the URL.
- `imageUrl` is only rendered if it is `https` on `res.cloudinary.com`. Anything else (empty, `javascript:`, unknown host) is a fallback tile. Any Cloudinary cloud on that host is allowed.
- Responses are parsed before render so a malformed payload cannot crash the list. Missing price, cost, or stock stay empty (`—`). We do not invent `$0.00`, out of stock, or `finalized`. A product with only an `id` is still parsed; the row shows Untitled and dashes, not a fake priced SKU.
- A categories payload that is not an array is an error, not an empty chip rail.
- React handles text escaping. We do not use `dangerouslySetInnerHTML`.
- Referrer is stripped in HTML (`<meta name="referrer" content="no-referrer">`). `X-Frame-Options: DENY` and `X-Content-Type-Options: nosniff` are set on the Vite dev and preview servers. A static host will not send those headers.
- Unexpected UI failures are caught by an error boundary (“Refresh to try again”) instead of a blank screen.

## AI usage

Cursor (Grok 4.6) was used as a thought partner for product framing, decision logging, and implementation — including inspect refresh, the short Brand menu, 429 cool-down, and the categories banner. Decisions and tradeoffs were made by the candidate. Suggestions that did not ship are in the stretch and more-time sections (barcode, voice, Out / Low / Draft chips, shareable URL, and the rest of that list).

## What we would improve with more time

- Opening screen as a to-do for this machine — out, low, draft, missing photo or price — if the API can filter those. Search stays for when they already know the SKU.
- Barcode scan if the catalog gained a UPC field
- Voice input into search
- Expand the Brand menu to the full catalog (~60 brands), add tags, and offer brands that appear in the current find. The short menu is v1 so the rail stays one control.
- Shareable find in the URL (search, category, brand, sort, open SKU) once the catalog is the route, not the device-preview frame. Back would close inspect. Device tabs stay out of the URL.
- Recent searches and last-opened SKUs on this phone. On zero results, offer “search all” and clear a stuck category — do not download the catalog to suggest names.
- Persist last-good list pages across a dead tab (IndexedDB, last-synced time). Offline search of what is already on the phone, labeled as such. Do not download the full catalog.
- A capability map the UI reads (search, category, brand, sort, cursor, stock/status filters) so planted SKUs and ignored params cannot sneak back in.
- OpenAPI of the take-home API we actually observed — list, detail, categories, query params, cursor vs page, 429 — so the contract is one file instead of scattered README notes. Not a Swagger UI in the app; we do not host this API.
- CatalogScreen as the real route; device bezel at /review. Tests lock operator outcomes on the catalog, not pixel locks on the frame. Shareable find waits on this split.
- Move money, empty fields, and stock copy out of review/locks into product display/stock modules.
- Check in recorded Railway payloads (list page, draft SKU, categories) and parse those in CI. Do not hit the live API from tests.
- Inspect actions that queue a typed issue on this phone (flag photo, damaged, request restock) and say “saved on this phone” until a write API exists. No no-op Edit or Restock.
- Out / Low / Draft chips if the API gained stock and status params
- A machine picker, and other units of the same SKU on the detail, if the API gained location stock
- Full accessibility for a store, not a checklist. Opening a row already moves focus to Close and Close restores it. With more time: keyboard the chip rail (sort + brand + categories), announce result-count changes with a live region, trap focus in inspect once this is a real product instead of a device-preview shell, respect `prefers-reduced-motion` on the sticky find bar and sheet, and do a VoiceOver pass on SE plus a hardware keyboard. Design for glare, gloves, and one hand — a high-contrast daylight theme, not decorative dark mode. Do that work on `CatalogScreen`, not the review bezel.
- Test on real phones and an iPad in a store, not only the device bezel. Performance and load testing on search, filter, and long scroll. If a long session gets heavy: virtualize after ~80 rows, pin imageUrl to the take-home Cloudinary cloud, prefetch only the next page’s first thumbs.
- Find telemetry as a small event schema (submitted, empty, row opened, 429) with query length, not the raw search string. Local debug overlay. No third-party analytics.
- Typed failures beyond offline / last-good / busy / missing categories: parse vs 5xx vs timeout as distinct copy. Error boundary retries the catalog query instead of a full page refresh.
