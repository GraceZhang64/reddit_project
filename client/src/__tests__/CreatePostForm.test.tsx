import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import CreatePostForm from '../components/CreatePostForm';
import { Community } from '../types';

const mockCommunities: Community[] = [
  {
    id: 1,
    name: 'testcommunity',
    slug: 'testcommunity',
    description: 'Test community',
    memberCount: 10,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'anothercommunity',
    slug: 'anothercommunity',
    description: 'Another test community',
    memberCount: 20,
    createdAt: '2024-01-02T00:00:00Z',
  },
];

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('CreatePostForm Component', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render form with all fields', () => {
    renderWithRouter(
      <CreatePostForm
        communities={mockCommunities}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByLabelText('Title')).toBeInTheDocument();
    expect(screen.getByLabelText('Choose a community')).toBeInTheDocument();
    expect(screen.getByText('📝 Text')).toBeInTheDocument();
    expect(screen.getByText('🔗 Link')).toBeInTheDocument();
    expect(screen.getByText('📊 Poll')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Post' })).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('should show text content field for text posts by default', () => {
    renderWithRouter(
      <CreatePostForm
        communities={mockCommunities}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByLabelText('Body (optional)')).toBeInTheDocument();
  });

  it('should show link field when link tab is selected', () => {
    renderWithRouter(
      <CreatePostForm
        communities={mockCommunities}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const linkTab = screen.getByText('🔗 Link');
    fireEvent.click(linkTab);

    expect(screen.getByLabelText('URL *')).toBeInTheDocument();
    expect(screen.getByLabelText('Description (optional)')).toBeInTheDocument();
  });

  it('should show poll options when poll tab is selected', () => {
    renderWithRouter(
      <CreatePostForm
        communities={mockCommunities}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const pollTab = screen.getByText('📊 Poll');
    fireEvent.click(pollTab);

    expect(screen.getByPlaceholderText('Option 1')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Option 2')).toBeInTheDocument();
    expect(screen.getByText('+ Add Option')).toBeInTheDocument();
  });

  it('should populate community dropdown', () => {
    renderWithRouter(
      <CreatePostForm
        communities={mockCommunities}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const select = screen.getByLabelText('Choose a community');
    expect(select).toBeInTheDocument();

    // Should have options for each community (with c/ prefix)
    expect(screen.getByText(/testcommunity/)).toBeInTheDocument();
    expect(screen.getByText(/anothercommunity/)).toBeInTheDocument();
  });

  it('should hide community selector when defaultCommunityId is provided', () => {
    renderWithRouter(
      <CreatePostForm
        communities={mockCommunities}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        defaultCommunityId={1}
      />
    );

    expect(screen.queryByLabelText('Choose a community')).not.toBeInTheDocument();
  });

  it('should submit valid text post', async () => {
    renderWithRouter(
      <CreatePostForm
        communities={mockCommunities}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Fill form
    const titleInput = screen.getByLabelText('Title');
    const bodyTextarea = screen.getByLabelText('Body (optional)');
    const communitySelect = screen.getByLabelText('Choose a community');

    fireEvent.change(titleInput, { target: { value: 'Test Post Title' } });
    fireEvent.change(bodyTextarea, { target: { value: 'Test post content' } });
    fireEvent.change(communitySelect, { target: { value: '1' } });

    // Submit
    const submitButton = screen.getByRole('button', { name: 'Post' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        title: 'Test Post Title',
        body: 'Test post content',
        community_id: 1,
        post_type: 'text',
      });
    });
  });

  it('should submit valid link post', async () => {
    renderWithRouter(
      <CreatePostForm
        communities={mockCommunities}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Select link type
    const linkTab = screen.getByText('🔗 Link');
    fireEvent.click(linkTab);

    // Fill form
    const titleInput = screen.getByLabelText('Title');
    const urlInput = screen.getByLabelText('URL *');
    const communitySelect = screen.getByLabelText('Choose a community');

    fireEvent.change(titleInput, { target: { value: 'Test Link Post' } });
    fireEvent.change(urlInput, { target: { value: 'https://example.com' } });
    fireEvent.change(communitySelect, { target: { value: '2' } });

    // Submit
    const submitButton = screen.getByRole('button', { name: 'Post' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Test Link Post',
        link_url: 'https://example.com',
        community_id: 2,
        post_type: 'link',
      }));
    });
  });

  it('should call onCancel when cancel button is clicked', () => {
    renderWithRouter(
      <CreatePostForm
        communities={mockCommunities}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should disable submit button when title is empty', () => {
    renderWithRouter(
      <CreatePostForm
        communities={mockCommunities}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const submitButton = screen.getByRole('button', { name: 'Post' });
    expect(submitButton).toBeDisabled();
  });

  it('should enable submit button when title is filled', () => {
    renderWithRouter(
      <CreatePostForm
        communities={mockCommunities}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const titleInput = screen.getByLabelText('Title');
    fireEvent.change(titleInput, { target: { value: 'Test Title' } });

    const submitButton = screen.getByRole('button', { name: 'Post' });
    expect(submitButton).not.toBeDisabled();
  });

  it('should add poll options', () => {
    renderWithRouter(
      <CreatePostForm
        communities={mockCommunities}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const pollTab = screen.getByText('📊 Poll');
    fireEvent.click(pollTab);

    // Start with 2 options
    expect(screen.getByPlaceholderText('Option 1')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Option 2')).toBeInTheDocument();

    // Add option
    const addButton = screen.getByText('+ Add Option');
    fireEvent.click(addButton);

    expect(screen.getByPlaceholderText('Option 3')).toBeInTheDocument();
  });

  it('should show character count for title', () => {
    renderWithRouter(
      <CreatePostForm
        communities={mockCommunities}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('0/300 characters')).toBeInTheDocument();

    const titleInput = screen.getByLabelText('Title');
    fireEvent.change(titleInput, { target: { value: 'Test' } });

    expect(screen.getByText('4/300 characters')).toBeInTheDocument();
  });

  it('should show markdown preview toggle for text posts', () => {
    renderWithRouter(
      <CreatePostForm
        communities={mockCommunities}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('👁️ Preview')).toBeInTheDocument();
  });

  it('should toggle between edit and preview mode', () => {
    renderWithRouter(
      <CreatePostForm
        communities={mockCommunities}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Initial state - edit mode
    expect(screen.getByLabelText('Body (optional)')).toBeInTheDocument();

    // Click preview
    const previewButton = screen.getByText('👁️ Preview');
    fireEvent.click(previewButton);

    // Should show preview content
    expect(screen.getByText('Markdown Preview')).toBeInTheDocument();
    expect(screen.getByText('✏️ Edit')).toBeInTheDocument();

    // Click edit
    const editButton = screen.getByText('✏️ Edit');
    fireEvent.click(editButton);

    // Back to edit mode
    expect(screen.getByLabelText('Body (optional)')).toBeInTheDocument();
  });

  it('should reset form after submission', async () => {
    renderWithRouter(
      <CreatePostForm
        communities={mockCommunities}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Fill form
    const titleInput = screen.getByLabelText('Title');
    fireEvent.change(titleInput, { target: { value: 'Test Post Title' } });

    // Submit
    const submitButton = screen.getByRole('button', { name: 'Post' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });

    // Form should be reset
    expect(titleInput).toHaveValue('');
  });
});
