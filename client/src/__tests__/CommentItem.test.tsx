import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import CommentItem from '../components/CommentItem';
import { votesApi } from '../services/api';

// Mock the API
jest.mock('../services/api', () => ({
  votesApi: {
    cast: jest.fn(),
    remove: jest.fn(),
  },
}));

// Mock formatMentions - must return an array since the component calls .map() on it
jest.mock('../utils/formatMentions', () => ({
  formatMentions: (text: string) => [text],
}));

const mockComment = {
  id: 1,
  body: 'This is a test comment',
  author: 'testuser',
  authorId: 'user-1',
  postId: 1,
  voteCount: 5,
  createdAt: '2024-01-01T00:00:00Z',
  replies: [],
};

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('CommentItem Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render comment body', () => {
    renderWithRouter(<CommentItem comment={mockComment} />);
    
    expect(screen.getByText('This is a test comment')).toBeInTheDocument();
  });

  it('should render author username', () => {
    renderWithRouter(<CommentItem comment={mockComment} />);
    
    expect(screen.getByText('testuser')).toBeInTheDocument();
  });

  it('should render vote count', () => {
    renderWithRouter(<CommentItem comment={mockComment} />);
    
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should toggle collapse when collapse button is clicked', () => {
    renderWithRouter(<CommentItem comment={mockComment} />);
    
    const collapseBtn = screen.getByText('[−]');
    fireEvent.click(collapseBtn);
    
    expect(screen.getByText('[+]')).toBeInTheDocument();
  });

  it('should show reply form when reply button is clicked', () => {
    renderWithRouter(<CommentItem comment={mockComment} />);
    
    const replyBtn = screen.getByText('Reply');
    fireEvent.click(replyBtn);
    
    expect(screen.getByPlaceholderText('What are your thoughts?')).toBeInTheDocument();
  });

  it('should hide reply form when cancel is clicked', () => {
    renderWithRouter(<CommentItem comment={mockComment} />);
    
    fireEvent.click(screen.getByText('Reply'));
    fireEvent.click(screen.getByText('Cancel'));
    
    expect(screen.queryByPlaceholderText('What are your thoughts?')).not.toBeInTheDocument();
  });

  it('should call onReply with correct data', () => {
    const onReply = jest.fn();
    renderWithRouter(<CommentItem comment={mockComment} onReply={onReply} />);
    
    fireEvent.click(screen.getByText('Reply'));
    
    const textarea = screen.getByPlaceholderText('What are your thoughts?');
    fireEvent.change(textarea, { target: { value: 'My reply' } });
    
    fireEvent.click(screen.getByText('Comment'));
    
    expect(onReply).toHaveBeenCalledWith(1, 'My reply');
  });

  it('should handle upvote', async () => {
    (votesApi.cast as jest.Mock).mockResolvedValue({});
    
    renderWithRouter(<CommentItem comment={mockComment} />);
    
    const upvoteBtn = screen.getByLabelText('Upvote');
    fireEvent.click(upvoteBtn);
    
    await waitFor(() => {
      expect(votesApi.cast).toHaveBeenCalledWith({
        target_type: 'comment',
        target_id: 1,
        value: 1,
      });
    });
  });

  it('should handle downvote', async () => {
    (votesApi.cast as jest.Mock).mockResolvedValue({});
    
    renderWithRouter(<CommentItem comment={mockComment} />);
    
    const downvoteBtn = screen.getByLabelText('Downvote');
    fireEvent.click(downvoteBtn);
    
    await waitFor(() => {
      expect(votesApi.cast).toHaveBeenCalledWith({
        target_type: 'comment',
        target_id: 1,
        value: -1,
      });
    });
  });

  it('should render nested replies', () => {
    const commentWithReplies = {
      ...mockComment,
      replies: [
        {
          ...mockComment,
          id: 2,
          body: 'This is a reply',
          author: 'replier',
        },
      ],
    };
    
    renderWithRouter(<CommentItem comment={commentWithReplies} />);
    
    expect(screen.getByText('This is a reply')).toBeInTheDocument();
    expect(screen.getByText('replier')).toBeInTheDocument();
  });

  it('should respect maxDepth for nested comments', () => {
    const deeplyNestedComment = {
      ...mockComment,
      replies: [
        {
          ...mockComment,
          id: 2,
          body: 'Level 1 reply',
          replies: [
            {
              ...mockComment,
              id: 3,
              body: 'Level 2 reply',
              replies: [
                {
                  ...mockComment,
                  id: 4,
                  body: 'Level 3 reply (too deep)',
                },
              ],
            },
          ],
        },
      ],
    };
    
    renderWithRouter(<CommentItem comment={deeplyNestedComment} maxDepth={2} />);
    
    expect(screen.getByText('Level 1 reply')).toBeInTheDocument();
    expect(screen.getByText('Level 2 reply')).toBeInTheDocument();
    expect(screen.queryByText('Level 3 reply (too deep)')).not.toBeInTheDocument();
  });

  it('should show continue thread link when exceeding maxDepth', () => {
    const deepComment = {
      ...mockComment,
      replies: [
        {
          ...mockComment,
          id: 2,
          body: 'Deep reply',
        },
      ],
    };
    
    renderWithRouter(<CommentItem comment={deepComment} depth={3} maxDepth={3} />);
    
    expect(screen.getByRole('button', { name: /Continue this thread/ })).toBeInTheDocument();
  });

  it('should format relative time correctly', () => {
    const recentComment = {
      ...mockComment,
      createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    };
    
    renderWithRouter(<CommentItem comment={recentComment} />);
    
    // Should show relative time (exact text may vary)
    const timeElement = screen.getByText(/ago/);
    expect(timeElement).toBeInTheDocument();
  });
});

