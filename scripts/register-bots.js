#!/usr/bin/env node
/**
 * @module scripts/register-bots
 * @description Registers all bot accounts defined in config.json.
 *
 * Usage:
 *   node scripts/register-bots.js
 *
 * Options:
 *   --delay <ms>   Delay between each request in ms (default: 300)
 */

import { createRequire } from "module";

const require = createRequire(import.meta.url);
const config = require("../config.json");

const API = config.apiBaseUrl;
const DELAY_MS =
    parseInt(process.argv[process.argv.indexOf("--delay") + 1] ?? "300", 10) ||
    300;

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function registerBot(email, username, password) {
    const res = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, password }),
    });
    if (res.ok) return { ok: true };
    const text = await res.text().catch(() => "");
    return { ok: false, status: res.status, body: text };
}

const bots = Object.entries(config.bots);
let success = 0;
let skipped = 0;
let failed = 0;

console.log(`Registering ${bots.length} bots against ${API}\n`);

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
