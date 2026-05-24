#!/usr/bin/env node
/**
 * @module scripts/register-bots
 * @description Registers bot accounts defined in config.json.
 *
 * Usage:
 *   node scripts/register-bots.js
 *   node scripts/register-bots.js --only expo,ionic,maui,capacitor
 *
 * Options:
 *   --delay <ms>          Delay between each request in ms (default: 500)
 *   --only <key1,key2>    Comma-separated list of bot keys to register (others skipped)
 */

import { createRequire } from "module";

const require = createRequire(import.meta.url);
const config = require("../config.json");

const API = config.apiBaseUrl;

const delayIdx = process.argv.indexOf("--delay");
const DELAY_MS =
    delayIdx !== -1
        ? parseInt(process.argv[delayIdx + 1] ?? "500", 10) || 500
        : 500;

const onlyIdx = process.argv.indexOf("--only");
const ONLY_KEYS =
    onlyIdx !== -1
        ? new Set(
              process.argv[onlyIdx + 1]
                  ?.split(",")
                  .map((k) => k.trim().toLowerCase()) ?? [],
          )
        : null;

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function registerBot(email, username, password, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        const res = await fetch(`${API}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, username, password }),
        });

        if (res.ok) return { ok: true };

        if (res.status === 429) {
            const retryAfter = parseInt(
                res.headers.get("retry-after") ?? "0",
                10,
            );
            const backoff = retryAfter > 0 ? retryAfter * 1000 : attempt * 2000;
            console.warn(
                `    ⚠ rate limited — waiting ${backoff / 1000}s (attempt ${attempt}/${retries})`,
            );
            await wait(backoff);
            continue;
        }

        const text = await res.text().catch(() => "");
        return { ok: false, status: res.status, body: text };
    }
    return { ok: false, status: 429, body: "rate limited after retries" };
}

const allBots = Object.entries(config.bots);
const bots = ONLY_KEYS
    ? allBots.filter(([key]) => ONLY_KEYS.has(key.toLowerCase()))
    : allBots;

if (ONLY_KEYS && bots.length === 0) {
    console.error(
        `No bots matched --only filter. Available keys: ${allBots.map(([k]) => k).join(", ")}`,
    );
    process.exit(1);
}

let success = 0;
let skipped = 0;
let failed = 0;

console.log(
    `Registering ${bots.length} bot(s)${ONLY_KEYS ? ` [filtered]` : ""} against ${API}\n`,
);

for (const [key, { email, username, password }] of bots) {
    process.stdout.write(`  [${key}] Registering... `);

    const result = await registerBot(email, username, password);

    if (result.ok) {
        console.log("✓ registered");
        success++;
    } else if (result.status === 409 || result.body?.includes("already")) {
        console.log("– already exists (skipped)");
        skipped++;
    } else {
        console.log(`✗ failed (${result.status}): ${result.body}`);
        failed++;
    }

    await wait(DELAY_MS);
}

console.log(
    `\nDone. ${success} registered, ${skipped} skipped, ${failed} failed.`,
);
