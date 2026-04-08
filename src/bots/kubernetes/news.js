/**
 * @module bots/kubernetes/news
 * @description Kubernetes news bot.
 * Monitors the Kubernetes blog RSS feed and publishes
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

/** @type {string} Kubernetes blog RSS feed URL */
const K8S_RSS_URL = "https://kubernetes.io/feed.xml";

/** @type {import('../../api/client.js').TdnClient} API client for the Kubernetes bot */
const client = createTdnClient("kubernetes");

/** @type {BaseNewsWatcher} Kubernetes news watcher (30-minute interval) */
const watcher = new BaseNewsWatcher({
    name: "Kubernetes-News",
    rssUrl: K8S_RSS_URL,
    stateDir: __dirname,
    intervalMinutes: 30,
});

/**
 * Handles new article events by building and publishing a post to TDN.
 * @param {object} news - RSS article data
 */
watcher.on("new_article", async (news) => {
    log("K8s-News-Bot", "INFO", `Preparing payload for: ${news.title}`);

    const payload = buildNewsPost({
        title: news.title,
        description: news.description,
        link: news.link,
        tag: "#kubernetes",
        thumbnail: news.thumbnail,
    });

    await client.createPost(payload);
});

/**
 * Starts the Kubernetes news bot.
 * Polls the RSS feed every 30 minutes.
 */
export function startKubernetesNewsBot() {
    watcher.start();
}
