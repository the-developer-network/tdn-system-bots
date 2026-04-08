/**
 * @module bots/bevy/news
 * @description Bevy Engine news bot.
 * Monitors the Bevy Engine blog RSS feed and publishes
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

/** @type {string} Bevy Engine blog RSS feed URL */
const BEVY_RSS_URL = "https://bevyengine.org/news/rss.xml";

/** @type {import('../../api/client.js').TdnClient} API client for the Bevy bot */
const client = createTdnClient("bevy");

/** @type {BaseNewsWatcher} Bevy news watcher (30-minute interval) */
const watcher = new BaseNewsWatcher({
    name: "Bevy-News",
    rssUrl: BEVY_RSS_URL,
    stateDir: __dirname,
    intervalMinutes: 30,
});

/**
 * Handles new article events by building and publishing a post to TDN.
 * @param {object} news - RSS article data
 * @param {string} news.title - Article title
 * @param {string} news.link - Article URL
 * @param {string} news.description - Article description
 * @param {string} [news.thumbnail] - Article image
 */
watcher.on("new_article", async (news) => {
    log("Bevy-News-Bot", "INFO", `Preparing payload for: ${news.title}`);

    const payload = buildNewsPost({
        title: news.title,
        description: news.description,
        link: news.link,
        tag: "#bevy",
        thumbnail: news.thumbnail,
    });

    await client.createPost(payload);
});

/**
 * Starts the Bevy news bot.
 * Polls the RSS feed every 30 minutes.
 */
export function startBevyNewsBot() {
    watcher.start();
}
