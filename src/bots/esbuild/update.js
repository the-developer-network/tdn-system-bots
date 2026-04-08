/**
 * @module bots/esbuild/update
 * @description esbuild update bot.
 * Monitors the evanw/esbuild GitHub repository for new releases
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

/** @type {import('../../api/client.js').TdnClient} API client for the esbuild bot */
const client = createTdnClient("esbuild");

/** @type {BaseUpdateWatcher} esbuild release watcher (60-minute interval) */
const watcher = new BaseUpdateWatcher({
    name: "esbuild-Update",
    githubRepo: "evanw/esbuild",
    stateDir: __dirname,
    intervalMinutes: 60,
});

/**
 * Handles new release events by building and publishing a post to TDN.
 * @param {object} release - GitHub release data
 */
watcher.on("new_update", async (release) => {
    log(
        "esbuild-Update-Bot",
        "INFO",
        `Processing release: ${release.name || release.tag_name}`,
    );

    const payload = buildUpdatePost({
        title: release.name || release.tag_name,
        description: release.body,
        link: release.html_url,
        tag: "#esbuild",
    });

    await client.createPost(payload);
});

/**
 * Starts the esbuild update bot.
 * Polls GitHub releases every 60 minutes.
 */
export function startEsbuildUpdatesBot() {
    watcher.start();
}
