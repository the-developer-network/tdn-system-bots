/**
 * @module bots/phaser/update
 * @description Phaser update bot.
 * Monitors the phaserjs/phaser GitHub repository for new releases
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

/** @type {import('../../api/client.js').TdnClient} API client for the Phaser bot */
const client = createTdnClient("phaser");

/** @type {BaseUpdateWatcher} Phaser release watcher (60-minute interval) */
const watcher = new BaseUpdateWatcher({
    name: "Phaser-Update",
    githubRepo: "phaserjs/phaser",
    stateDir: __dirname,
    intervalMinutes: 60,
});

/**
 * Handles new release events by building and publishing a post to TDN.
 * @param {object} release - GitHub release data
 * @param {string} release.tag_name - Release tag name
 * @param {string} release.name - Release title
 * @param {string} release.html_url - Release page URL
 * @param {string} release.body - Release notes (Markdown)
 */
watcher.on("new_update", async (release) => {
    log(
        "Phaser-Update-Bot",
        "INFO",
        `Processing release: ${release.name || release.tag_name}`,
    );

    const payload = buildUpdatePost({
        title: release.name || release.tag_name,
        description: release.body,
        link: release.html_url,
        tag: "#phaser",
    });

    await client.createPost(payload);
});

/**
 * Starts the Phaser update bot.
 * Polls GitHub releases every 60 minutes.
 */
export function startPhaserUpdatesBot() {
    watcher.start();
}
