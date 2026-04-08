/**
 * @module bots/aws/news
 * @description AWS news bot.
 * Monitors the AWS Blog RSS feed and publishes
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

/** @type {string} AWS Blog RSS feed URL */
const AWS_RSS_URL = "https://aws.amazon.com/blogs/aws/feed/";

/** @type {import('../../api/client.js').TdnClient} API client for the AWS bot */
const client = createTdnClient("aws");

/** @type {BaseNewsWatcher} AWS news watcher (30-minute interval) */
const watcher = new BaseNewsWatcher({
    name: "AWS-News",
    rssUrl: AWS_RSS_URL,
    stateDir: __dirname,
    intervalMinutes: 30,
});

/**
 * Handles new article events by building and publishing a post to TDN.
 * @param {object} news - RSS article data
 */
watcher.on("new_article", async (news) => {
    log("AWS-News-Bot", "INFO", `Preparing payload for: ${news.title}`);

    const payload = buildNewsPost({
        title: news.title,
        description: news.description,
        link: news.link,
        tag: "#aws",
        thumbnail: news.thumbnail,
    });

    await client.createPost(payload);
});

/**
 * Starts the AWS news bot.
 * Polls the RSS feed every 30 minutes.
 */
export function startAWSNewsBot() {
    watcher.start();
}
