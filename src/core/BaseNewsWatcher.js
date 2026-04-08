/**
 * @module core/BaseNewsWatcher
 * @description RSS-based news watcher base class.
 * Periodically polls an RSS feed directly (no third-party proxy) and emits
 * a 'new_article' event when a new entry is detected. Supports RSS 2.0 and Atom.
 */

import { EventEmitter } from "events";
import fs from "fs";
import path from "path";
import { XMLParser } from "fast-xml-parser";
import { log } from "../logger.js";
import { scheduledFetch } from "./requestScheduler.js";

/** @type {XMLParser} Shared XML parser (attribute names prefixed with @_) */
const xmlParser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    isArray: (name) => ["item", "entry"].includes(name),
    // RSS feeds from trusted sources can have many entity references; raise
    // the security limits well above the 1000-expansion default.
    processEntities: {
        enabled: true,
        maxTotalExpansions: Infinity,
        maxEntityCount: Infinity,
        maxEntitySize: 1_000_000,
        maxExpandedLength: 10_000_000,
    },
});

/**
 * Extracts a normalised article object from a raw RSS 2.0 item or Atom entry.
 * @param {object} item - Parsed XML item/entry node
 * @returns {{ title: string, link: string, description: string, thumbnail: string|null }|null}
 */
function normaliseItem(item) {
    if (!item) return null;

    const title =
        typeof item.title === "object" ? item.title["#text"] : item.title;

    let link = item.link;
    if (typeof link === "object") {
        const links = Array.isArray(link) ? link : [link];
        const alt = links.find(
            (l) => l["@_rel"] === "alternate" || !l["@_rel"],
        );
        link = alt?.["@_href"] ?? alt ?? null;
    }

    const rawDesc =
        item.description ??
        item.summary ??
        item.content ??
        item["content:encoded"] ??
        "";
    const description =
        typeof rawDesc === "object"
            ? (rawDesc["#text"] ?? "")
            : String(rawDesc);

    let thumbnail = null;
    if (item["media:thumbnail"]?.["@_url"]) {
        thumbnail = item["media:thumbnail"]["@_url"];
    } else if (item["media:content"]?.["@_url"]) {
        thumbnail = item["media:content"]["@_url"];
    } else if (item.enclosure?.["@_url"]) {
        const ct = item.enclosure["@_type"] ?? "";
        if (ct.startsWith("image/")) thumbnail = item.enclosure["@_url"];
    }

    if (!title || !link) return null;
    return {
        title: String(title),
        link: String(link),
        description,
        thumbnail,
    };
}

/**
 * RSS feed watcher base class.
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
        /** @type {string} RSS feed URL fetched directly */
        this.rssUrl = rssUrl;
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
            const headers = {
                "User-Agent": "TDN-System-Bot/1.0 (RSS reader)",
                Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
            };

            if (state.lastEtag) headers["If-None-Match"] = state.lastEtag;
            else if (state.lastModified)
                headers["If-Modified-Since"] = state.lastModified;

            const response = await scheduledFetch(
                this.rssUrl,
                { headers },
                "rss",
            );

            if (response.status === 304) {
                log(this.name, "INFO", "No new articles (304 Not Modified).");
                this._backoff = 0;
                return;
            }

            if (response.status === 429 || response.status === 403) {
                const retryAfter = response.headers.get("retry-after");
                this._backoff = retryAfter
                    ? Number(retryAfter) * 1000
                    : this._backoff === 0
                      ? 60_000
                      : Math.min(this._backoff * 2, 60 * 60_000);
                log(
                    this.name,
                    "WARN",
                    `RSS fetch rate limited (${response.status}). Backing off for ${Math.round(this._backoff / 1000)}s`,
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

            // Cache revalidation headers for next poll
            const newState = {};
            const etag = response.headers.get("etag");
            const lastModified = response.headers.get("last-modified");
            if (etag) newState.lastEtag = etag;
            else if (lastModified) newState.lastModified = lastModified;

            const xml = await response.text();
            const parsed = xmlParser.parse(xml);

            // Support RSS 2.0 (`rss.channel.item`) and Atom (`feed.entry`)
            const items =
                parsed?.rss?.channel?.item ?? parsed?.feed?.entry ?? null;

            if (!items || (Array.isArray(items) && items.length === 0)) {
                log(this.name, "WARN", "RSS feed returned no items.");
                this._backoff = 0;
                return;
            }

            const latest = normaliseItem(
                Array.isArray(items) ? items[0] : items,
            );

            if (!latest) {
                log(this.name, "WARN", "Could not parse latest item.");
                this._backoff = 0;
                return;
            }

            const lastSavedLink = this.getLastSavedLink();

            if (latest.link !== lastSavedLink) {
                log(
                    this.name,
                    "SUCCESS",
                    `New article detected: ${latest.title}`,
                );
                this.saveState({ lastLink: latest.link, ...newState });
                this.emit("new_article", latest);
            } else {
                log(this.name, "INFO", "No new articles. Going back to sleep.");
                if (Object.keys(newState).length) this.saveState(newState);
            }

            this._backoff = 0;
        } catch (error) {
            log(this.name, "ERROR", `Feed check failed: ${error.message}`);
            this._backoff =
                this._backoff === 0
                    ? 30_000
                    : Math.min(this._backoff * 2, 60 * 60_000);
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
