/**
 * @module bots/gemini/news
 * @description Google Gemini news bot.
 * Monitors the Google Gemini blog RSS feed and publishes
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

const RSS_URL = "https://blog.google/technology/ai/rss/";

const client = createTdnClient("gemini");

const watcher = new BaseNewsWatcher({
    name: "Gemini-News",
    rssUrl: RSS_URL,
    stateDir: __dirname,
    intervalMinutes: 30,
});

watcher.on("new_article", async (news) => {
    log("Gemini-News-Bot", "INFO", `Preparing payload for: ${news.title}`);

    const payload = buildNewsPost({
        title: news.title,
        description: news.description,
        link: news.link,
        tag: "#gemini",
        thumbnail: news.thumbnail,
    });

    await client.createPost(payload);
});

export function startGeminiNewsBot() {
    watcher.start();
}
