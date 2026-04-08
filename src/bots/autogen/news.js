/**
 * @module bots/autogen/news
 * @description Microsoft AutoGen news bot.
 * Monitors the Microsoft AutoGen blog RSS feed and publishes
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

const RSS_URL = "https://devblogs.microsoft.com/autogen/feed/";

const client = createTdnClient("autogen");

const watcher = new BaseNewsWatcher({
    name: "AutoGen-News",
    rssUrl: RSS_URL,
    stateDir: __dirname,
    intervalMinutes: 30,
});

watcher.on("new_article", async (news) => {
    log("AutoGen-News-Bot", "INFO", `Preparing payload for: ${news.title}`);

    const payload = buildNewsPost({
        title: news.title,
        description: news.description,
        link: news.link,
        tag: "#autogen",
        thumbnail: news.thumbnail,
    });

    await client.createPost(payload);
});

export function startAutoGenNewsBot() {
    watcher.start();
}
