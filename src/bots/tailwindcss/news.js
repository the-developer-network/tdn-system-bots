/**
 * @module bots/tailwindcss/news
 * @description Tailwind CSS news bot.
 * Monitors the Tailwind CSS blog RSS feed and publishes
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

/** @type {string} Tailwind CSS Blog RSS feed URL */
const TAILWIND_RSS_URL = "https://tailwindcss.com/feeds/feed.xml";

/** @type {import('../../api/client.js').TdnClient} API client for the Tailwind CSS bot */
const client = createTdnClient("tailwindcss");

/** @type {BaseNewsWatcher} Tailwind CSS news watcher (30-minute interval) */
const watcher = new BaseNewsWatcher({
    name: "Tailwind-News",
    rssUrl: TAILWIND_RSS_URL,
    stateDir: __dirname,
    intervalMinutes: 30,
});

/**
 * Handles new article events by building and publishing a post to TDN.
 * @param {object} news - RSS article data
 */
watcher.on("new_article", async (news) => {
    log("Tailwind-News-Bot", "INFO", `Preparing payload for: ${news.title}`);

    const payload = buildNewsPost({
        title: news.title,
        description: news.description,
        link: news.link,
        tag: "#tailwindcss",
        thumbnail: news.thumbnail,
    });

    await client.createPost(payload);
});

/**
 * Starts the Tailwind CSS news bot.
 * Polls the RSS feed every 30 minutes.
 */
export function startTailwindNewsBot() {
    watcher.start();
}
