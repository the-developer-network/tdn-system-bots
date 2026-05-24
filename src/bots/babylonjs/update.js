/**
 * @module bots/babylonjs/update
 * @description Babylon.js update bot.
 * Monitors the BabylonJS/Babylon.js GitHub repository for new releases
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

/** @type {import('../../api/client.js').TdnClient} API client for the Babylon.js bot */
const client = createTdnClient("babylonjs");

/** @type {BaseUpdateWatcher} Babylon.js release watcher (60-minute interval) */
const watcher = new BaseUpdateWatcher({
    name: "BabylonJS-Update",
    githubRepo: "BabylonJS/Babylon.js",
    stateDir: __dirname,
    intervalMinutes: 60,
});

watcher.on("new_update", async (release) => {
    log(
        "BabylonJS-Update-Bot",
        "INFO",
        `Processing release: ${release.name || release.tag_name}`,
    );

    const payload = buildUpdatePost({
        title: release.name || release.tag_name,
        description: release.body,
        link: release.html_url,
        tag: "#babylonjs",
    });

    await client.createPost(payload);
});

/**
 * Starts the Babylon.js update bot.
 * Polls GitHub releases every 60 minutes.
 */
export function startBabylonJSUpdatesBot() {
    watcher.start();
}
