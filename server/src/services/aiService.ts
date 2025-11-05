import OpenAI from 'openai';

interface PostData {
  title: string;
  body: string;
  voteCount: number;
  comments: CommentData[];
}

interface CommentData {
  body: string;
  author: string;
  voteCount: number;
  createdAt: Date;
}

export class AIService {
  private openai: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not set in environment variables');
    }
    this.openai = new OpenAI({ apiKey });
  }

  /**
   * Generate AI summary for a post and its comments
   * Emphasizes highly upvoted content
   */
  async generatePostSummary(postData: PostData): Promise<string> {
    try {
      // Sort comments by vote count (highest first)
      const sortedComments = [...postData.comments].sort(
        (a, b) => b.voteCount - a.voteCount
      );

      // Take top 10 comments or all if fewer
      const topComments = sortedComments.slice(0, 10);

      // Build the prompt
      const prompt = this.buildPrompt(postData, topComments);

      // Call OpenAI API
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini', // Cost-effective model
        messages: [
          {
            role: 'system',
            content:
              'You are a helpful assistant that summarizes Reddit-style posts and discussions. Focus on the most upvoted content as it represents community consensus.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 300,
      });

      return response.choices[0].message.content || 'Unable to generate summary';
    } catch (error) {
      console.error('Error generating AI summary:', error);
      throw new Error('Failed to generate AI summary');
    }
  }

  /**
   * Build the prompt for the LLM
   */
  private buildPrompt(postData: PostData, topComments: CommentData[]): string {
    let prompt = `Summarize this post and conversation. Put emphasis on more upvotes. Give me the main points.\n\n`;
    
    prompt += `POST TITLE: ${postData.title}\n`;
    prompt += `POST VOTES: ${postData.voteCount} (${postData.voteCount > 0 ? 'positive' : 'negative'} reception)\n\n`;
    
    if (postData.body) {
      prompt += `POST CONTENT:\n${postData.body}\n\n`;
    }

    if (topComments.length > 0) {
      prompt += `TOP COMMENTS (sorted by upvotes):\n\n`;
      topComments.forEach((comment, index) => {
        prompt += `Comment ${index + 1} (${comment.voteCount} votes) by ${comment.author}:\n`;
        prompt += `${comment.body}\n\n`;
      });
    } else {
      prompt += `No comments yet.\n\n`;
    }

    prompt += `Please provide a concise summary highlighting:
1. Main topic and key points from the post
2. Most upvoted opinions and perspectives from comments
3. Any consensus or popular viewpoints
4. Important disagreements or alternative views (if highly upvoted)`;

    return prompt;
  }
}

// Singleton instance
let aiServiceInstance: AIService | null = null;

export function getAIService(): AIService {
  if (!aiServiceInstance) {
    aiServiceInstance = new AIService();
  }
  return aiServiceInstance;
}
