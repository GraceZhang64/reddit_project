import { extractMentions, createMentionNotifications, formatMentions } from '../utils/mentions';
import { prisma } from '../lib/prisma';

// Mock dependencies
jest.mock('../lib/prisma', () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    notification: {
      createMany: jest.fn(),
    },
  },
}));

describe('Mentions Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('extractMentions', () => {
    it('should extract single username', () => {
      const text = 'Hey @john, how are you?';
      const mentions = extractMentions(text);
      expect(mentions).toEqual(['john']);
    });

    it('should extract multiple usernames', () => {
      const text = '@alice and @bob went to @charlie house';
      const mentions = extractMentions(text);
      expect(mentions).toContain('alice');
      expect(mentions).toContain('bob');
      expect(mentions).toContain('charlie');
      expect(mentions).toHaveLength(3);
    });

    it('should handle usernames with underscores and hyphens', () => {
      const text = 'Mentioning @user_name and @user-name-123';
      const mentions = extractMentions(text);
      expect(mentions).toContain('user_name');
      expect(mentions).toContain('user-name-123');
    });

    it('should convert usernames to lowercase', () => {
      const text = '@JohnDoe and @JANE_DOE';
      const mentions = extractMentions(text);
      expect(mentions).toEqual(['johndoe', 'jane_doe']);
    });

    it('should exclude common false positives', () => {
      const text = 'Check out @http://example.com and @https://test.com';
      const mentions = extractMentions(text);
      expect(mentions).not.toContain('http');
      expect(mentions).not.toContain('https');
    });

    it('should handle duplicate mentions', () => {
      const text = '@john said hi to @john again';
      const mentions = extractMentions(text);
      expect(mentions).toEqual(['john']);
    });

    it('should return empty array if no mentions', () => {
      const text = 'This text has no mentions';
      const mentions = extractMentions(text);
      expect(mentions).toEqual([]);
    });

    it('should handle mentions at start of text', () => {
      const text = '@alice this is for you';
      const mentions = extractMentions(text);
      expect(mentions).toEqual(['alice']);
    });

    it('should handle multiple mentions in same word context', () => {
      const text = '@alice@bob';
      const mentions = extractMentions(text);
      expect(mentions.length).toBeGreaterThan(0);
    });
  });

  describe('createMentionNotifications', () => {
    it('should create notifications for mentioned users', async () => {
      const mockMentionedUsers = [
        { id: 'user-2', username: 'alice' },
        { id: 'user-3', username: 'bob' },
      ];
      const mockAuthor = { username: 'john' };

      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockMentionedUsers);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockAuthor);
      (prisma.notification.createMany as jest.Mock).mockResolvedValue({});

      await createMentionNotifications(
        'Hey @alice and @bob, check this out!',
        'user-1',
        1,
        undefined
      );

      expect(prisma.notification.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            userId: 'user-2',
            type: 'mention',
            actorId: 'user-1',
            postId: 1,
            commentId: null,
          }),
          expect.objectContaining({
            userId: 'user-3',
            type: 'mention',
            actorId: 'user-1',
            postId: 1,
            commentId: null,
          }),
        ]),
      });
    });

    it('should not create notification for self-mention', async () => {
      const mockMentionedUsers = [
        { id: 'user-1', username: 'john' },
        { id: 'user-2', username: 'alice' },
      ];
      const mockAuthor = { username: 'john' };

      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockMentionedUsers);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockAuthor);
      (prisma.notification.createMany as jest.Mock).mockResolvedValue({});

      await createMentionNotifications(
        'Hey @john and @alice',
        'user-1',
        1,
        undefined
      );

      expect(prisma.notification.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            userId: 'user-2', // Only alice
          }),
        ]),
      });

      const call = (prisma.notification.createMany as jest.Mock).mock.calls[0][0];
      expect(call.data).toHaveLength(1);
    });

    it('should handle comment mentions', async () => {
      const mockMentionedUsers = [{ id: 'user-2', username: 'alice' }];
      const mockAuthor = { username: 'john' };

      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockMentionedUsers);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockAuthor);
      (prisma.notification.createMany as jest.Mock).mockResolvedValue({});

      await createMentionNotifications(
        '@alice check this comment',
        'user-1',
        1,
        5
      );

      expect(prisma.notification.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            postId: 1,
            commentId: 5,
            content: expect.stringContaining('comment'),
          }),
        ]),
      });
    });

    it('should not create notifications if no mentions', async () => {
      await createMentionNotifications(
        'No mentions here',
        'user-1',
        1,
        undefined
      );

      expect(prisma.user.findMany).not.toHaveBeenCalled();
      expect(prisma.notification.createMany).not.toHaveBeenCalled();
    });

    it('should not create notifications if no mentioned users found', async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ username: 'john' });

      await createMentionNotifications(
        '@nonexistent user',
        'user-1',
        1,
        undefined
      );

      expect(prisma.notification.createMany).not.toHaveBeenCalled();
    });

    it('should use "someone" if author not found', async () => {
      const mockMentionedUsers = [{ id: 'user-2', username: 'alice' }];

      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockMentionedUsers);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.notification.createMany as jest.Mock).mockResolvedValue({});

      await createMentionNotifications(
        '@alice test',
        'user-1',
        1,
        undefined
      );

      expect(prisma.notification.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            content: expect.stringContaining('u/someone'),
          }),
        ]),
      });
    });
  });

  describe('formatMentions', () => {
    it('should format mentions as links', () => {
      const text = 'Hey @john, how are you?';
      const formatted = formatMentions(text);
      expect(formatted).toContain('<a href="/u/john" class="mention-link">@john</a>');
    });

    it('should format multiple mentions', () => {
      const text = '@alice and @bob went out';
      const formatted = formatMentions(text);
      expect(formatted).toContain('<a href="/u/alice" class="mention-link">@alice</a>');
      expect(formatted).toContain('<a href="/u/bob" class="mention-link">@bob</a>');
    });

    it('should not format URL-like patterns', () => {
      const text = 'Check @http://example.com';
      const formatted = formatMentions(text);
      expect(formatted).not.toContain('<a');
      expect(formatted).toBe(text);
    });

    it('should preserve original text for non-mentions', () => {
      const text = 'This has no mentions';
      const formatted = formatMentions(text);
      expect(formatted).toBe(text);
    });

    it('should handle mentions with underscores and hyphens', () => {
      const text = 'Hello @user_name and @user-name';
      const formatted = formatMentions(text);
      expect(formatted).toContain('<a href="/u/user_name"');
      expect(formatted).toContain('<a href="/u/user-name"');
    });
  });
});

