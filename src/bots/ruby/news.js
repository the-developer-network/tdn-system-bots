/**
 * @module bots/ruby/news
 * @description Ruby news bot.
 * Monitors the Ruby language official news RSS feed and publishes
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

/** @type {string} Ruby official news RSS feed URL */
const RUBY_RSS_URL = "https://www.ruby-lang.org/en/feeds/news.rss";

/** @type {import('../../api/client.js').TdnClient} API client for the Ruby bot */
const client = createTdnClient("ruby");

/** @type {BaseNewsWatcher} Ruby news watcher (30-minute interval) */
const watcher = new BaseNewsWatcher({
    name: "Ruby-News",
    rssUrl: RUBY_RSS_URL,
    stateDir: __dirname,
    intervalMinutes: 30,
});

/**
 * Handles new article events by building and publishing a post to TDN.
 * @param {object} news - RSS article data
 */
watcher.on("new_article", async (news) => {
    log("Ruby-News-Bot", "INFO", `Preparing payload for: ${news.title}`);

    const payload = buildNewsPost({
        title: news.title,
        description: news.description,
        link: news.link,
        tag: "#ruby",
        thumbnail: news.thumbnail,
    });

    await client.createPost(payload);
});

/**
 * Starts the Ruby news bot.
 * Polls the RSS feed every 30 minutes.
 */
export function startRubyNewsBot() {
    watcher.start();
}
