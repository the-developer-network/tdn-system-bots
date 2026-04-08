/**
 * @module bots/cursor/news
 * @description Cursor news bot.
 * Monitors the Cursor blog RSS feed and publishes
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

const RSS_URL = "https://www.cursor.com/changelog/rss.xml";

const client = createTdnClient("cursor");

const watcher = new BaseNewsWatcher({
    name: "Cursor-News",
    rssUrl: RSS_URL,
    stateDir: __dirname,
    intervalMinutes: 30,
});

watcher.on("new_article", async (news) => {
    log("Cursor-News-Bot", "INFO", `Preparing payload for: ${news.title}`);

    const payload = buildNewsPost({
        title: news.title,
        description: news.description,
        link: news.link,
        tag: "#cursor",
        thumbnail: news.thumbnail,
    });

    await client.createPost(payload);
});

export function startCursorNewsBot() {
    watcher.start();
}
