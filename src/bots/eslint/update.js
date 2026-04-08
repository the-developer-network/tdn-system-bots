/**
 * @module bots/eslint/update
 * @description ESLint update bot.
 * Monitors the eslint/eslint GitHub repository for new releases
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

/** @type {import('../../api/client.js').TdnClient} API client for the ESLint bot */
const client = createTdnClient("eslint");

/** @type {BaseUpdateWatcher} ESLint release watcher (60-minute interval) */
const watcher = new BaseUpdateWatcher({
    name: "ESLint-Update",
    githubRepo: "eslint/eslint",
    stateDir: __dirname,
    intervalMinutes: 60,
});

/**
 * Handles new release events by building and publishing a post to TDN.
 * @param {object} release - GitHub release data
 */
watcher.on("new_update", async (release) => {
    log(
        "ESLint-Update-Bot",
        "INFO",
        `Processing release: ${release.name || release.tag_name}`,
    );

    const payload = buildUpdatePost({
        title: release.name || release.tag_name,
        description: release.body,
        link: release.html_url,
        tag: "#eslint",
    });

    await client.createPost(payload);
});

/**
 * Starts the ESLint update bot.
 * Polls GitHub releases every 60 minutes.
 */
export function startESLintUpdatesBot() {
    watcher.start();
}
