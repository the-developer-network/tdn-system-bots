/**
 * @module logger
 * @description Colorized console logging utility used by all bots and system components.
 */

/**
 * Writes a timestamped, color-coded log message to the console.
 * @param {string} botName - Log source identifier (e.g. 'TS-News-Bot', 'TDN-Client:typescript')
 * @param {'INFO'|'SUCCESS'|'WARN'|'ERROR'} logLevel - Severity level
 * @param {string} message - Log message
 */
export function log(botName, logLevel, message) {
    const timestamp = new Date().toISOString();

    /** @type {Record<string, string>} ANSI color codes per log level */
    const colors = {
        INFO: "\x1b[36m",
        SUCCESS: "\x1b[32m",
        WARN: "\x1b[33m",
        ERROR: "\x1b[31m",
    };
    const resetColor = "\x1b[0m";
    const color = colors[logLevel] || resetColor;

    console.log(
        `[${timestamp}] ${color}[${botName}] [${logLevel}]${resetColor} ${message}`,
    );
}
