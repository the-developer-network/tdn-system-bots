/**
 * @module bots/expo/update
 * @description Expo update bot.
 * Monitors the expo/expo GitHub repository for new releases
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

/** @type {import('../../api/client.js').TdnClient} API client for the Expo bot */
const client = createTdnClient("expo");

/** @type {BaseUpdateWatcher} Expo release watcher (60-minute interval) */
const watcher = new BaseUpdateWatcher({
    name: "Expo-Update",
    githubRepo: "expo/expo",
    stateDir: __dirname,
    intervalMinutes: 60,
});

/**
 * Handles new release events by building and publishing a post to TDN.
 * @param {object} release - GitHub release data
 */
watcher.on("new_update", async (release) => {
    log(
        "Expo-Update-Bot",
        "INFO",
        `Processing release: ${release.name || release.tag_name}`,
    );

    const payload = buildUpdatePost({
        title: release.name || release.tag_name,
        description: release.body,
        link: release.html_url,
        tag: "#expo",
    });

    await client.createPost(payload);
});

/**
 * Starts the Expo update bot.
 * Polls GitHub releases every 60 minutes.
 */
export function startExpoUpdatesBot() {
    watcher.start();
}
