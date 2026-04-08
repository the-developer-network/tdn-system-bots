/**
 * @module bots/prisma/update
 * @description Prisma update bot.
 * Monitors the prisma/prisma GitHub repository for new releases
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

/** @type {import('../../api/client.js').TdnClient} API client for the Prisma bot */
const client = createTdnClient("prisma");

/** @type {BaseUpdateWatcher} Prisma release watcher (60-minute interval) */
const watcher = new BaseUpdateWatcher({
    name: "Prisma-Update",
    githubRepo: "prisma/prisma",
    stateDir: __dirname,
    intervalMinutes: 60,
});

/**
 * Handles new release events by building and publishing a post to TDN.
 * @param {object} release - GitHub release data
 */
watcher.on("new_update", async (release) => {
    log(
        "Prisma-Update-Bot",
        "INFO",
        `Processing release: ${release.name || release.tag_name}`,
    );

    const payload = buildUpdatePost({
        title: release.name || release.tag_name,
        description: release.body,
        link: release.html_url,
        tag: "#prisma",
    });

    await client.createPost(payload);
});

/**
 * Starts the Prisma update bot.
 * Polls GitHub releases every 60 minutes.
 */
export function startPrismaUpdatesBot() {
    watcher.start();
}
