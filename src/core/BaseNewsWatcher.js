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
import { scheduledFetch } from "./requestScheduler.js";

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
        /** @type {number} Base polling interval in milliseconds */
        this._baseInterval = intervalMinutes * 60 * 1000;
        /** @type {number} Current backoff delay in milliseconds (0 = none) */
        this._backoff = 0;
        /** @type {NodeJS.Timeout|null} Active interval timer reference */
        this._timer = null;
        this._stopped = false;
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
    saveState(state) {
        const dir = path.dirname(this.stateFile);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        const out = {
            ...(fs.existsSync(this.stateFile)
                ? JSON.parse(fs.readFileSync(this.stateFile, "utf-8"))
                : {}),
            ...state,
            updatedAt: new Date().toISOString(),
        };
        fs.writeFileSync(this.stateFile, JSON.stringify(out, null, 2));
    }

    readState() {
        if (fs.existsSync(this.stateFile)) {
            try {
                return JSON.parse(fs.readFileSync(this.stateFile, "utf-8"));
            } catch (e) {
                return {};
            }
        }
        return {};
    }

    /**
     * Checks the RSS feed for new articles. Emits 'new_article'
     * and updates the state file when a new entry is found.
     * @returns {Promise<void>}
     */
    async checkFeed() {
        log(this.name, "INFO", "Checking for new articles...");
        try {
            const state = this.readState();
            const headers = { "User-Agent": "TDN-System-Bot" };

            // If we stored a last-modified we can use If-Modified-Since
            if (state.lastFetched) {
                headers["If-Modified-Since"] = state.lastFetched;
            }

            const response = await scheduledFetch(
                this.apiUrl,
                { headers },
                "rss",
            );

            if (response.status === 429) {
                log(this.name, "WARN", `RSS fetch rate limited (429).`);
                this._backoff =
                    this._backoff === 0
                        ? 60 * 1000
                        : Math.min(this._backoff * 2, 60 * 60 * 1000);
                log(
                    this.name,
                    "WARN",
                    `Backing off for ${Math.round(this._backoff / 1000)}s`,
                );
                return;
            }

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
                this._backoff = 0;
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
                this.saveState({
                    lastLink: latestArticle.link,
                    lastFetched: new Date().toUTCString(),
                });

                this.emit("new_article", latestArticle);
            } else {
                log(this.name, "INFO", "No new articles. Going back to sleep.");
            }

            // reset backoff on success
            this._backoff = 0;
        } catch (error) {
            log(this.name, "ERROR", `Feed check failed: ${error.message}`);
            this._backoff =
                this._backoff === 0
                    ? 30 * 1000
                    : Math.min(this._backoff * 2, 60 * 60 * 1000);
        }
    }

    /**
     * Starts the watcher. Runs the first check immediately,
     * then continues at the configured interval.
     */
    async _runLoop() {
        // Spread initial requests over 2 minutes to avoid rss2json burst
        const jitter = Math.floor(Math.random() * 120_000);
        await new Promise((r) => setTimeout(r, jitter));

        while (!this._stopped) {
            await this.checkFeed();
            const delay =
                this._backoff > 0 ? this._backoff : this._baseInterval;
            const jitter2 = Math.floor(Math.random() * 10_000);
            await new Promise((r) => setTimeout(r, delay + jitter2));
        }
    }

    start() {
        log(
            this.name,
            "SUCCESS",
            `News watcher started. Interval: ${this._baseInterval / 1000 / 60} mins (with adaptive backoff).`,
        );
        this._stopped = false;
        this._runLoop().catch((err) =>
            log(this.name, "ERROR", `Run loop failed: ${err.message}`),
        );
    }

    /**
     * Stops the watcher and clears the polling timer.
     */
    stop() {
        this._stopped = true;
        if (this._timer) {
            clearInterval(this._timer);
            this._timer = null;
        }
        log(this.name, "INFO", "News watcher stopped.");
    }
}
