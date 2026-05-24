/**
 * @module bots/stride/update
 * @description Stride Engine update bot.
 * Monitors the stride3d/stride GitHub repository for new releases
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

/** @type {import('../../api/client.js').TdnClient} API client for the Stride bot */
const client = createTdnClient("stride");

/** @type {BaseUpdateWatcher} Stride release watcher (60-minute interval) */
const watcher = new BaseUpdateWatcher({
    name: "Stride-Update",
    githubRepo: "stride3d/stride",
    stateDir: __dirname,
    intervalMinutes: 60,
});

watcher.on("new_update", async (release) => {
    log(
        "Stride-Update-Bot",
        "INFO",
        `Processing release: ${release.name || release.tag_name}`,
    );

    const payload = buildUpdatePost({
        title: release.name || release.tag_name,
        description: release.body,
        link: release.html_url,
        tag: "#stride",
    });

    await client.createPost(payload);
});

/**
 * Starts the Stride Engine update bot.
 * Polls GitHub releases every 60 minutes.
 */
export function startStrideUpdatesBot() {
    watcher.start();
}
