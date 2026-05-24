/**
 * @module bots/jetpackcompose/news
 * @description Jetpack Compose news bot.
 * Monitors the Android Developers blog RSS feed and publishes
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

/** @type {string} Android Developers blog RSS feed URL */
const JETPACK_RSS_URL =
    "https://android-developers.googleblog.com/feeds/posts/default";

/** @type {import('../../api/client.js').TdnClient} API client for the Jetpack Compose bot */
const client = createTdnClient("jetpackcompose");

/** @type {BaseNewsWatcher} Jetpack Compose news watcher (30-minute interval) */
const watcher = new BaseNewsWatcher({
    name: "JetpackCompose-News",
    rssUrl: JETPACK_RSS_URL,
    stateDir: __dirname,
    intervalMinutes: 30,
});

watcher.on("new_article", async (news) => {
    log(
        "JetpackCompose-News-Bot",
        "INFO",
        `Preparing payload for: ${news.title}`,
    );

    const payload = buildNewsPost({
        title: news.title,
        description: news.description,
        link: news.link,
        tag: "#jetpackcompose",
        thumbnail: news.thumbnail,
    });

    await client.createPost(payload);
});

/**
 * Starts the Jetpack Compose news bot.
 * Polls the RSS feed every 30 minutes.
 */
export function startJetpackComposeNewsBot() {
    watcher.start();
}
