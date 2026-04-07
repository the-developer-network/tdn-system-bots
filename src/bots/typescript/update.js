/**
 * @module bots/typescript/update
 * @description TypeScript update bot.
 * Monitors the microsoft/TypeScript GitHub repository for new releases
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

/** @type {import('../../api/client.js').TdnClient} API client for the TypeScript bot */
const client = createTdnClient("typescript");

/** @type {BaseUpdateWatcher} TypeScript release watcher (60-minute interval) */
const watcher = new BaseUpdateWatcher({
    name: "TS-Update",
    githubRepo: "microsoft/TypeScript",
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
        "TS-Update-Bot",
        "INFO",
        `Processing release: ${release.name || release.tag_name}`,
    );

    const payload = buildUpdatePost({
        title: release.name || release.tag_name,
        description: release.body,
        link: release.html_url,
        tag: "#typescript",
    });

    await client.createPost(payload);
});

/**
 * Starts the TypeScript update bot.
 * Polls GitHub releases every 60 minutes.
 */
export function startTypeScriptUpdatesBot() {
    watcher.start();
}
