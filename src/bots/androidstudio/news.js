/**
 * @module bots/androidstudio/news
 * @description Android Studio news bot.
 * Monitors the Android Studio blog RSS feed and publishes
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

/** @type {string} Android Studio blog RSS feed URL */
const ANDROID_STUDIO_RSS_URL =
    "https://androidstudio.googleblog.com/feeds/posts/default";

/** @type {import('../../api/client.js').TdnClient} API client for the Android Studio bot */
const client = createTdnClient("androidstudio");

/** @type {BaseNewsWatcher} Android Studio news watcher (30-minute interval) */
const watcher = new BaseNewsWatcher({
    name: "AndroidStudio-News",
    rssUrl: ANDROID_STUDIO_RSS_URL,
    stateDir: __dirname,
    intervalMinutes: 30,
});

watcher.on("new_article", async (news) => {
    log(
        "AndroidStudio-News-Bot",
        "INFO",
        `Preparing payload for: ${news.title}`,
    );

    const payload = buildNewsPost({
        title: news.title,
        description: news.description,
        link: news.link,
        tag: "#androidstudio",
        thumbnail: news.thumbnail,
    });

    await client.createPost(payload);
});

/**
 * Starts the Android Studio news bot.
 * Polls the RSS feed every 30 minutes.
 */
export function startAndroidStudioNewsBot() {
    watcher.start();
}
