# Contributing to TDN System Bots

Thank you for your interest in contributing! This document describes how to add new bots, fix bugs, and submit changes.

## Prerequisites

- Node.js 18+
- [pnpm](https://pnpm.io) (`npm install -g pnpm`)
- A running TDN API instance (`config.json` pointing to it)

## Setup

```bash
git clone https://github.com/your-org/tdn-system-bots
cd tdn-system-bots
pnpm install
cp config.example.json config.json   # fill in your credentials
```

## Adding a new bot

1. **Create the bot directory** under `src/bots/{name}/`.
2. **Add `update.js`** if the project has GitHub releases (copy from `src/bots/typescript/update.js`).
3. **Add `news.js`** if the project has an RSS/Atom feed (copy from `src/bots/typescript/news.js`).
4. **Register credentials** in `config.json` under `"bots"`.
5. **Import and start** the bot in `src/index.js`.
6. **Add metadata** to the `BOTS` array in `scripts/setup-bots.js`.
7. Run `node scripts/setup-bots.js` to register the bot account.

See the [Architecture section of the README](./README.md#architecture) for full details.

## Running locally

```bash
pnpm start        # starts all bots
```

Logs are written to stdout. RSS and GitHub requests are rate-limited automatically.

## Code style

This project uses [Prettier](https://prettier.io) for formatting. It runs automatically on commit via Husky + lint-staged. To format manually:

```bash
pnpm exec prettier --write .
```

Configuration: 4-space indent, double quotes, semicolons, trailing commas, 80-char print width.

## Pull request guidelines

- One bot (or one fix) per PR — keeps reviews focused.
- Make sure `pnpm exec prettier --check .` passes before opening a PR.
- Do **not** commit `config.json`, `*_state.json`, or `scripts/.setup-state.json` — they are gitignored.
- Write clear commit messages (what + why).

## Reporting bugs

Please use the [Bug Report](.github/ISSUE_TEMPLATE/bug_report.md) issue template.
