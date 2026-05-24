/**
 * @module bots/nativescript/news
 * @description NativeScript news bot.
 * Monitors the NativeScript blog RSS feed and publishes
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

/** @type {string} NativeScript blog RSS feed URL */
const NATIVESCRIPT_RSS_URL = "https://blog.nativescript.org/rss/";

/** @type {import('../../api/client.js').TdnClient} API client for the NativeScript bot */
const client = createTdnClient("nativescript");

/** @type {BaseNewsWatcher} NativeScript news watcher (30-minute interval) */
const watcher = new BaseNewsWatcher({
    name: "NativeScript-News",
    rssUrl: NATIVESCRIPT_RSS_URL,
    stateDir: __dirname,
    intervalMinutes: 30,
});

watcher.on("new_article", async (news) => {
    log(
        "NativeScript-News-Bot",
        "INFO",
        `Preparing payload for: ${news.title}`,
    );

    const payload = buildNewsPost({
        title: news.title,
        description: news.description,
        link: news.link,
        tag: "#nativescript",
        thumbnail: news.thumbnail,
    });

    await client.createPost(payload);
});

/**
 * Starts the NativeScript news bot.
 * Polls the RSS feed every 30 minutes.
 */
export function startNativeScriptNewsBot() {
    watcher.start();
}
