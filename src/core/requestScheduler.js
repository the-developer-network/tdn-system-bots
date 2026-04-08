/**
 * @module core/requestScheduler
 * @description Centralized request scheduler to prevent API rate-limit exhaustion.
 * Provides separate queues for GitHub and RSS requests with concurrency limits
 * and minimum delays between requests.
 */

import { log } from "../logger.js";

/**
 * @typedef {'github'|'rss'} RequestType
 */

/** @type {Map<string, { maxConcurrent: number, minDelay: number, active: number, lastRequest: number, queue: Array }>} */
const lanes = new Map([
    [
        "github",
        {
            maxConcurrent: 2,
            minDelay: 600, // 600ms between GitHub requests
            active: 0,
            lastRequest: 0,
            queue: [],
        },
    ],
    [
        "rss",
        {
            maxConcurrent: 1,
            minDelay: 5000, // 5s between RSS requests (rss2json free-tier is strict)
            active: 0,
            lastRequest: 0,
            queue: [],
        },
    ],
]);

/**
 * Processes the next request in a lane's queue if capacity allows.
 * @param {string} type - Lane identifier
 */
function drain(type) {
    const lane = lanes.get(type);
    if (!lane || lane.queue.length === 0 || lane.active >= lane.maxConcurrent)
        return;

    const now = Date.now();
    const elapsed = now - lane.lastRequest;

    if (elapsed < lane.minDelay) {
        // Wait for the remaining delay before processing
        setTimeout(() => drain(type), lane.minDelay - elapsed);
        return;
    }

    const { url, options, resolve, reject } = lane.queue.shift();
    lane.active++;
    lane.lastRequest = Date.now();

    fetch(url, options)
        .then(async (response) => {
            lane.active--;

            // On 429 or 403, push back to the FRONT of the queue with a delay
            if (response.status === 429 || response.status === 403) {
                const retryAfter = response.headers.get("retry-after");
                const resetHeader = response.headers.get("x-ratelimit-reset");
                let waitMs = 60_000; // default 60s

                if (retryAfter) {
                    waitMs = Number(retryAfter) * 1000;
                } else if (resetHeader) {
                    waitMs = Math.max(
                        Number(resetHeader) * 1000 - Date.now(),
                        60_000,
                    );
                }

                waitMs = Math.min(waitMs, 10 * 60_000); // cap at 10 minutes

                log(
                    "SCHEDULER",
                    "WARN",
                    `${type} ${response.status} — pausing lane for ${Math.round(waitMs / 1000)}s`,
                );

                // Resolve with the response so the caller can handle it (log, skip, etc.)
                resolve(response);

                // Pause this lane's drain
                setTimeout(() => drain(type), waitMs);
                return;
            }

            resolve(response);
            // Drain next after minDelay
            setTimeout(() => drain(type), lane.minDelay);
        })
        .catch((err) => {
            lane.active--;
            reject(err);
            setTimeout(() => drain(type), lane.minDelay);
        });
}

/**
 * Enqueues a fetch request through the rate-limited scheduler.
 * @param {string} url - URL to fetch
 * @param {RequestInit} [options={}] - Fetch options
 * @param {RequestType} [type='github'] - Queue lane ('github' or 'rss')
 * @returns {Promise<Response>} The fetch response
 */
export function scheduledFetch(url, options = {}, type = "github") {
    return new Promise((resolve, reject) => {
        const lane = lanes.get(type);
        if (!lane) {
            // Fallback: unknown type, just fetch directly
            return fetch(url, options).then(resolve, reject);
        }
        lane.queue.push({ url, options, resolve, reject });
        drain(type);
    });
}
