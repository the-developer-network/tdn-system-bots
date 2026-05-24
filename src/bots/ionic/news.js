/**
 * @module bots/ionic/news
 * @description Ionic news bot.
 * Monitors the Ionic blog RSS feed and publishes
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

/** @type {string} Ionic blog RSS feed URL */
const IONIC_RSS_URL = "https://ionic.io/blog/feed";

/** @type {import('../../api/client.js').TdnClient} API client for the Ionic bot */
const client = createTdnClient("ionic");

/** @type {BaseNewsWatcher} Ionic news watcher (30-minute interval) */
const watcher = new BaseNewsWatcher({
    name: "Ionic-News",
    rssUrl: IONIC_RSS_URL,
    stateDir: __dirname,
    intervalMinutes: 30,
});

/**
 * Handles new article events by building and publishing a post to TDN.
 * @param {object} news - RSS article data
 */
watcher.on("new_article", async (news) => {
    log("Ionic-News-Bot", "INFO", `Preparing payload for: ${news.title}`);

    const payload = buildNewsPost({
        title: news.title,
        description: news.description,
        link: news.link,
        tag: "#ionic",
        thumbnail: news.thumbnail,
    });

    await client.createPost(payload);
});

/**
 * Starts the Ionic news bot.
 * Polls the RSS feed every 30 minutes.
 */
export function startIonicNewsBot() {
    watcher.start();
}
