/**
 * @module bots/xcode/news
 * @description Xcode news bot.
 * Monitors the Apple Developer releases RSS feed and publishes
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

/** @type {string} Apple Developer releases RSS feed URL */
const XCODE_RSS_URL =
    "https://developer.apple.com/news/releases/rss/releases.rss";

/** @type {import('../../api/client.js').TdnClient} API client for the Xcode bot */
const client = createTdnClient("xcode");

/** @type {BaseNewsWatcher} Xcode news watcher (30-minute interval) */
const watcher = new BaseNewsWatcher({
    name: "Xcode-News",
    rssUrl: XCODE_RSS_URL,
    stateDir: __dirname,
    intervalMinutes: 30,
});

watcher.on("new_article", async (news) => {
    log("Xcode-News-Bot", "INFO", `Preparing payload for: ${news.title}`);

    const payload = buildNewsPost({
        title: news.title,
        description: news.description,
        link: news.link,
        tag: "#xcode",
        thumbnail: news.thumbnail,
    });

    await client.createPost(payload);
});

/**
 * Starts the Xcode news bot.
 * Polls the RSS feed every 30 minutes.
 */
export function startXcodeNewsBot() {
    watcher.start();
}
