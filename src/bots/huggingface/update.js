/**
 * @module bots/huggingface/update
 * @description Hugging Face update bot.
 * Monitors the huggingface/transformers GitHub repository for new releases
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

const client = createTdnClient("huggingface");

const watcher = new BaseUpdateWatcher({
    name: "HuggingFace-Update",
    githubRepo: "huggingface/transformers",
    stateDir: __dirname,
    intervalMinutes: 60,
});

watcher.on("new_update", async (release) => {
    log(
        "HuggingFace-Update-Bot",
        "INFO",
        `Processing release: ${release.name || release.tag_name}`,
    );

    const payload = buildUpdatePost({
        title: release.name || release.tag_name,
        description: release.body,
        link: release.html_url,
        tag: "#huggingface",
    });

    await client.createPost(payload);
});

export function startHuggingFaceUpdatesBot() {
    watcher.start();
}
