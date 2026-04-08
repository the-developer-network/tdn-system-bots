/**
 * @module bots/unity/news
 * @description Unity news bot.
 * Monitors the Unity Blog RSS feed and publishes
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

/** @type {string} Unity Blog RSS feed URL */
const UNITY_RSS_URL = "https://blog.unity.com/rss.xml";

/** @type {import('../../api/client.js').TdnClient} API client for the Unity bot */
const client = createTdnClient("unity");

/** @type {BaseNewsWatcher} Unity news watcher (30-minute interval) */
const watcher = new BaseNewsWatcher({
    name: "Unity-News",
    rssUrl: UNITY_RSS_URL,
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
    log("Unity-News-Bot", "INFO", `Preparing payload for: ${news.title}`);

    const payload = buildNewsPost({
        title: news.title,
        description: news.description,
        link: news.link,
        tag: "#unity",
        thumbnail: news.thumbnail,
    });

    await client.createPost(payload);
});

/**
 * Starts the Unity news bot.
 * Polls the RSS feed every 30 minutes.
 */
export function startUnityNewsBot() {
    watcher.start();
}
