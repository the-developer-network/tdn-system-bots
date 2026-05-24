/**
 * @module bots/appwrite/news
 * @description Appwrite news bot.
 * Monitors the Appwrite blog RSS feed and publishes
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

/** @type {string} Appwrite blog RSS feed URL */
const APPWRITE_RSS_URL = "https://appwrite.io/rss.xml";

/** @type {import('../../api/client.js').TdnClient} API client for the Appwrite bot */
const client = createTdnClient("appwrite");

/** @type {BaseNewsWatcher} Appwrite news watcher (30-minute interval) */
const watcher = new BaseNewsWatcher({
    name: "Appwrite-News",
    rssUrl: APPWRITE_RSS_URL,
    stateDir: __dirname,
    intervalMinutes: 30,
});

watcher.on("new_article", async (news) => {
    log("Appwrite-News-Bot", "INFO", `Preparing payload for: ${news.title}`);

    const payload = buildNewsPost({
        title: news.title,
        description: news.description,
        link: news.link,
        tag: "#appwrite",
        thumbnail: news.thumbnail,
    });

    await client.createPost(payload);
});

/**
 * Starts the Appwrite news bot.
 * Polls the RSS feed every 30 minutes.
 */
export function startAppwriteNewsBot() {
    watcher.start();
}
