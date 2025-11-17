"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractMentions = extractMentions;
exports.createMentionNotifications = createMentionNotifications;
exports.formatMentions = formatMentions;
const prisma_1 = require("../lib/prisma");
/**
 * Extract usernames from text that are mentioned with @username format
 */
function extractMentions(text) {
    // Match @username pattern (alphanumeric, underscore, hyphen)
    // Exclude @ at start of line or after whitespace to avoid false positives
    const mentionRegex = /@([a-zA-Z0-9_-]+)/g;
    const matches = text.matchAll(mentionRegex);
    const usernames = new Set();
    for (const match of matches) {
        const username = match[1].toLowerCase();
        // Exclude common false positives
        if (username && !['http', 'https', 'www'].includes(username)) {
            usernames.add(username);
        }
    }
    return Array.from(usernames);
}
/**
 * Create mention notifications for users mentioned in text
 */
async function createMentionNotifications(text, mentionedByUserId, postId, commentId) {
    const usernames = extractMentions(text);
    if (usernames.length === 0) {
        return;
    }
    // Find all mentioned users
    const mentionedUsers = await prisma_1.prisma.user.findMany({
        where: {
            username: {
                in: usernames.map(u => u.toLowerCase())
            }
        },
        select: {
            id: true,
            username: true
        }
    });
    // Get the author's username for the notification message
    const author = await prisma_1.prisma.user.findUnique({
        where: { id: mentionedByUserId },
        select: { username: true }
    });
    const authorUsername = author?.username || 'someone';
    // Create notifications for each mentioned user (except the author)
    const notifications = mentionedUsers
        .filter(user => user.id !== mentionedByUserId)
        .map(user => ({
        userId: user.id,
        type: 'mention',
        actorId: mentionedByUserId,
        postId: postId || null,
        commentId: commentId || null,
        content: `u/${authorUsername} mentioned you in a ${commentId ? 'comment' : 'post'}`,
        isRead: false
    }));
    if (notifications.length > 0) {
        await prisma_1.prisma.notification.createMany({
            data: notifications
        });
    }
}
/**
 * Format text with clickable mention links
 */
function formatMentions(text) {
    // Replace @username with clickable links
    return text.replace(/@([a-zA-Z0-9_-]+)/g, (match, username) => {
        // Don't replace if it's part of a URL
        if (match.startsWith('@http') || match.startsWith('@https') || match.startsWith('@www')) {
            return match;
        }
        return `<a href="/u/${username}" class="mention-link">@${username}</a>`;
    });
}
