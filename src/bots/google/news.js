/**
 * @module bots/google/news
 * @description Google Developers news bot.
 * Monitors the Google Developers Blog RSS feed and publishes
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

/** @type {string} Google Developers Blog RSS feed URL */
const GOOGLE_RSS_URL =
    "https://developers.googleblog.com/feeds/posts/default?alt=rss";

/** @type {import('../../api/client.js').TdnClient} API client for the Google bot */
const client = createTdnClient("google");

/** @type {BaseNewsWatcher} Google Developers news watcher (30-minute interval) */
const watcher = new BaseNewsWatcher({
    name: "Google-News",
    rssUrl: GOOGLE_RSS_URL,
    stateDir: __dirname,
    intervalMinutes: 30,
});

/**
 * Handles new article events by building and publishing a post to TDN.
 * @param {object} news - RSS article data
 */
watcher.on("new_article", async (news) => {
    log("Google-News-Bot", "INFO", `Preparing payload for: ${news.title}`);

    const payload = buildNewsPost({
        title: news.title,
        description: news.description,
        link: news.link,
        tag: "#google",
        thumbnail: news.thumbnail,
    });

    await client.createPost(payload);
});

/**
 * Starts the Google Developers news bot.
 * Polls the RSS feed every 30 minutes.
 */
export function startGoogleNewsBot() {
    watcher.start();
}
