import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PostCard from '../components/PostCard';
import { Post } from '../types';

const mockPost: Post = {
  id: 1,
  slug: 'test-post',
  title: 'Test Post Title',
  body: 'Test post body content',
  author: 'testuser',
  communityId: 1,
  communityName: 'TestCommunity',
  communitySlug: 'testcommunity',
  voteCount: 42,
  commentCount: 5,
  createdAt: new Date().toISOString(),
};

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('PostCard', () => {
  const mockOnVote = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render post title', () => {
    renderWithRouter(<PostCard post={mockPost} userVote={0} onVote={mockOnVote} />);
    expect(screen.getByText('Test Post Title')).toBeInTheDocument();
  });

  it('should render post author', () => {
    renderWithRouter(<PostCard post={mockPost} userVote={0} onVote={mockOnVote} />);
    expect(screen.getByText(/testuser/i)).toBeInTheDocument();
  });

  it('should render community name', () => {
    renderWithRouter(<PostCard post={mockPost} userVote={0} onVote={mockOnVote} />);
    expect(screen.getByText(/TestCommunity/i)).toBeInTheDocument();
  });

  it('should display vote count', () => {
    renderWithRouter(<PostCard post={mockPost} userVote={0} onVote={mockOnVote} />);
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('should display comment count', () => {
    renderWithRouter(<PostCard post={mockPost} userVote={0} onVote={mockOnVote} />);
    expect(screen.getByText(/5.*comment/i)).toBeInTheDocument();
  });

  it('should call onVote when upvote button clicked', () => {
    renderWithRouter(<PostCard post={mockPost} userVote={0} onVote={mockOnVote} />);
    const upvoteButton = screen.getAllByRole('button')[0];
    fireEvent.click(upvoteButton);
    expect(mockOnVote).toHaveBeenCalledWith(mockPost.id, 1);
  });

  it('should call onVote when downvote button clicked', () => {
    renderWithRouter(<PostCard post={mockPost} userVote={0} onVote={mockOnVote} />);
    const downvoteButton = screen.getAllByRole('button')[1];
    fireEvent.click(downvoteButton);
    expect(mockOnVote).toHaveBeenCalledWith(mockPost.id, -1);
  });

  it('should link to post using slug', () => {
    renderWithRouter(<PostCard post={mockPost} userVote={0} onVote={mockOnVote} />);
    const link = screen.getByRole('link', { name: /Test Post Title/i });
    expect(link).toHaveAttribute('href', '/p/test-post');
  });

  it('should fallback to ID if no slug', () => {
    const postWithoutSlug = { ...mockPost, slug: undefined };
    renderWithRouter(<PostCard post={postWithoutSlug} userVote={0} onVote={mockOnVote} />);
    const link = screen.getByRole('link', { name: /Test Post Title/i });
    expect(link).toHaveAttribute('href', '/p/1');
  });

  it('should highlight upvote when user upvoted', () => {
    renderWithRouter(<PostCard post={mockPost} userVote={1} onVote={mockOnVote} />);
    const upvoteButton = screen.getAllByRole('button')[0];
    expect(upvoteButton).toHaveClass('active'); // Adjust based on your CSS class
  });

  it('should highlight downvote when user downvoted', () => {
    renderWithRouter(<PostCard post={mockPost} userVote={-1} onVote={mockOnVote} />);
    const downvoteButton = screen.getAllByRole('button')[1];
    expect(downvoteButton).toHaveClass('active');
  });
});

