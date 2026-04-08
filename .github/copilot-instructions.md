# Copilot Instructions

## Commands

```bash
pnpm start                  # Run all bots (node ./src/index.js)
node scripts/setup-bots.js  # One-time: register all bot accounts against the API
```

Formatting is enforced automatically on commit via Husky + lint-staged (Prettier). To format manually:

```bash
pnpm exec prettier --write .
```

There is no test suite.

## Architecture

This is a Node.js ESM project (`"type": "module"`) that runs ~80 tech-topic bots. Each bot monitors either a GitHub releases feed, an RSS feed, or both, and publishes posts to a TDN social platform via a REST API.

### Layer overview

```
src/
  index.js               — Entry point. Imports every bot module and starts them all.
  logger.js              — Shared timestamped, color-coded console logger.
  api/
    client.js            — TdnClient: per-bot HTTP client with login, token refresh, createPost().
  core/
    BaseUpdateWatcher.js — EventEmitter that polls GitHub releases API; emits 'new_update'.
    BaseNewsWatcher.js   — EventEmitter that polls RSS via rss2json; emits 'new_article'.
    requestScheduler.js  — Centralized rate-limited fetch queue (separate lanes: 'github', 'rss').
    utils.js             — buildNewsPost(), buildUpdatePost(), HTML/Markdown strippers.
  bots/
    {name}/
      update.js          — Concrete update bot: wires BaseUpdateWatcher → TdnClient.createPost().
      news.js            — Concrete news bot: wires BaseNewsWatcher → TdnClient.createPost().
scripts/
  setup-bots.js          — Registers, logs in, and sets profile/avatar/banner for each bot account.
config.json              — Bot credentials + API base URL (gitignored; must be created locally).
```

### Data flow

1. `BaseUpdateWatcher` / `BaseNewsWatcher` polls its API on an interval with jitter.
2. On a new result it emits `new_update` or `new_article`.
3. The bot module handles the event, calls `buildUpdatePost()` / `buildNewsPost()`, and calls `client.createPost()`.
4. `TdnClient` sends the post to `POST /posts` with Bearer auth, auto-refreshing the token on 401.
5. State (last seen tag or article link) is persisted as `updates_state.json` / `news_state.json` **inside the bot's own directory** (`__dirname`-relative).

### Rate limiting

`requestScheduler.js` routes all outbound fetches through two lanes:

- `github`: max 2 concurrent, 600 ms minimum between requests
- `rss`: max 1 concurrent, 5 s minimum between requests (rss2json free tier)

Both watchers implement exponential backoff (initial 30 s, max 1 h) on errors or 429/403 responses. Startup jitter spreads initial requests over 1–2 minutes to avoid thundering-herd bursts.

## Key Conventions

### Adding a new bot

1. Add the bot entry to `config.json` under `bots` with `username`, `email`, `password`.
2. Create `src/bots/{name}/update.js` and/or `src/bots/{name}/news.js` using an existing bot as a template (e.g., `src/bots/typescript/`).
    - Export a single `start{Name}{Type}Bot()` function.
    - Pass `stateDir: __dirname` to the watcher so state files land next to the module.
    - Use `createTdnClient("{name}")` where `{name}` matches the key in `config.json`.
3. Import and call the start function in `src/index.js`.
4. Run `node scripts/setup-bots.js` to provision the new account on the platform.

### Post payload shape

```js
{ content: string, type: "TECH_NEWS" | "SYSTEM_UPDATE", mediaUrls: string[] }
```

Posts are hard-capped at **300 characters** (enforced in `utils.js`). News posts may include a thumbnail in `mediaUrls`; update posts always use an empty array.

### Environment

- `config.json` is gitignored. Bot credentials and `apiBaseUrl` live there.
- Optional `GITHUB_TOKEN` env var (in `.env`): used by `BaseUpdateWatcher` to raise the GitHub API rate limit.

### Code style (Prettier)

4-space indent, double quotes, semicolons, trailing commas (`"trailingComma": "all"`), 80-char print width.
