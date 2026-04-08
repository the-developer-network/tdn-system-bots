/**
 * @module bots/docker/update
 * @description Docker update bot.
 * Monitors the moby/moby GitHub repository for new releases
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

/** @type {import('../../api/client.js').TdnClient} API client for the Docker bot */
const client = createTdnClient("docker");

/** @type {BaseUpdateWatcher} Docker release watcher (60-minute interval) */
const watcher = new BaseUpdateWatcher({
    name: "Docker-Update",
    githubRepo: "moby/moby",
    stateDir: __dirname,
    intervalMinutes: 60,
});

/**
 * Handles new release events by building and publishing a post to TDN.
 * @param {object} release - GitHub release data
 */
watcher.on("new_update", async (release) => {
    log(
        "Docker-Update-Bot",
        "INFO",
        `Processing release: ${release.name || release.tag_name}`,
    );

    const payload = buildUpdatePost({
        title: release.name || release.tag_name,
        description: release.body,
        link: release.html_url,
        tag: "#docker",
    });

    await client.createPost(payload);
});

/**
 * Starts the Docker update bot.
 * Polls GitHub releases every 60 minutes.
 */
export function startDockerUpdatesBot() {
    watcher.start();
}
