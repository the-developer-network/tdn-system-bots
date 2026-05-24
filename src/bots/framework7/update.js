/**
 * @module bots/framework7/update
 * @description Framework7 update bot.
 * Monitors the framework7io/framework7 GitHub repository for new releases
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

/** @type {import('../../api/client.js').TdnClient} API client for the Framework7 bot */
const client = createTdnClient("framework7");

/** @type {BaseUpdateWatcher} Framework7 release watcher (60-minute interval) */
const watcher = new BaseUpdateWatcher({
    name: "Framework7-Update",
    githubRepo: "framework7io/framework7",
    stateDir: __dirname,
    intervalMinutes: 60,
});

watcher.on("new_update", async (release) => {
    log(
        "Framework7-Update-Bot",
        "INFO",
        `Processing release: ${release.name || release.tag_name}`,
    );

    const payload = buildUpdatePost({
        title: release.name || release.tag_name,
        description: release.body,
        link: release.html_url,
        tag: "#framework7",
    });

    await client.createPost(payload);
});

/**
 * Starts the Framework7 update bot.
 * Polls GitHub releases every 60 minutes.
 */
export function startFramework7UpdatesBot() {
    watcher.start();
}
