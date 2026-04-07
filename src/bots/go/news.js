/**
 * @module bots/go/news
 * @description Go news bot.
 * Monitors the Go blog Atom feed and publishes
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

/** @type {string} Go Blog Atom feed URL */
const GO_RSS_URL = "https://go.dev/blog/feed.atom";

/** @type {import('../../api/client.js').TdnClient} API client for the Go bot */
const client = createTdnClient("go");

/** @type {BaseNewsWatcher} Go news watcher (30-minute interval) */
const watcher = new BaseNewsWatcher({
    name: "Go-News",
    rssUrl: GO_RSS_URL,
    stateDir: __dirname,
    intervalMinutes: 30,
});

/**
 * Handles new article events by building and publishing a post to TDN.
 * @param {object} news - RSS article data
 */
watcher.on("new_article", async (news) => {
    log("Go-News-Bot", "INFO", `Preparing payload for: ${news.title}`);

    const payload = buildNewsPost({
        title: news.title,
        description: news.description,
        link: news.link,
        tag: "#go",
        thumbnail: news.thumbnail,
    });

    await client.createPost(payload);
});

/**
 * Starts the Go news bot.
 * Polls the Atom feed every 30 minutes.
 */
export function startGoNewsBot() {
    watcher.start();
}
