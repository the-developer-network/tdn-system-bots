/**
 * @module bots/unrealengine/news
 * @description Unreal Engine news bot.
 * Monitors the Unreal Engine blog RSS feed and publishes
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

/** @type {string} Unreal Engine blog RSS feed URL */
const UNREAL_RSS_URL = "https://www.unrealengine.com/en-US/rss";

/** @type {import('../../api/client.js').TdnClient} API client for the Unreal Engine bot */
const client = createTdnClient("unrealengine");

/** @type {BaseNewsWatcher} Unreal Engine news watcher (30-minute interval) */
const watcher = new BaseNewsWatcher({
    name: "UnrealEngine-News",
    rssUrl: UNREAL_RSS_URL,
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
    log(
        "UnrealEngine-News-Bot",
        "INFO",
        `Preparing payload for: ${news.title}`,
    );

    const payload = buildNewsPost({
        title: news.title,
        description: news.description,
        link: news.link,
        tag: "#unrealengine",
        thumbnail: news.thumbnail,
    });

    await client.createPost(payload);
});

/**
 * Starts the Unreal Engine news bot.
 * Polls the RSS feed every 30 minutes.
 */
export function startUnrealEngineNewsBot() {
    watcher.start();
}
