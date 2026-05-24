/**
 * @module bots/box2d/update
 * @description Box2D update bot.
 * Monitors the erincatto/box2d GitHub repository for new releases
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

/** @type {import('../../api/client.js').TdnClient} API client for the Box2D bot */
const client = createTdnClient("box2d");

/** @type {BaseUpdateWatcher} Box2D release watcher (60-minute interval) */
const watcher = new BaseUpdateWatcher({
    name: "Box2D-Update",
    githubRepo: "erincatto/box2d",
    stateDir: __dirname,
    intervalMinutes: 60,
});

watcher.on("new_update", async (release) => {
    log(
        "Box2D-Update-Bot",
        "INFO",
        `Processing release: ${release.name || release.tag_name}`,
    );

    const payload = buildUpdatePost({
        title: release.name || release.tag_name,
        description: release.body,
        link: release.html_url,
        tag: "#box2d",
    });

    await client.createPost(payload);
});

/**
 * Starts the Box2D update bot.
 * Polls GitHub releases every 60 minutes.
 */
export function startBox2DUpdatesBot() {
    watcher.start();
}
