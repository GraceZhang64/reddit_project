import { AIService } from '../services/aiService';
import OpenAI from 'openai';

// Mock OpenAI
jest.mock('openai');

describe('AIService', () => {
  let aiService: AIService;
  let mockCreate: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock the OpenAI chat completions create method
    mockCreate = jest.fn();
    (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    } as any));

    process.env.OPENAI_API_KEY = 'test-api-key';
    aiService = new AIService();
  });

  describe('constructor', () => {
    it('should throw error if OPENAI_API_KEY is not set', () => {
      delete process.env.OPENAI_API_KEY;
      expect(() => new AIService()).toThrow('OPENAI_API_KEY is not set');
    });

    it('should initialize with API key', () => {
      process.env.OPENAI_API_KEY = 'test-key';
      expect(() => new AIService()).not.toThrow();
    });
  });

  describe('generatePostSummary', () => {
    it('should generate summary for post with comments', async () => {
      const postData = {
        title: 'Test Post',
        body: 'This is a test post body',
        voteCount: 100,
        comments: [
          {
            body: 'Great post!',
            author: 'user1',
            voteCount: 50,
            createdAt: new Date(),
          },
          {
            body: 'I disagree',
            author: 'user2',
            voteCount: 10,
            createdAt: new Date(),
          },
        ],
      };

      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: 'This is a summary of the post and comments.',
            },
          },
        ],
      });

      const summary = await aiService.generatePostSummary(postData);

      expect(summary).toBe('This is a summary of the post and comments.');
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4o-mini',
          temperature: 0.7,
          max_tokens: 300,
        })
      );
    });

    it('should sort comments by vote count', async () => {
      const postData = {
        title: 'Test Post',
        body: 'Test body',
        voteCount: 10,
        comments: [
          {
            body: 'Low votes',
            author: 'user1',
            voteCount: 5,
            createdAt: new Date(),
          },
          {
            body: 'High votes',
            author: 'user2',
            voteCount: 100,
            createdAt: new Date(),
          },
          {
            body: 'Medium votes',
            author: 'user3',
            voteCount: 50,
            createdAt: new Date(),
          },
        ],
      };

      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'Summary' } }],
      });

      await aiService.generatePostSummary(postData);

      const callArgs = mockCreate.mock.calls[0][0];
      const prompt = callArgs.messages[1].content;

      // Check that high-voted comment appears before low-voted
      const highVoteIndex = prompt.indexOf('High votes');
      const lowVoteIndex = prompt.indexOf('Low votes');
      expect(highVoteIndex).toBeLessThan(lowVoteIndex);
    });

    it('should limit to top 10 comments', async () => {
      const comments = Array.from({ length: 15 }, (_, i) => ({
        body: `Comment ${i}`,
        author: `user${i}`,
        voteCount: 15 - i, // Descending vote counts
        createdAt: new Date(),
      }));

      const postData = {
        title: 'Test Post',
        body: 'Test body',
        voteCount: 10,
        comments,
      };

      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'Summary' } }],
      });

      await aiService.generatePostSummary(postData);

      const callArgs = mockCreate.mock.calls[0][0];
      const prompt = callArgs.messages[1].content;

      // Should include Comment 1 through Comment 10 (top 10 headers)
      expect(prompt).toContain('Comment 1 (15 votes)');
      expect(prompt).toContain('Comment 10 (6 votes)');
      // Count comment headers (should be exactly 10)
      const commentMatches = prompt.match(/Comment \d+ \(\d+ votes\)/g);
      expect(commentMatches).toHaveLength(10);
    });

    it('should handle post without body', async () => {
      const postData = {
        title: 'Test Post',
        body: '',
        voteCount: 10,
        comments: [],
      };

      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'Summary' } }],
      });

      const summary = await aiService.generatePostSummary(postData);

      expect(summary).toBe('Summary');
      const callArgs = mockCreate.mock.calls[0][0];
      const prompt = callArgs.messages[1].content;
      expect(prompt).toContain('POST TITLE:');
    });

    it('should handle post without comments', async () => {
      const postData = {
        title: 'Test Post',
        body: 'Test body',
        voteCount: 10,
        comments: [],
      };

      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'Summary' } }],
      });

      await aiService.generatePostSummary(postData);

      const callArgs = mockCreate.mock.calls[0][0];
      const prompt = callArgs.messages[1].content;
      expect(prompt).toContain('No comments yet');
    });

    it('should return default message if API returns empty content', async () => {
      const postData = {
        title: 'Test Post',
        body: 'Test body',
        voteCount: 10,
        comments: [],
      };

      mockCreate.mockResolvedValue({
        choices: [{ message: { content: '' } }],
      });

      const summary = await aiService.generatePostSummary(postData);

      expect(summary).toBe('Unable to generate summary');
    });

    it('should throw error if API call fails', async () => {
      const postData = {
        title: 'Test Post',
        body: 'Test body',
        voteCount: 10,
        comments: [],
      };

      mockCreate.mockRejectedValue(new Error('API Error'));

      await expect(aiService.generatePostSummary(postData)).rejects.toThrow(
        'Failed to generate AI summary'
      );
    });

    it('should include vote context in prompt', async () => {
      const postData = {
        title: 'Test Post',
        body: 'Test body',
        voteCount: 50,
        comments: [
          {
            body: 'Comment with votes',
            author: 'user1',
            voteCount: 25,
            createdAt: new Date(),
          },
        ],
      };

      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'Summary' } }],
      });

      await aiService.generatePostSummary(postData);

      const callArgs = mockCreate.mock.calls[0][0];
      const prompt = callArgs.messages[1].content;
      
      expect(prompt).toContain('50');
      expect(prompt).toContain('25 votes');
      expect(prompt).toContain('positive reception');
    });

    it('should handle negative vote counts', async () => {
      const postData = {
        title: 'Test Post',
        body: 'Test body',
        voteCount: -10,
        comments: [],
      };

      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'Summary' } }],
      });

      await aiService.generatePostSummary(postData);

      const callArgs = mockCreate.mock.calls[0][0];
      const prompt = callArgs.messages[1].content;
      
      expect(prompt).toContain('negative reception');
    });
  });
});