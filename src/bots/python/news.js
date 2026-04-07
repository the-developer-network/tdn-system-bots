/**
 * @module bots/python/news
 * @description Python news bot.
 * Monitors the Python blog RSS feed and publishes
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

/** @type {string} Python Blog RSS feed URL */
const PYTHON_RSS_URL = "https://blog.python.org/feeds/posts/default?alt=rss";

/** @type {import('../../api/client.js').TdnClient} API client for the Python bot */
const client = createTdnClient("python");

/** @type {BaseNewsWatcher} Python news watcher (30-minute interval) */
const watcher = new BaseNewsWatcher({
    name: "Python-News",
    rssUrl: PYTHON_RSS_URL,
    stateDir: __dirname,
    intervalMinutes: 30,
});

/**
 * Handles new article events by building and publishing a post to TDN.
 * @param {object} news - RSS article data
 */
watcher.on("new_article", async (news) => {
    log("Python-News-Bot", "INFO", `Preparing payload for: ${news.title}`);

    const payload = buildNewsPost({
        title: news.title,
        description: news.description,
        link: news.link,
        tag: "#python",
        thumbnail: news.thumbnail,
    });

    await client.createPost(payload);
});

/**
 * Starts the Python news bot.
 * Polls the RSS feed every 30 minutes.
 */
export function startPythonNewsBot() {
    watcher.start();
}
