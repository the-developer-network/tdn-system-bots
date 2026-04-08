/**
 * @module bots/elixir/news
 * @description Elixir news bot.
 * Monitors the Elixir language blog Atom feed and publishes
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

/** @type {string} Elixir blog Atom feed URL */
const ELIXIR_RSS_URL = "https://elixir-lang.org/blog.atom";

/** @type {import('../../api/client.js').TdnClient} API client for the Elixir bot */
const client = createTdnClient("elixir");

/** @type {BaseNewsWatcher} Elixir news watcher (30-minute interval) */
const watcher = new BaseNewsWatcher({
    name: "Elixir-News",
    rssUrl: ELIXIR_RSS_URL,
    stateDir: __dirname,
    intervalMinutes: 30,
});

/**
 * Handles new article events by building and publishing a post to TDN.
 * @param {object} news - RSS article data
 */
watcher.on("new_article", async (news) => {
    log("Elixir-News-Bot", "INFO", `Preparing payload for: ${news.title}`);

    const payload = buildNewsPost({
        title: news.title,
        description: news.description,
        link: news.link,
        tag: "#elixir",
        thumbnail: news.thumbnail,
    });

    await client.createPost(payload);
});

/**
 * Starts the Elixir news bot.
 * Polls the Atom feed every 30 minutes.
 */
export function startElixirNewsBot() {
    watcher.start();
}
