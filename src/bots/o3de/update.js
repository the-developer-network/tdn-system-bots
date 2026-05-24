/**
 * @module bots/o3de/update
 * @description Open 3D Engine (O3DE) update bot.
 * Monitors the o3de/o3de GitHub repository for new releases
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

/** @type {import('../../api/client.js').TdnClient} API client for the O3DE bot */
const client = createTdnClient("o3de");

/** @type {BaseUpdateWatcher} O3DE release watcher (60-minute interval) */
const watcher = new BaseUpdateWatcher({
    name: "O3DE-Update",
    githubRepo: "o3de/o3de",
    stateDir: __dirname,
    intervalMinutes: 60,
});

watcher.on("new_update", async (release) => {
    log(
        "O3DE-Update-Bot",
        "INFO",
        `Processing release: ${release.name || release.tag_name}`,
    );

    const payload = buildUpdatePost({
        title: release.name || release.tag_name,
        description: release.body,
        link: release.html_url,
        tag: "#o3de",
    });

    await client.createPost(payload);
});

/**
 * Starts the Open 3D Engine update bot.
 * Polls GitHub releases every 60 minutes.
 */
export function startO3DEUpdatesBot() {
    watcher.start();
}
