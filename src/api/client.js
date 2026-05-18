import { log } from "../logger.js";
import { BOT_CATEGORIES } from "../core/botCategories.js";

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const config = require("../../config.json");
const tokens = require("../../bot-tokens-private.json");

/**
 * TDN API client. Each bot instance manages its own credentials,
 * authentication, and token lifecycle independently.
 */
class TdnClient {
    /**
     * @param {string} botName - Bot key in config.json (e.g. 'typescript', 'react')
     */
    constructor(botName) {
        const botConfig = config.bots[botName];

        if (!botConfig) {
            throw new Error(`Bot "${botName}" not found in config.json`);
        }

        /** @type {string} TDN API base URL */
        this.baseURL = config.apiBaseUrl;
        /** @type {string|null} Current access token */
        this.accessToken = null;
        /** @type {string|null} Optional static bot token (from bot-tokens-private.json) */
        this.botToken =
            typeof tokens === "object"
                ? tokens[botName] ||
                  tokens[botConfig.username] ||
                  tokens[botConfig.email]
                : null;
        /** @type {string} Bot username used as login identifier (kept for fallback) */
        this.identifier = botConfig.username;
        /** @type {string} Bot password (kept for fallback) */
        this.password = botConfig.password;
        /** @type {string} Bot name used for logging */
        this.botName = botName;
    }

    /**
     * Authenticates with the TDN API and stores the access token.
     * When a static bot token exists in bot-tokens-private.json, username/password login is skipped.
     * @returns {Promise<void>}
     * @throws {Error} If login fails
     */
    async login() {
        if (this.botToken) {
            log(
                `TDN-Client:${this.botName}`,
                "INFO",
                "Using static bot token from bot-tokens-private.json — skipping username/password login.",
            );
            return;
        }

        log(
            `TDN-Client:${this.botName}`,
            "INFO",
            `Authenticating as ${this.identifier}...`,
        );

        try {
            const response = await fetch(`${this.baseURL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    identifier: this.identifier,
                    password: this.password,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                log(
                    `TDN-Client:${this.botName}`,
                    "ERROR",
                    `Login response: ${errorText}`,
                );
                throw new Error(`Login failed with status: ${response.status}`);
            }

            const responseBody = await response.json();
            this.accessToken = responseBody.data.accessToken;
            log(
                `TDN-Client:${this.botName}`,
                "SUCCESS",
                `Successfully authenticated. User ID: ${responseBody.data.user.id}`,
            );
        } catch (error) {
            log(
                `TDN-Client:${this.botName}`,
                "ERROR",
                `Authentication error: ${error.message}`,
            );
            throw error;
        }
    }

    /**
     * Performs an authenticated HTTP request. Uses static bot token if available,
     * otherwise falls back to username/password login and Bearer token behavior.
     * @param {string} endpoint - API endpoint path (e.g. '/posts')
     * @param {RequestInit} [options={}] - fetch() options
     * @returns {Promise<Response>} HTTP response
     */
    async fetchWithAuth(endpoint, options = {}) {
        const headers = {
            ...options.headers,
            "Content-Type": "application/json",
        };

        // If a static bot token is provided, use the `Bot <token>` scheme
        if (this.botToken) {
            headers.Authorization = `Bot ${this.botToken}`;

            const response = await fetch(`${this.baseURL}${endpoint}`, {
                ...options,
                headers,
            });

            if (response.status === 401) {
                log(
                    `TDN-Client:${this.botName}`,
                    "ERROR",
                    "Authentication failed using static bot token (401).",
                );
            }

            return response;
        }

        // Fallback to Bearer token flow (existing behavior)
        if (!this.accessToken) {
            await this.login();
        }

        headers.Authorization = `Bearer ${this.accessToken}`;

        let response = await fetch(`${this.baseURL}${endpoint}`, {
            ...options,
            headers,
        });

        if (response.status === 401) {
            log(
                `TDN-Client:${this.botName}`,
                "WARN",
                "Token expired (401). Attempting to re-authenticate and retry...",
            );
            this.accessToken = null;
            await this.login();

            headers["Authorization"] = `Bearer ${this.accessToken}`;
            response = await fetch(`${this.baseURL}${endpoint}`, {
                ...options,
                headers,
            });
        }

        return response;
    }

    /**
     * Creates a new post on the TDN platform.
     * @param {{ content: string, type: string, mediaUrls: string[], categories: string[] }} payload - Post data
     * @returns {Promise<object|null>} API response on success, null on failure
     */
    async createPost(payload) {
        try {
            const categories =
                payload.categories ?? BOT_CATEGORIES[this.botName] ?? [];
            const body = { ...payload, categories };

            const response = await this.fetchWithAuth("/posts", {
                method: "POST",
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(
                    `Post creation failed. Status: ${response.status} - ${JSON.stringify(errorData)}`,
                );
            }

            const result = await response.json();
            log(
                `TDN-Client:${this.botName}`,
                "SUCCESS",
                "Payload successfully published to TDN.",
            );
            return result;
        } catch (error) {
            log(
                `TDN-Client:${this.botName}`,
                "ERROR",
                `Failed to publish payload: ${error.message}`,
            );
            return null;
        }
    }
}

/**
 * Creates a new TdnClient instance for the specified bot.
 * Each bot maintains its own independent auth token.
 * @param {string} botName - Bot key in config.json (e.g. 'typescript', 'react')
 * @returns {TdnClient} Bot-specific API client
 */
export function createTdnClient(botName) {
    return new TdnClient(botName);
}
