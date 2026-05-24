# Copilot Instructions

## Commands

```bash
pnpm install
pnpm start
node scripts/setup-bots.js
node scripts/setup-bots.js --force
pnpm exec prettier --check .
pnpm exec prettier --write .
find src scripts -name "*.js" | xargs -I{} node --check {}
node --check src/bots/typescript/update.js
```

There is no build step or automated test suite. CI currently runs Prettier plus `node --check` syntax validation.

`README.md` and `CONTRIBUTING.md` both mention `config.example.json`, but that file is not in the repository. Create `config.json` manually from the schema shown in `README.md`.

## Architecture

This is a Node.js ESM project (`"type": "module"`) made up of many small bot adapters around a shared watcher/client pipeline. Each technology bot watches GitHub releases, an RSS/Atom feed, or both, then publishes a normalized post to the TDN API.

### Big picture

- `src/index.js` is the runtime registry. It imports every bot module, builds the `bots` array, starts each watcher sequentially, and isolates startup failures so one broken bot does not stop the rest.
- `src/bots/{name}/news.js` and `src/bots/{name}/update.js` are intentionally thin. They instantiate one base watcher, listen for `new_article` or `new_update`, call `buildNewsPost()` or `buildUpdatePost()`, and hand the result to `createTdnClient("{name}")`.
- `src/core/BaseUpdateWatcher.js` handles GitHub release polling with ETag caching, optional `GITHUB_TOKEN` auth, jittered polling, and exponential backoff on errors or 403/429 responses.
- `src/core/BaseNewsWatcher.js` fetches RSS/Atom feeds directly, parses XML with `fast-xml-parser`, caches `ETag`/`Last-Modified`, normalizes feed items, and uses the same backoff/jitter pattern as update watchers.
- `src/core/requestScheduler.js` is the shared throttle point for outbound traffic. GitHub and RSS requests use separate lanes with different concurrency and minimum-delay limits, and the scheduler pauses a lane when upstream rate limiting happens.
- `src/api/client.js` is the TDN publishing boundary. It reads credentials from `config.json`, optionally uses static tokens from `bot-tokens-private.json`, injects default categories from `src/core/botCategories.js`, and retries once on 401 when using bearer-token auth.
- `scripts/setup-bots.js` provisions the bot accounts on the TDN platform, updates their profiles and media, and tracks completed work in `scripts/.setup-state.json`.

### Data flow

1. A watcher polls GitHub or an RSS/Atom feed through `scheduledFetch()`.
2. The watcher compares the latest result with the bot-local state file and emits `new_update` or `new_article` only when something changed.
3. The concrete bot module converts that event into a TDN payload with the helpers in `src/core/utils.js`.
4. `TdnClient.createPost()` sends the payload to `POST /posts`, adding categories automatically when a `BOT_CATEGORIES` mapping exists.

## Key Conventions

- Every bot module is ESM and computes `__dirname` via `fileURLToPath(import.meta.url)` before passing `stateDir: __dirname` into the watcher. State is intentionally stored beside the bot module as `news_state.json` or `updates_state.json`, not in a central cache directory.
- When adding a bot, update all of the coordinated surfaces: `config.json`, `src/bots/{name}/news.js` and/or `update.js`, `src/index.js`, `scripts/setup-bots.js`, and usually `src/core/botCategories.js`.
- Export exactly one start function per bot file (`start{Name}NewsBot()` or `start{Name}UpdatesBot()`). `src/index.js` depends on that naming pattern for its explicit import-and-registry style.
- Build post payloads with `buildNewsPost()` and `buildUpdatePost()` instead of composing strings inline. Those helpers enforce the 300-character post cap and the expected payload shape: `{ content, type, mediaUrls }`.
- News posts may include a thumbnail in `mediaUrls`; update posts should leave `mediaUrls` empty.
- `bot-tokens-private.json` is an optional local-only auth override. If present, `TdnClient` sends `Authorization: Bot <token>` and `scripts/setup-bots.js` can skip register/login for that bot.
- Preserve the process-level `uncaughtException` handling in `src/index.js` unless you are intentionally changing startup behavior. It suppresses known undici socket/connect timeout crashes on newer Node versions but still exits on other uncaught exceptions.
- Do not commit `config.json`, `bot-tokens-private.json`, `**/*_state.json`, or `scripts/.setup-state.json`; they are environment-specific runtime data.

## Formatting

Prettier is the only enforced style tool. The repository uses 4-space indentation, double quotes, semicolons, trailing commas, and an 80-character print width.
