/**
 * @module bots/vercel/news
 * @description Vercel news bot.
 * Monitors the Vercel Blog RSS feed and publishes
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

/** @type {string} Vercel Blog RSS feed URL */
const VERCEL_RSS_URL = "https://vercel.com/blog/rss.xml";

/** @type {import('../../api/client.js').TdnClient} API client for the Vercel bot */
const client = createTdnClient("vercel");

/** @type {BaseNewsWatcher} Vercel news watcher (30-minute interval) */
const watcher = new BaseNewsWatcher({
    name: "Vercel-News",
    rssUrl: VERCEL_RSS_URL,
    stateDir: __dirname,
    intervalMinutes: 30,
});

/**
 * Handles new article events by building and publishing a post to TDN.
 * @param {object} news - RSS article data
 */
watcher.on("new_article", async (news) => {
    log("Vercel-News-Bot", "INFO", `Preparing payload for: ${news.title}`);

    const payload = buildNewsPost({
        title: news.title,
        description: news.description,
        link: news.link,
        tag: "#vercel",
        thumbnail: news.thumbnail,
    });

    await client.createPost(payload);
});

/**
 * Starts the Vercel news bot.
 * Polls the RSS feed every 30 minutes.
 */
export function startVercelNewsBot() {
    watcher.start();
}
