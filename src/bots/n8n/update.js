/**
 * @module bots/n8n/update
 * @description n8n update bot.
 * Monitors the n8n-io/n8n GitHub repository for new releases
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

const client = createTdnClient("n8n");

const watcher = new BaseUpdateWatcher({
    name: "N8N-Update",
    githubRepo: "n8n-io/n8n",
    stateDir: __dirname,
    intervalMinutes: 60,
});

watcher.on("new_update", async (release) => {
    log(
        "N8N-Update-Bot",
        "INFO",
        `Processing release: ${release.name || release.tag_name}`,
    );

    const payload = buildUpdatePost({
        title: release.name || release.tag_name,
        description: release.body,
        link: release.html_url,
        tag: "#n8n",
    });

    await client.createPost(payload);
});

export function startN8NUpdatesBot() {
    watcher.start();
}
