/**
 * @module index
 * @description TDN System Bots entry point.
 * Initializes all technology bots (news + update watchers).
 * Each bot runs independently; a failure in one does not affect the others.
 */

import { log } from "./logger.js";

/* ── TypeScript ─────────────────────────────────────────── */
import { startTypeScriptNewsBot } from "./bots/typescript/news.js";
import { startTypeScriptUpdatesBot } from "./bots/typescript/update.js";

/* ── React (update only — no RSS feed) ─────────────────── */
import { startReactUpdatesBot } from "./bots/react/update.js";

/* ── Next.js (update only — no RSS feed) ───────────────── */
import { startNextJSUpdatesBot } from "./bots/nextjs/update.js";

/* ── Vue.js ─────────────────────────────────────────────── */
import { startVueNewsBot } from "./bots/vue/news.js";
import { startVueUpdatesBot } from "./bots/vue/update.js";

/* ── Angular ────────────────────────────────────────────── */
import { startAngularNewsBot } from "./bots/angular/news.js";
import { startAngularUpdatesBot } from "./bots/angular/update.js";

/* ── Node.js ────────────────────────────────────────────── */
import { startNodeJSNewsBot } from "./bots/nodejs/news.js";
import { startNodeJSUpdatesBot } from "./bots/nodejs/update.js";

/* ── Python ─────────────────────────────────────────────── */
import { startPythonNewsBot } from "./bots/python/news.js";
import { startPythonUpdatesBot } from "./bots/python/update.js";

/* ── Rust ───────────────────────────────────────────────── */
import { startRustNewsBot } from "./bots/rust/news.js";
import { startRustUpdatesBot } from "./bots/rust/update.js";

/* ── Go ─────────────────────────────────────────────────── */
import { startGoNewsBot } from "./bots/go/news.js";
import { startGoUpdatesBot } from "./bots/go/update.js";

/* ── Deno (update only — no RSS feed) ──────────────────── */
import { startDenoUpdatesBot } from "./bots/deno/update.js";

/* ── Bun (update only — no RSS feed) ───────────────────── */
import { startBunUpdatesBot } from "./bots/bun/update.js";

/* ── Svelte ─────────────────────────────────────────────── */
import { startSvelteNewsBot } from "./bots/svelte/news.js";
import { startSvelteUpdatesBot } from "./bots/svelte/update.js";

/* ── Tailwind CSS ───────────────────────────────────────── */
import { startTailwindNewsBot } from "./bots/tailwindcss/news.js";
import { startTailwindUpdatesBot } from "./bots/tailwindcss/update.js";

/**
 * Bot registry. Each entry contains a display name and its start function.
 * @type {{ name: string, start: Function }[]}
 */
const bots = [
    /* TypeScript */
    { name: "TypeScript News", start: startTypeScriptNewsBot },
    { name: "TypeScript Updates", start: startTypeScriptUpdatesBot },
    /* React */
    { name: "React Updates", start: startReactUpdatesBot },
    /* Next.js */
    { name: "Next.js Updates", start: startNextJSUpdatesBot },
    /* Vue.js */
    { name: "Vue.js News", start: startVueNewsBot },
    { name: "Vue.js Updates", start: startVueUpdatesBot },
    /* Angular */
    { name: "Angular News", start: startAngularNewsBot },
    { name: "Angular Updates", start: startAngularUpdatesBot },
    /* Node.js */
    { name: "Node.js News", start: startNodeJSNewsBot },
    { name: "Node.js Updates", start: startNodeJSUpdatesBot },
    /* Python */
    { name: "Python News", start: startPythonNewsBot },
    { name: "Python Updates", start: startPythonUpdatesBot },
    /* Rust */
    { name: "Rust News", start: startRustNewsBot },
    { name: "Rust Updates", start: startRustUpdatesBot },
    /* Go */
    { name: "Go News", start: startGoNewsBot },
    { name: "Go Updates", start: startGoUpdatesBot },
    /* Deno */
    { name: "Deno Updates", start: startDenoUpdatesBot },
    /* Bun */
    { name: "Bun Updates", start: startBunUpdatesBot },
    /* Svelte */
    { name: "Svelte News", start: startSvelteNewsBot },
    { name: "Svelte Updates", start: startSvelteUpdatesBot },
    /* Tailwind CSS */
    { name: "Tailwind CSS News", start: startTailwindNewsBot },
    { name: "Tailwind CSS Updates", start: startTailwindUpdatesBot },
];

/**
 * Starts all registered bots sequentially. Each bot is wrapped in its own
 * try/catch so that a failure in one does not prevent the others from starting.
 */
async function bootstrap() {
    log(
        "SYSTEM",
        "INFO",
        `🚀 TDN System Bots initializing... (${bots.length} watchers)`,
    );

    let successCount = 0;

    for (const bot of bots) {
        try {
            bot.start();
            successCount++;
        } catch (error) {
            log(
                "SYSTEM",
                "ERROR",
                `❌ Failed to start ${bot.name}: ${error.message}`,
            );
        }
    }

    log(
        "SYSTEM",
        "SUCCESS",
        `✅ ${successCount}/${bots.length} watchers started successfully.`,
    );
    log(
        "SYSTEM",
        "INFO",
        "Monitoring news feeds and GitHub releases across 13 technologies...",
    );
}

bootstrap();
