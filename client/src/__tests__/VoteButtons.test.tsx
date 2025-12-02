import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import VoteButtons from '../components/VoteButtons';

describe('VoteButtons Component', () => {
  it('should render with vote count', () => {
    render(<VoteButtons voteCount={42} />);
    
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByLabelText('Upvote')).toBeInTheDocument();
    expect(screen.getByLabelText('Downvote')).toBeInTheDocument();
  });

  it('should call onVote with 1 when upvote is clicked', () => {
    const onVote = jest.fn();
    render(<VoteButtons voteCount={10} onVote={onVote} />);
    
    fireEvent.click(screen.getByLabelText('Upvote'));
    
    expect(onVote).toHaveBeenCalledWith(1);
  });

  it('should call onVote with -1 when downvote is clicked', () => {
    const onVote = jest.fn();
    render(<VoteButtons voteCount={10} onVote={onVote} />);
    
    fireEvent.click(screen.getByLabelText('Downvote'));
    
    expect(onVote).toHaveBeenCalledWith(-1);
  });

  it('should call onUpvote when provided instead of onVote', () => {
    const onUpvote = jest.fn();
    render(<VoteButtons voteCount={10} onUpvote={onUpvote} />);
    
    fireEvent.click(screen.getByLabelText('Upvote'));
    
    expect(onUpvote).toHaveBeenCalled();
  });

  it('should call onDownvote when provided instead of onVote', () => {
    const onDownvote = jest.fn();
    render(<VoteButtons voteCount={10} onDownvote={onDownvote} />);
    
    fireEvent.click(screen.getByLabelText('Downvote'));
    
    expect(onDownvote).toHaveBeenCalled();
  });

  it('should show active state for upvote when userVote is 1', () => {
    render(<VoteButtons voteCount={10} userVote={1} />);
    
    const upvoteBtn = screen.getByLabelText('Upvote');
    expect(upvoteBtn).toHaveClass('active');
  });

  it('should show active state for downvote when userVote is -1', () => {
    render(<VoteButtons voteCount={10} userVote={-1} />);
    
    const downvoteBtn = screen.getByLabelText('Downvote');
    expect(downvoteBtn).toHaveClass('active');
  });

  it('should apply upvoted class to vote count when userVote is 1', () => {
    const { container } = render(<VoteButtons voteCount={10} userVote={1} />);
    
    const voteCount = container.querySelector('.vote-count');
    expect(voteCount).toHaveClass('upvoted');
  });

  it('should apply downvoted class to vote count when userVote is -1', () => {
    const { container } = render(<VoteButtons voteCount={10} userVote={-1} />);
    
    const voteCount = container.querySelector('.vote-count');
    expect(voteCount).toHaveClass('downvoted');
  });

  it('should render small size variant', () => {
    const { container } = render(<VoteButtons voteCount={10} size="small" />);
    
    const voteButtons = container.querySelector('.vote-buttons');
    expect(voteButtons).toHaveClass('vote-buttons-small');
  });

  it('should handle zero vote count', () => {
    render(<VoteButtons voteCount={0} />);
    
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('should handle negative vote count', () => {
    render(<VoteButtons voteCount={-5} />);
    
    expect(screen.getByText('-5')).toBeInTheDocument();
  });

  it('should handle large vote count', () => {
    render(<VoteButtons voteCount={999999} />);
    
    expect(screen.getByText('999999')).toBeInTheDocument();
  });
});

