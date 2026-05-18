# mv3-content-bridge

> **Chrome extension content-script ↔ page-context bridge** for **Manifest V3 (MV3)** —
> a type-safe wrapper over `window.postMessage` with request/response semantics.
> Declare your bridge once, get end-to-end typed calls between your content
> script (ISOLATED world) and the page (MAIN world). Zero dependencies.

<p>
  <a href="https://www.npmjs.com/package/mv3-content-bridge"><img src="https://img.shields.io/npm/v/mv3-content-bridge.svg?color=blue" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/mv3-content-bridge"><img src="https://img.shields.io/npm/dm/mv3-content-bridge.svg" alt="downloads"></a>
  <a href="LICENSE"><img src="https://img.shields.io/npm/l/mv3-content-bridge.svg" alt="MIT"></a>
</p>

Content scripts run in an **ISOLATED** JavaScript world — they can read and
modify the page's DOM, but they **can't see** the page's own JavaScript
variables, functions, or globals. To reach them you have to talk to the
page's **MAIN** world over `window.postMessage`. This package is that
talking layer, typed and request/response-shaped.

```ts
interface Bridge {
  GET_PAGE_STATE: { input: void; output: { user: string; theme: string } };
  TRACK_EVENT: { input: { name: string }; output: { ok: boolean } };
}

// page side (MAIN world)
import { serve } from "mv3-content-bridge";
serve<Bridge>({
  GET_PAGE_STATE: () => window.__APP__.state,
  TRACK_EVENT: ({ name }) => window.__APP__.track(name),
});

// content side (ISOLATED world)
import { createClient } from "mv3-content-bridge";
const page = createClient<Bridge>();
const state = await page.send("GET_PAGE_STATE", undefined);   // typed
await page.send("TRACK_EVENT", { name: "open_popup" });
```

## Why

Reaching the page's JavaScript from a content script is a recurring task
(reading `window.__INITIAL_STATE__` from a React/Vue site, calling a
page-side analytics function, etc.) and there's no built-in primitive for
it. Everyone reinvents the same `window.addEventListener("message", …)`
boilerplate, with no typing and no request/response shape. This package
wraps that protocol behind a small typed API, normalizes error
propagation, and ignores messages from other libraries.

## Install

```bash
pnpm add mv3-content-bridge
# or: npm i mv3-content-bridge
# or: yarn add mv3-content-bridge
```

## Usage

### 1. Declare your bridge contract

```ts
// src/shared/bridge.ts
export interface Bridge {
  GET_USER_TOKEN: { input: void; output: { token: string; expiresAt: number } };
  CLOSE_BANNER: { input: { id: string }; output: { ok: boolean } };
}
```

### 2. Serve handlers from the page (MAIN world)

```ts
// src/page.ts — loaded with world: "MAIN" in the manifest
import { serve } from "mv3-content-bridge";
import type { Bridge } from "./shared/bridge";

serve<Bridge>({
  GET_USER_TOKEN: async () => (window as any).__app.getToken(),
  CLOSE_BANNER: async ({ id }) => {
    (window as any).__app.closeBanner(id);
    return { ok: true };
  },
});
```

### 3. Call from the content script (ISOLATED world)

```ts
// src/content.ts — loaded with world: "ISOLATED" (the default)
import { createClient } from "mv3-content-bridge";
import type { Bridge } from "./shared/bridge";

const page = createClient<Bridge>();

const { token } = await page.send("GET_USER_TOKEN", undefined);
//      ^? string
```

### 4. Wire both into your manifest

```json
"content_scripts": [
  {
    "matches": ["https://*/*"],
    "js": ["content.js"]
  },
  {
    "matches": ["https://*/*"],
    "js": ["page.js"],
    "world": "MAIN"
  }
]
```

> The `world: "MAIN"` option requires Chrome 95+, Edge 95+, and Firefox 128+.

## API

### `serve<M>(handlers, options?) → { stop }`

Registers handlers in the page (MAIN world). Returns a handle with a
`stop()` method that detaches the `message` listener.

| Option | Type | Default | Notes |
| --- | --- | --- | --- |
| `namespace` | `string` | `"default"` | Use a unique value if you have multiple bridges on the same page. |

### `createClient<M>(options?) → { send }`

Creates a client in the content script (ISOLATED world). `send(type, payload)`
sends a typed request and resolves with the typed response.

| Option | Type | Default | Notes |
| --- | --- | --- | --- |
| `namespace` | `string` | `"default"` | Must match the server's namespace. |
| `timeoutMs` | `number` | `5000` | Rejects with `ContentBridgeError` if no reply arrives in time. |

### `ContentBridgeError`

Thrown when a request times out, or when a handler rejects. Original error
info is available on `.cause`.

## Multiple bridges on the same page

If your extension uses several independent bridges (e.g. one for auth, one
for tracking), give each its own namespace:

```ts
const auth = createClient<AuthBridge>({ namespace: "auth" });
const track = createClient<TrackBridge>({ namespace: "track" });

// in page.ts
serve<AuthBridge>(authHandlers, { namespace: "auth" });
serve<TrackBridge>(trackHandlers, { namespace: "track" });
```

Messages from the wrong namespace are silently ignored. Messages from
other libraries (without our internal marker) pass straight through to
your existing `window.message` listeners.

## Demo extension

A runnable demo lives in [`example/`](example/). It loads as an unpacked
Chrome extension and shows the content script reading a page-side global
(`window.__demoState`) that it can't normally see from the ISOLATED world.

```bash
cd example
pnpm install
pnpm build
# then load example/dist/ via chrome://extensions → "Load unpacked"
```

See [`example/README.md`](example/README.md) for full instructions.

## Related packages

Part of a small **MV3 toolkit** for Chrome / Edge / Firefox extensions by
[@graybearo](https://github.com/graybearo):

- [`mv3-message-router`](https://github.com/graybearo/mv3-message-router) — typed messaging between popup, content, and service worker
- [`mv3-keepalive`](https://github.com/graybearo/mv3-keepalive) — service-worker keepalive + durable alarms
- [`chrome-extension-vite-react`](https://github.com/graybearo/chrome-extension-vite-react) — Vite + React + TS MV3 starter
- [`chrome-extension-webpack-react`](https://github.com/graybearo/chrome-extension-webpack-react) — webpack + React + TS MV3 starter
- [`webpack-ext-reloader-next`](https://github.com/graybearo/webpack-ext-reloader-next) — auto-reload for webpack-based MV3 extensions
- [`awesome-mv3`](https://github.com/graybearo/awesome-mv3) — curated list of MV3 tools, libraries, and resources

## License

MIT — see [LICENSE](LICENSE).
