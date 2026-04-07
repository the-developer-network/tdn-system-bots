/**
 * @module core/utils
 * @description Shared utility functions for TDN bots.
 * Provides HTML/Markdown sanitization, content truncation, and post formatting.
 */

/** @constant {number} Maximum character limit for TDN posts */
const MAX_POST_LENGTH = 300;

/**
 * Strips HTML tags from a string.
 * @param {string} text - Text containing HTML markup
 * @returns {string} Plain text with tags removed
 */
export function cleanHtml(text) {
    return text.replace(/<[^>]*>?/gm, "").trim();
}

/**
 * Strips Markdown formatting characters from a string.
 * Removes bold, italic, heading, code, strikethrough, blockquote, and link syntax.
 * @param {string} text - Markdown-formatted text
 * @returns {string} Plain text with formatting removed
 */
export function cleanMarkdown(text) {
    return text
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/[*_#`~>-]/g, "")
        .replace(/\r\n|\n|\r/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

/**
 * Truncates text to the given length and appends '...'.
 * Returns the original string if it does not exceed the limit.
 * @param {string} content - Text to truncate
 * @param {number} maxLength - Maximum character length
 * @returns {string} Truncated or original text
 */
export function truncateContent(content, maxLength) {
    if (content.length <= maxLength) {
        return content;
    }
    return content.substring(0, maxLength - 3) + "...";
}

/**
 * Builds a TDN post payload for an RSS news article.
 * Combines title, description, link, and tag within the 300-character limit.
 * @param {object} params - Post parameters
 * @param {string} params.title - Article title
 * @param {string} params.description - Article description (may contain HTML)
 * @param {string} params.link - Article URL
 * @param {string} params.tag - Hashtag (e.g. '#typescript')
 * @param {string} [params.thumbnail] - Optional image URL
 * @returns {{ content: string, type: string, mediaUrls: string[] }} TDN post payload
 */
export function buildNewsPost({ title, description, link, tag, thumbnail }) {
    const cleanTitle = title.trim();
    const cleanLink = link.trim();
    const cleanDesc = cleanHtml(description);

    const header = `🚨 **${cleanTitle}**\n\n`;
    const footer = `\n\n🔗 ${cleanLink}\n${tag}`;
    const fixedLength = header.length + footer.length;
    const availableDescSpace = MAX_POST_LENGTH - 5 - fixedLength;

    let desc = "";
    if (availableDescSpace > 0 && cleanDesc.length > 0) {
        desc = truncateContent(cleanDesc, availableDescSpace);
    }

    let content = header;
    if (desc) content += desc;
    content += footer;

    content = truncateContent(content, MAX_POST_LENGTH);

    return {
        content,
        type: "TECH_NEWS",
        mediaUrls: thumbnail ? [thumbnail] : [],
    };
}

/**
 * Builds a TDN post payload for a GitHub release.
 * Combines version info, description, link, and tag within the 300-character limit.
 * @param {object} params - Post parameters
 * @param {string} params.title - Release title or tag name
 * @param {string} params.description - Release notes (may contain Markdown)
 * @param {string} params.link - GitHub release URL
 * @param {string} params.tag - Hashtag (e.g. '#typescript')
 * @returns {{ content: string, type: string, mediaUrls: string[] }} TDN post payload
 */
export function buildUpdatePost({ title, description, link, tag }) {
    const cleanTitle = title.trim();
    const cleanLink = link.trim();
    const cleanDesc = cleanMarkdown(description || "");

    const header = `🚀 **${cleanTitle}**\n\n`;
    const footer = `\n\n🔗 ${cleanLink}\n${tag}`;
    const fixedLength = header.length + footer.length;
    const availableDescSpace = MAX_POST_LENGTH - 5 - fixedLength;

    let desc = "";
    if (availableDescSpace > 0 && cleanDesc.length > 0) {
        desc = truncateContent(cleanDesc, availableDescSpace);
    }

    let content = header;
    if (desc) content += desc;
    content += footer;

    content = truncateContent(content, MAX_POST_LENGTH);

    return {
        content,
        type: "SYSTEM_UPDATE",
        mediaUrls: [],
    };
}
