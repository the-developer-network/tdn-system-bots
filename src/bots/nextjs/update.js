/**
 * @module bots/nextjs/update
 * @description Next.js update bot.
 * Monitors the vercel/next.js GitHub repository for new releases
 * and publishes a post to the TDN platform when one is detected.
 */

import { log } from "../../logger.js";
import { createTdnClient } from "../../api/client.js";
import { BaseUpdateWatcher } from "../../core/BaseUpdateWatcher.js";
import { buildUpdatePost } from "../../core/utils.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('../../api/client.js').TdnClient} API client for the Next.js bot */
const client = createTdnClient("nextjs");

/** @type {BaseUpdateWatcher} Next.js release watcher (30-minute interval) */
const watcher = new BaseUpdateWatcher({
    name: "NextJS-Update",
    githubRepo: "vercel/next.js",
    stateDir: __dirname,
    intervalMinutes: 30,
});

/**
 * Handles new release events by building and publishing a post to TDN.
 * @param {object} release - GitHub release data
 */
watcher.on("new_update", async (release) => {
    log(
        "NextJS-Update-Bot",
        "INFO",
        `Processing release: ${release.name || release.tag_name}`,
    );

    const payload = buildUpdatePost({
        title: release.name || release.tag_name,
        description: release.body,
        link: release.html_url,
        tag: "#nextjs",
    });

    await client.createPost(payload);
});

/**
 * Starts the Next.js update bot.
 * Polls GitHub releases every 30 minutes.
 */
export function startNextJSUpdatesBot() {
    watcher.start();
}
