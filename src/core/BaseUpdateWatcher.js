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
        /** @type {number} Polling interval in milliseconds */
        this.interval = intervalMinutes * 60 * 1000;
        /** @type {NodeJS.Timeout|null} Active interval timer reference */
        this._timer = null;
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
    saveLastTag(tag) {
        const dir = path.dirname(this.stateFile);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(
            this.stateFile,
            JSON.stringify({
                lastTag: tag,
                updatedAt: new Date().toISOString(),
            }),
        );
    }

    /**
     * Checks the GitHub releases API for new releases. Emits 'new_update'
     * and updates the state file when a new release is found.
     * @returns {Promise<void>}
     */
    async checkUpdates() {
        log(this.name, "INFO", "Checking GitHub for new releases...");
        try {
            const response = await fetch(this.apiUrl, {
                headers: {
                    Accept: "application/vnd.github.v3+json",
                    "User-Agent": "TDN-System-Bot",
                },
            });

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
                return;
            }

            const latestRelease = data[0];
            const lastSavedTag = this.getLastSavedTag();

            if (latestRelease.tag_name !== lastSavedTag) {
                log(
                    this.name,
                    "SUCCESS",
                    `New release detected: ${latestRelease.tag_name}`,
                );
                this.saveLastTag(latestRelease.tag_name);

                /**
                 * Emitted when a new release is detected on GitHub.
                 * @event BaseUpdateWatcher#new_update
                 * @type {object}
                 * @property {string} tag_name - Release tag (e.g. 'v5.4.0')
                 * @property {string} name - Release title
                 * @property {string} html_url - GitHub release page URL
                 * @property {string} body - Release notes (Markdown)
                 */
                this.emit("new_update", latestRelease);
            } else {
                log(this.name, "INFO", "No new releases. Going back to sleep.");
            }
        } catch (error) {
            log(this.name, "ERROR", `GitHub check failed: ${error.message}`);
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
            `Update watcher started. Polling every ${this.interval / 1000 / 60} minutes.`,
        );
        this.checkUpdates();
        this._timer = setInterval(() => this.checkUpdates(), this.interval);
    }

    /**
     * Stops the watcher and clears the polling timer.
     */
    stop() {
        if (this._timer) {
            clearInterval(this._timer);
            this._timer = null;
            log(this.name, "INFO", "Update watcher stopped.");
        }
    }
}
