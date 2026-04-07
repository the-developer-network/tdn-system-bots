/**
 * @module core/BaseNewsWatcher
 * @description RSS-based news watcher base class.
 * Periodically polls an RSS feed and emits a 'new_article' event
 * when a new entry is detected. Uses rss2json API for RSS-to-JSON conversion.
 */

import { EventEmitter } from "events";
import fs from "fs";
import path from "path";
import { log } from "../logger.js";

/** @constant {string} RSS-to-JSON proxy API base URL */
const RSS2JSON_BASE = "https://api.rss2json.com/v1/api.json?rss_url=";

/**
 * RSS feed watcher base class.
 * Each bot uses this class to monitor its own RSS source.
 * @extends EventEmitter
 * @fires BaseNewsWatcher#new_article
 */
export class BaseNewsWatcher extends EventEmitter {
    /**
     * @param {object} options - Watcher configuration
     * @param {string} options.name - Watcher name used for logging (e.g. 'TS-News')
     * @param {string} options.rssUrl - RSS feed URL to monitor
     * @param {string} options.stateDir - Directory path for the state file
     * @param {number} [options.intervalMinutes=30] - Polling interval in minutes
     */
    constructor({ name, rssUrl, stateDir, intervalMinutes = 30 }) {
        super();

        /** @type {string} Watcher name */
        this.name = name;
        /** @type {string} Full rss2json API URL */
        this.apiUrl = `${RSS2JSON_BASE}${encodeURIComponent(rssUrl)}`;
        /** @type {string} Absolute path to news_state.json */
        this.stateFile = path.join(stateDir, "news_state.json");
        /** @type {number} Polling interval in milliseconds */
        this.interval = intervalMinutes * 60 * 1000;
        /** @type {NodeJS.Timeout|null} Active interval timer reference */
        this._timer = null;
    }

    /**
     * Reads the last saved article link from the state file.
     * Returns null if the file does not exist.
     * @returns {string|null} Last saved link or null
     */
    getLastSavedLink() {
        if (fs.existsSync(this.stateFile)) {
            const data = fs.readFileSync(this.stateFile, "utf-8");
            return JSON.parse(data).lastLink;
        }
        return null;
    }

    /**
     * Persists the last processed article link to the state file.
     * Creates the directory if it does not exist.
     * @param {string} link - Article URL to save
     */
    saveLastLink(link) {
        const dir = path.dirname(this.stateFile);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(
            this.stateFile,
            JSON.stringify({
                lastLink: link,
                updatedAt: new Date().toISOString(),
            }),
        );
    }

    /**
     * Checks the RSS feed for new articles. Emits 'new_article'
     * and updates the state file when a new entry is found.
     * @returns {Promise<void>}
     */
    async checkFeed() {
        log(this.name, "INFO", "Checking for new articles...");
        try {
            const response = await fetch(this.apiUrl);

            if (!response.ok) {
                log(
                    this.name,
                    "WARN",
                    `RSS fetch failed with status: ${response.status}`,
                );
                return;
            }

            const data = await response.json();

            if (data.status !== "ok" || !data.items || !data.items.length) {
                log(
                    this.name,
                    "WARN",
                    "RSS feed returned no items or invalid status.",
                );
                return;
            }

            const latestArticle = data.items[0];
            const lastSavedLink = this.getLastSavedLink();

            if (latestArticle.link !== lastSavedLink) {
                log(
                    this.name,
                    "SUCCESS",
                    `New article detected: ${latestArticle.title}`,
                );
                this.saveLastLink(latestArticle.link);

                /**
                 * Emitted when a new article is detected in the RSS feed.
                 * @event BaseNewsWatcher#new_article
                 * @type {object}
                 * @property {string} title - Article title
                 * @property {string} link - Article URL
                 * @property {string} description - Article description (may contain HTML)
                 * @property {string} [thumbnail] - Optional image URL
                 */
                this.emit("new_article", latestArticle);
            } else {
                log(this.name, "INFO", "No new articles. Going back to sleep.");
            }
        } catch (error) {
            log(this.name, "ERROR", `Feed check failed: ${error.message}`);
        }
    }

    /**
     * Starts the watcher. Runs the first check immediately,
     * then continues at the configured interval.
     */
    start() {
        log(
            this.name,
            "SUCCESS",
            `News watcher started. Interval: ${this.interval / 1000 / 60} mins.`,
        );
        this.checkFeed();
        this._timer = setInterval(() => this.checkFeed(), this.interval);
    }

    /**
     * Stops the watcher and clears the polling timer.
     */
    stop() {
        if (this._timer) {
            clearInterval(this._timer);
            this._timer = null;
            log(this.name, "INFO", "News watcher stopped.");
        }
    }
}
