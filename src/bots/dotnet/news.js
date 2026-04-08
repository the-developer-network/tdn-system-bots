/**
 * @module bots/dotnet/news
 * @description .NET news bot.
 * Monitors the Microsoft .NET DevBlog RSS feed and publishes
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

/** @type {string} Microsoft .NET DevBlog RSS feed URL */
const DOTNET_RSS_URL = "https://devblogs.microsoft.com/dotnet/feed/";

/** @type {import('../../api/client.js').TdnClient} API client for the .NET bot */
const client = createTdnClient("dotnet");

/** @type {BaseNewsWatcher} .NET news watcher (30-minute interval) */
const watcher = new BaseNewsWatcher({
    name: "DotNet-News",
    rssUrl: DOTNET_RSS_URL,
    stateDir: __dirname,
    intervalMinutes: 30,
});

/**
 * Handles new article events by building and publishing a post to TDN.
 * @param {object} news - RSS article data
 */
watcher.on("new_article", async (news) => {
    log("DotNet-News-Bot", "INFO", `Preparing payload for: ${news.title}`);

    const payload = buildNewsPost({
        title: news.title,
        description: news.description,
        link: news.link,
        tag: "#dotnet",
        thumbnail: news.thumbnail,
    });

    await client.createPost(payload);
});

/**
 * Starts the .NET news bot.
 * Polls the RSS feed every 30 minutes.
 */
export function startDotNetNewsBot() {
    watcher.start();
}
