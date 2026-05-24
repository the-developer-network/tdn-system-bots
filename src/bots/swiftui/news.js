/**
 * @module bots/swiftui/news
 * @description SwiftUI news bot.
 * Monitors the Swift.org blog RSS feed and publishes
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

/** @type {string} Swift.org blog RSS feed URL */
const SWIFTUI_RSS_URL = "https://www.swift.org/atom.xml";

/** @type {import('../../api/client.js').TdnClient} API client for the SwiftUI bot */
const client = createTdnClient("swiftui");

/** @type {BaseNewsWatcher} SwiftUI news watcher (30-minute interval) */
const watcher = new BaseNewsWatcher({
    name: "SwiftUI-News",
    rssUrl: SWIFTUI_RSS_URL,
    stateDir: __dirname,
    intervalMinutes: 30,
});

watcher.on("new_article", async (news) => {
    log("SwiftUI-News-Bot", "INFO", `Preparing payload for: ${news.title}`);

    const payload = buildNewsPost({
        title: news.title,
        description: news.description,
        link: news.link,
        tag: "#swiftui",
        thumbnail: news.thumbnail,
    });

    await client.createPost(payload);
});

/**
 * Starts the SwiftUI news bot.
 * Polls the RSS feed every 30 minutes.
 */
export function startSwiftUINewsBot() {
    watcher.start();
}
