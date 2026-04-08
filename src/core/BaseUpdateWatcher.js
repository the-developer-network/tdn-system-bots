/**
 * @module core/BaseUpdateWatcher
 * @description GitHub release watcher base class.
 * Periodically polls a GitHub repository's releases and emits
 * a 'new_update' event when a new release is detected.
 */

import { EventEmitter } from "events";
import fs from "fs";
import path from "path";
import { log } from "../logger.js";
import { scheduledFetch } from "./requestScheduler.js";

/** @constant {string} GitHub API releases endpoint base URL */
const GITHUB_API_BASE = "https://api.github.com/repos";

/**
 * GitHub release watcher base class.
 * Each bot uses this class to monitor its own repository.
 * @extends EventEmitter
 * @fires BaseUpdateWatcher#new_update
 */
export class BaseUpdateWatcher extends EventEmitter {
    /**
     * @param {object} options - Watcher configuration
     * @param {string} options.name - Watcher name used for logging (e.g. 'TS-Update')
     * @param {string} options.githubRepo - GitHub repository path (e.g. 'microsoft/TypeScript')
     * @param {string} options.stateDir - Directory path for the state file
     * @param {number} [options.intervalMinutes=60] - Polling interval in minutes
     */
    constructor({ name, githubRepo, stateDir, intervalMinutes = 60 }) {
        super();

        /** @type {string} Watcher name */
        this.name = name;
        /** @type {string} GitHub API releases endpoint */
        this.apiUrl = `${GITHUB_API_BASE}/${githubRepo}/releases`;
        /** @type {string} Absolute path to updates_state.json */
        this.stateFile = path.join(stateDir, "updates_state.json");
        /** @type {number} Base polling interval in milliseconds */
        this._baseInterval = intervalMinutes * 60 * 1000;
        /** @type {number} Current backoff delay in milliseconds (0 = none) */
        this._backoff = 0;
        /** @type {NodeJS.Timeout|null} Active timer reference when using setInterval */
        this._timer = null;
        /** @type {boolean} stop flag for run loop */
        this._stopped = false;
    }

    /**
     * Reads the last saved release tag from the state file.
     * Returns null if the file does not exist.
     * @returns {string|null} Last saved tag or null
     */
    getLastSavedTag() {
        if (fs.existsSync(this.stateFile)) {
            const data = fs.readFileSync(this.stateFile, "utf-8");
            return JSON.parse(data).lastTag;
        }
        return null;
    }

    /**
     * Persists the last processed release tag to the state file.
     * Creates the directory if it does not exist.
     * @param {string} tag - Release tag name to save
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
     * Checks the GitHub releases API for new releases. Emits 'new_update'
     * and updates the state file when a new release is found.
     * @returns {Promise<void>}
     */
    async checkUpdates() {
        log(this.name, "INFO", "Checking GitHub for new releases...");
        try {
            const state = this.readState();
            const headers = {
                Accept: "application/vnd.github.v3+json",
                "User-Agent": "TDN-System-Bot",
            };

            // Add token if available to increase rate limits
            if (process.env.GITHUB_TOKEN) {
                headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
            }

            // Conditional request using ETag
            if (state.etag) {
                headers["If-None-Match"] = state.etag;
            }

            const response = await scheduledFetch(
                this.apiUrl,
                { headers },
                "github",
            );

            // Handle rate-limit / throttling responses
            if (response.status === 403 || response.status === 429) {
                log(
                    this.name,
                    "WARN",
                    `GitHub API request failed with status: ${response.status}`,
                );

                // If GitHub provides reset header, compute delay
                const reset = response.headers.get("x-ratelimit-reset");
                if (reset) {
                    const resetTs = Number(reset) * 1000;
                    const now = Date.now();
                    const waitMs = Math.max(resetTs - now, 60 * 1000);
                    this._backoff = Math.min(
                        Math.max(waitMs, 60 * 1000),
                        60 * 60 * 1000,
                    );
                } else {
                    // exponential backoff
                    this._backoff =
                        this._backoff === 0
                            ? 60 * 1000
                            : Math.min(this._backoff * 2, 60 * 60 * 1000);
                }

                log(
                    this.name,
                    "WARN",
                    `Backing off for ${Math.round(this._backoff / 1000)}s`,
                );
                return;
            }

            // 304 Not Modified — no changes
            if (response.status === 304) {
                log(this.name, "INFO", "No changes (304 Not Modified).");
                // reset backoff on healthy response
                this._backoff = 0;
                return;
            }

            if (!response.ok) {
                log(
                    this.name,
                    "WARN",
                    `GitHub API request failed with status: ${response.status}`,
                );
                return;
            }

            const data = await response.json();

            if (!Array.isArray(data) || data.length === 0) {
                log(this.name, "WARN", "No releases found on GitHub.");
                this._backoff = 0;
                return;
            }

            const latestRelease = data[0];
            const lastSavedTag = state.lastTag || null;

            // Save ETag if present
            const etag = response.headers.get("etag");
            if (etag) this.saveState({ etag });

            if (latestRelease.tag_name !== lastSavedTag) {
                log(
                    this.name,
                    "SUCCESS",
                    `New release detected: ${latestRelease.tag_name}`,
                );
                this.saveState({ lastTag: latestRelease.tag_name });

                this.emit("new_update", latestRelease);
            } else {
                log(this.name, "INFO", "No new releases. Going back to sleep.");
            }

            // reset backoff on successful check
            this._backoff = 0;
        } catch (error) {
            log(this.name, "ERROR", `GitHub check failed: ${error.message}`);
            // increase backoff on error
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
        // Spread initial requests over 1 minute to avoid thundering herd
        const jitter = Math.floor(Math.random() * 60_000);
        await new Promise((r) => setTimeout(r, jitter));

        while (!this._stopped) {
            await this.checkUpdates();

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
            `Update watcher started. Polling every ${this._baseInterval / 1000 / 60} minutes (with adaptive backoff).`,
        );
        this._stopped = false;
        // run loop in background (non-blocking)
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
        log(this.name, "INFO", "Update watcher stopped.");
    }
}
