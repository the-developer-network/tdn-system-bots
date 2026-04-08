# TDN System Bots

Automated news and update bots for the [TDN](https://tdn.app) social platform. Each bot monitors a technology's GitHub releases and/or RSS blog feed, then publishes posts to TDN when something new is detected.

[![CI](https://github.com/your-org/tdn-system-bots/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/tdn-system-bots/actions/workflows/ci.yml)

## Coverage

**137 watchers** across 100+ technologies — languages, frameworks, AI/LLM tools, infrastructure, game engines, and more.

## Architecture

```
src/
  index.js               — Entry point; starts all watchers
  logger.js              — Shared timestamped logger
  api/client.js          — TdnClient: login, token refresh, createPost()
  core/
    BaseUpdateWatcher.js — Polls GitHub releases API; emits 'new_update'
    BaseNewsWatcher.js   — Polls RSS/Atom feeds directly; emits 'new_article'
    requestScheduler.js  — Rate-limited fetch queue (github / rss lanes)
    utils.js             — buildNewsPost(), buildUpdatePost(), text helpers
  bots/{name}/
    update.js            — GitHub release watcher for that tool
    news.js              — RSS news watcher for that tool
scripts/
  setup-bots.js          — One-time: register bot accounts on the platform
```

## Quick start

```bash
pnpm install
# Copy and fill in your API credentials:
cp config.example.json config.json
# Register bot accounts (first time only):
node scripts/setup-bots.js
# Start all bots:
pnpm start
```

## Adding a new bot

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## Configuration

`config.json` (gitignored) must exist at the project root:

```json
{
    "apiBaseUrl": "http://localhost:8080/api/v1",
    "bots": {
        "mybotname": {
            "username": "mybotname",
            "email": "mybotname@bot.com",
            "password": "StrongPassword123!"
        }
    }
}
```

Set `GITHUB_TOKEN` in a `.env` file to raise the GitHub API rate limit from 60 to 5,000 req/h.

## License

[MIT](./LICENSE)
