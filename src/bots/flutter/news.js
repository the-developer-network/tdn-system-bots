/**
 * @module bots/flutter/news
 * @description Flutter news bot.
 * Monitors the Flutter Medium blog RSS feed and publishes
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

/** @type {string} Flutter Medium blog RSS feed URL */
const FLUTTER_RSS_URL = "https://medium.com/feed/flutter";

/** @type {import('../../api/client.js').TdnClient} API client for the Flutter bot */
const client = createTdnClient("flutter");

/** @type {BaseNewsWatcher} Flutter news watcher (30-minute interval) */
const watcher = new BaseNewsWatcher({
    name: "Flutter-News",
    rssUrl: FLUTTER_RSS_URL,
    stateDir: __dirname,
    intervalMinutes: 30,
});

/**
 * Handles new article events by building and publishing a post to TDN.
 * @param {object} news - RSS article data
 */
watcher.on("new_article", async (news) => {
    log("Flutter-News-Bot", "INFO", `Preparing payload for: ${news.title}`);

    const payload = buildNewsPost({
        title: news.title,
        description: news.description,
        link: news.link,
        tag: "#flutter",
        thumbnail: news.thumbnail,
    });

    await client.createPost(payload);
});

/**
 * Starts the Flutter news bot.
 * Polls the RSS feed every 30 minutes.
 */
export function startFlutterNewsBot() {
    watcher.start();
}
