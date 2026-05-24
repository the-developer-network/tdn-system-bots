/**
 * @module bots/love2d/update
 * @description LÖVE (love2d) update bot.
 * Monitors the love2d/love GitHub repository for new releases
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

/** @type {import('../../api/client.js').TdnClient} API client for the love2d bot */
const client = createTdnClient("love2d");

/** @type {BaseUpdateWatcher} love2d release watcher (60-minute interval) */
const watcher = new BaseUpdateWatcher({
    name: "Love2D-Update",
    githubRepo: "love2d/love",
    stateDir: __dirname,
    intervalMinutes: 60,
});

watcher.on("new_update", async (release) => {
    log(
        "Love2D-Update-Bot",
        "INFO",
        `Processing release: ${release.name || release.tag_name}`,
    );

    const payload = buildUpdatePost({
        title: release.name || release.tag_name,
        description: release.body,
        link: release.html_url,
        tag: "#love2d",
    });

    await client.createPost(payload);
});

/**
 * Starts the LÖVE (love2d) update bot.
 * Polls GitHub releases every 60 minutes.
 */
export function startLove2DUpdatesBot() {
    watcher.start();
}
