# mv3-content-bridge — demo extension

A minimal Manifest V3 Chrome extension that demonstrates the typed bridge
between a content script (ISOLATED world) and the page (MAIN world).

When you visit any `https://` page:

- A small page-side script (loaded with `world: "MAIN"`) sets
  `window.__demoState = { user: "demo", count: 0, loadedAt: <ts> }`.
- A content script (default ISOLATED world) injects a floating box in the
  bottom-right corner showing **two values**:
  - What the ISOLATED world sees when it reads `window.__demoState`
    directly (spoiler: `undefined`).
  - The same value fetched **via the bridge** (which works, because the
    bridge round-trips the request to the MAIN world).
- A `+1 via bridge` button increments the page-side counter through a
  typed `INCREMENT_PAGE_COUNT` call.

## Run it

```bash
pnpm install
pnpm build
```

Then in Chrome:

1. Open `chrome://extensions/`
2. Toggle **Developer mode** on
3. Click **Load unpacked**
4. Select `example/dist/`
5. Visit any `https://` page (e.g. https://example.com)

## What to look at

- [src/shared/bridge.ts](src/shared/bridge.ts) — single source of truth for the contract.
- [src/page.ts](src/page.ts) — runs in MAIN world; sets `__demoState` and calls `serve()`.
- [src/content.ts](src/content.ts) — runs in ISOLATED world; calls `createClient()` and `send()`.
- [manifest.config.ts](manifest.config.ts) — two `content_scripts` entries, one per world.

The first line of the floating box demonstrates the **whole reason this
package exists**: from the ISOLATED world, you cannot read page-side
JavaScript variables. The second line shows the bridge solving that.
