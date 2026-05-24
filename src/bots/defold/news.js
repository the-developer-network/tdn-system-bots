/**
 * @module bots/defold/news
 * @description Defold news bot.
 * Monitors the Defold blog RSS feed and publishes
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

/** @type {string} Defold blog RSS feed URL */
const DEFOLD_RSS_URL = "https://defold.com/atom.xml";

/** @type {import('../../api/client.js').TdnClient} API client for the Defold bot */
const client = createTdnClient("defold");

/** @type {BaseNewsWatcher} Defold news watcher (30-minute interval) */
const watcher = new BaseNewsWatcher({
    name: "Defold-News",
    rssUrl: DEFOLD_RSS_URL,
    stateDir: __dirname,
    intervalMinutes: 30,
});

watcher.on("new_article", async (news) => {
    log("Defold-News-Bot", "INFO", `Preparing payload for: ${news.title}`);

    const payload = buildNewsPost({
        title: news.title,
        description: news.description,
        link: news.link,
        tag: "#defold",
        thumbnail: news.thumbnail,
    });

    await client.createPost(payload);
});

/**
 * Starts the Defold news bot.
 * Polls the RSS feed every 30 minutes.
 */
export function startDefoldNewsBot() {
    watcher.start();
}
