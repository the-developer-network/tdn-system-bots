/**
 * @module bots/defold/update
 * @description Defold update bot.
 * Monitors the defold/defold GitHub repository for new releases
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

/** @type {import('../../api/client.js').TdnClient} API client for the Defold bot */
const client = createTdnClient("defold");

/** @type {BaseUpdateWatcher} Defold release watcher (60-minute interval) */
const watcher = new BaseUpdateWatcher({
    name: "Defold-Update",
    githubRepo: "defold/defold",
    stateDir: __dirname,
    intervalMinutes: 60,
});

watcher.on("new_update", async (release) => {
    log(
        "Defold-Update-Bot",
        "INFO",
        `Processing release: ${release.name || release.tag_name}`,
    );

    const payload = buildUpdatePost({
        title: release.name || release.tag_name,
        description: release.body,
        link: release.html_url,
        tag: "#defold",
    });

    await client.createPost(payload);
});

/**
 * Starts the Defold update bot.
 * Polls GitHub releases every 60 minutes.
 */
export function startDefoldUpdatesBot() {
    watcher.start();
}
