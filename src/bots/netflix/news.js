/**
 * @module bots/netflix/news
 * @description Netflix Tech Blog news bot.
 * Monitors the Netflix Tech Blog RSS feed and publishes
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

/** @type {string} Netflix Tech Blog RSS feed URL */
const NETFLIX_RSS_URL = "https://netflixtechblog.com/feed";

/** @type {import('../../api/client.js').TdnClient} API client for the Netflix bot */
const client = createTdnClient("netflix");

/** @type {BaseNewsWatcher} Netflix Tech news watcher (30-minute interval) */
const watcher = new BaseNewsWatcher({
    name: "Netflix-News",
    rssUrl: NETFLIX_RSS_URL,
    stateDir: __dirname,
    intervalMinutes: 30,
});

/**
 * Handles new article events by building and publishing a post to TDN.
 * @param {object} news - RSS article data
 */
watcher.on("new_article", async (news) => {
    log("Netflix-News-Bot", "INFO", `Preparing payload for: ${news.title}`);

    const payload = buildNewsPost({
        title: news.title,
        description: news.description,
        link: news.link,
        tag: "#netflix",
        thumbnail: news.thumbnail,
    });

    await client.createPost(payload);
});

/**
 * Starts the Netflix Tech news bot.
 * Polls the RSS feed every 30 minutes.
 */
export function startNetflixNewsBot() {
    watcher.start();
}
