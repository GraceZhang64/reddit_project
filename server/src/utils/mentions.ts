import { prisma } from '../lib/prisma';

/**
 * Extract usernames from text that are mentioned with @username format
 */
export function extractMentions(text: string): string[] {
  // Match @username pattern (alphanumeric, underscore, hyphen)
  // Exclude @ at start of line or after whitespace to avoid false positives
  const mentionRegex = /@([a-zA-Z0-9_-]+)/g;
  const matches = text.matchAll(mentionRegex);
  const usernames = new Set<string>();
  
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
export async function createMentionNotifications(
  text: string,
  mentionedByUserId: string,
  postId?: number,
  commentId?: number
): Promise<void> {
  const usernames = extractMentions(text);
  
  if (usernames.length === 0) {
    return;
  }

  // Find all mentioned users
  const mentionedUsers = await prisma.user.findMany({
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
  const author = await prisma.user.findUnique({
    where: { id: mentionedByUserId },
    select: { username: true }
  });

  const authorUsername = author?.username || 'someone';

  // Create notifications for each mentioned user (except the author)
  const notifications = mentionedUsers
    .filter(user => user.id !== mentionedByUserId)
    .map(user => ({
      userId: user.id,
      type: 'mention' as const,
      actorId: mentionedByUserId,
      postId: postId || null,
      commentId: commentId || null,
      content: `u/${authorUsername} mentioned you in a ${commentId ? 'comment' : 'post'}`,
      isRead: false
    }));

  if (notifications.length > 0) {
    await prisma.notification.createMany({
      data: notifications
    });
  }
}

/**
 * Format text with clickable mention links
 */
export function formatMentions(text: string): string {
  // Replace @username with clickable links
  return text.replace(/@([a-zA-Z0-9_-]+)/g, (match, username) => {
    // Don't replace if it's part of a URL
    if (match.startsWith('@http') || match.startsWith('@https') || match.startsWith('@www')) {
      return match;
    }
    return `<a href="/u/${username}" class="mention-link">@${username}</a>`;
  });
}

