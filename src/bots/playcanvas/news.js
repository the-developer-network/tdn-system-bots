/**
 * @module bots/playcanvas/news
 * @description PlayCanvas news bot.
 * Monitors the PlayCanvas blog RSS feed and publishes
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

/** @type {string} PlayCanvas blog RSS feed URL */
const PLAYCANVAS_RSS_URL = "https://blog.playcanvas.com/feed/";

/** @type {import('../../api/client.js').TdnClient} API client for the PlayCanvas bot */
const client = createTdnClient("playcanvas");

/** @type {BaseNewsWatcher} PlayCanvas news watcher (30-minute interval) */
const watcher = new BaseNewsWatcher({
    name: "PlayCanvas-News",
    rssUrl: PLAYCANVAS_RSS_URL,
    stateDir: __dirname,
    intervalMinutes: 30,
});

watcher.on("new_article", async (news) => {
    log("PlayCanvas-News-Bot", "INFO", `Preparing payload for: ${news.title}`);

    const payload = buildNewsPost({
        title: news.title,
        description: news.description,
        link: news.link,
        tag: "#playcanvas",
        thumbnail: news.thumbnail,
    });

    await client.createPost(payload);
});

/**
 * Starts the PlayCanvas news bot.
 * Polls the RSS feed every 30 minutes.
 */
export function startPlayCanvasNewsBot() {
    watcher.start();
}
