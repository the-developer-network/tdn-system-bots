/**
 * @module bots/nodejs/news
 * @description Node.js news bot.
 * Monitors the Node.js blog RSS feed and publishes
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

/** @type {string} Node.js Blog RSS feed URL */
const NODEJS_RSS_URL = "https://nodejs.org/en/feed/blog.xml";

/** @type {import('../../api/client.js').TdnClient} API client for the Node.js bot */
const client = createTdnClient("nodejs");

/** @type {BaseNewsWatcher} Node.js news watcher (30-minute interval) */
const watcher = new BaseNewsWatcher({
    name: "NodeJS-News",
    rssUrl: NODEJS_RSS_URL,
    stateDir: __dirname,
    intervalMinutes: 30,
});

/**
 * Handles new article events by building and publishing a post to TDN.
 * @param {object} news - RSS article data
 */
watcher.on("new_article", async (news) => {
    log("NodeJS-News-Bot", "INFO", `Preparing payload for: ${news.title}`);

    const payload = buildNewsPost({
        title: news.title,
        description: news.description,
        link: news.link,
        tag: "#nodejs",
        thumbnail: news.thumbnail,
    });

    await client.createPost(payload);
});

/**
 * Starts the Node.js news bot.
 * Polls the RSS feed every 30 minutes.
 */
export function startNodeJSNewsBot() {
    watcher.start();
}
