/**
 * @module bots/firebase/news
 * @description Firebase news bot.
 * Monitors the Firebase blog RSS feed and publishes
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

/** @type {string} Firebase blog RSS feed URL */
const FIREBASE_RSS_URL = "https://firebase.blog/feeds/posts/default";

/** @type {import('../../api/client.js').TdnClient} API client for the Firebase bot */
const client = createTdnClient("firebase");

/** @type {BaseNewsWatcher} Firebase news watcher (30-minute interval) */
const watcher = new BaseNewsWatcher({
    name: "Firebase-News",
    rssUrl: FIREBASE_RSS_URL,
    stateDir: __dirname,
    intervalMinutes: 30,
});

watcher.on("new_article", async (news) => {
    log("Firebase-News-Bot", "INFO", `Preparing payload for: ${news.title}`);

    const payload = buildNewsPost({
        title: news.title,
        description: news.description,
        link: news.link,
        tag: "#firebase",
        thumbnail: news.thumbnail,
    });

    await client.createPost(payload);
});

/**
 * Starts the Firebase news bot.
 * Polls the RSS feed every 30 minutes.
 */
export function startFirebaseNewsBot() {
    watcher.start();
}
