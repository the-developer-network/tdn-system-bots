/**
 * @module bots/astro/news
 * @description Astro news bot.
 * Monitors the Astro blog RSS feed and publishes
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

/** @type {string} Astro blog RSS feed URL */
const ASTRO_RSS_URL = "https://astro.build/rss.xml";

/** @type {import('../../api/client.js').TdnClient} API client for the Astro bot */
const client = createTdnClient("astro");

/** @type {BaseNewsWatcher} Astro news watcher (30-minute interval) */
const watcher = new BaseNewsWatcher({
    name: "Astro-News",
    rssUrl: ASTRO_RSS_URL,
    stateDir: __dirname,
    intervalMinutes: 30,
});

/**
 * Handles new article events by building and publishing a post to TDN.
 * @param {object} news - RSS article data
 */
watcher.on("new_article", async (news) => {
    log("Astro-News-Bot", "INFO", `Preparing payload for: ${news.title}`);

    const payload = buildNewsPost({
        title: news.title,
        description: news.description,
        link: news.link,
        tag: "#astro",
        thumbnail: news.thumbnail,
    });

    await client.createPost(payload);
});

/**
 * Starts the Astro news bot.
 * Polls the RSS feed every 30 minutes.
 */
export function startAstroNewsBot() {
    watcher.start();
}
