import { log } from "../logger.js";

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const config = require("../../config.json");

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
        /** @type {string} Bot username used as login identifier */
        this.identifier = botConfig.username;
        /** @type {string} Bot password */
        this.password = botConfig.password;
        /** @type {string} Bot name used for logging */
        this.botName = botName;
    }

    /**
     * Authenticates with the TDN API and stores the access token.
     * @returns {Promise<void>}
     * @throws {Error} If login fails
     */
    async login() {
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
     * Performs an authenticated HTTP request. Automatically re-authenticates
     * and retries if the token is missing or expired.
     * @param {string} endpoint - API endpoint path (e.g. '/posts')
     * @param {RequestInit} [options={}] - fetch() options
     * @returns {Promise<Response>} HTTP response
     */
    async fetchWithAuth(endpoint, options = {}) {
        if (!this.accessToken) {
            await this.login();
        }

        const headers = {
            ...options.headers,
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.accessToken}`,
        };

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
     * @param {{ content: string, type: string, mediaUrls: string[] }} payload - Post data
     * @returns {Promise<object|null>} API response on success, null on failure
     */
    async createPost(payload) {
        try {
            const response = await this.fetchWithAuth("/posts", {
                method: "POST",
                body: JSON.stringify(payload),
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
