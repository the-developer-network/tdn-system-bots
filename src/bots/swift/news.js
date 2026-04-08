/**
 * @module bots/swift/news
 * @description Swift news bot.
 * Monitors the Swift.org blog Atom feed and publishes
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

/** @type {string} Swift.org blog Atom feed URL */
const SWIFT_RSS_URL = "https://www.swift.org/atom.xml";

/** @type {import('../../api/client.js').TdnClient} API client for the Swift bot */
const client = createTdnClient("swift");

/** @type {BaseNewsWatcher} Swift news watcher (30-minute interval) */
const watcher = new BaseNewsWatcher({
    name: "Swift-News",
    rssUrl: SWIFT_RSS_URL,
    stateDir: __dirname,
    intervalMinutes: 30,
});

/**
 * Handles new article events by building and publishing a post to TDN.
 * @param {object} news - RSS article data
 */
watcher.on("new_article", async (news) => {
    log("Swift-News-Bot", "INFO", `Preparing payload for: ${news.title}`);

    const payload = buildNewsPost({
        title: news.title,
        description: news.description,
        link: news.link,
        tag: "#swift",
        thumbnail: news.thumbnail,
    });

    await client.createPost(payload);
});

/**
 * Starts the Swift news bot.
 * Polls the Atom feed every 30 minutes.
 */
export function startSwiftNewsBot() {
    watcher.start();
}
