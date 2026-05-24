/**
 * @module bots/kotlinmultiplatform/news
 * @description Kotlin Multiplatform news bot.
 * Monitors the JetBrains Kotlin blog RSS feed and publishes
 * a post to the TDN platform when a new article is detected.
 */

import { log } from "../../logger.js";
import { createTdnClient } from "../../api/client.js";
import { BaseNewsWatcher } from "../../core/BaseNewsWatcher.js";
import { buildNewsPost } from "../../core/utils.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {string} JetBrains Kotlin blog RSS feed URL */
const KMP_RSS_URL = "https://blog.jetbrains.com/kotlin/feed/";

/** @type {import('../../api/client.js').TdnClient} API client for the Kotlin Multiplatform bot */
const client = createTdnClient("kotlinmultiplatform");

/** @type {BaseNewsWatcher} Kotlin Multiplatform news watcher (30-minute interval) */
const watcher = new BaseNewsWatcher({
    name: "KMP-News",
    rssUrl: KMP_RSS_URL,
    stateDir: __dirname,
    intervalMinutes: 30,
});

watcher.on("new_article", async (news) => {
    log("KMP-News-Bot", "INFO", `Preparing payload for: ${news.title}`);

    const payload = buildNewsPost({
        title: news.title,
        description: news.description,
        link: news.link,
        tag: "#kotlinmultiplatform",
        thumbnail: news.thumbnail,
    });

    await client.createPost(payload);
});

/**
 * Starts the Kotlin Multiplatform news bot.
 * Polls the RSS feed every 30 minutes.
 */
export function startKotlinMultiplatformNewsBot() {
    watcher.start();
}
