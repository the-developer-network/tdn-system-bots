/**
 * @module bots/groq/news
 * @description Groq news bot.
 * Monitors the Groq blog RSS feed and publishes
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

const RSS_URL = "https://groq.com/feed/";

const client = createTdnClient("groq");

const watcher = new BaseNewsWatcher({
    name: "Groq-News",
    rssUrl: RSS_URL,
    stateDir: __dirname,
    intervalMinutes: 30,
});

watcher.on("new_article", async (news) => {
    log("Groq-News-Bot", "INFO", `Preparing payload for: ${news.title}`);

    const payload = buildNewsPost({
        title: news.title,
        description: news.description,
        link: news.link,
        tag: "#groq",
        thumbnail: news.thumbnail,
    });

    await client.createPost(payload);
});

export function startGroqNewsBot() {
    watcher.start();
}
