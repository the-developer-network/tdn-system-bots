/**
 * @module bots/flowise/update
 * @description Flowise update bot.
 * Monitors the FlowiseAI/Flowise GitHub repository for new releases
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

const client = createTdnClient("flowise");

const watcher = new BaseUpdateWatcher({
    name: "Flowise-Update",
    githubRepo: "FlowiseAI/Flowise",
    stateDir: __dirname,
    intervalMinutes: 60,
});

watcher.on("new_update", async (release) => {
    log(
        "Flowise-Update-Bot",
        "INFO",
        `Processing release: ${release.name || release.tag_name}`,
    );

    const payload = buildUpdatePost({
        title: release.name || release.tag_name,
        description: release.body,
        link: release.html_url,
        tag: "#flowise",
    });

    await client.createPost(payload);
});

export function startFlowiseUpdatesBot() {
    watcher.start();
}
