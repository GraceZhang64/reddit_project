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
    expect(screen.getByLabelText('Community')).toBeInTheDocument();
    expect(screen.getByLabelText('Post Type')).toBeInTheDocument();
    expect(screen.getByText('Text')).toBeInTheDocument();
    expect(screen.getByText('Link')).toBeInTheDocument();
    expect(screen.getByText('Create Post')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('should show text content field for text posts', () => {
    renderWithRouter(
      <CreatePostForm
        communities={mockCommunities}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByLabelText('Content')).toBeInTheDocument();
  });

  it('should show link field for link posts', () => {
    renderWithRouter(
      <CreatePostForm
        communities={mockCommunities}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const linkRadio = screen.getByLabelText('Link');
    fireEvent.click(linkRadio);

    expect(screen.getByLabelText('URL')).toBeInTheDocument();
    expect(screen.queryByLabelText('Content')).not.toBeInTheDocument();
  });

  it('should populate community dropdown', () => {
    renderWithRouter(
      <CreatePostForm
        communities={mockCommunities}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const select = screen.getByLabelText('Community');
    expect(select).toBeInTheDocument();

    // Should have options for each community
    expect(screen.getByText('testcommunity')).toBeInTheDocument();
    expect(screen.getByText('anothercommunity')).toBeInTheDocument();
  });

  it('should use default community when provided', () => {
    renderWithRouter(
      <CreatePostForm
        communities={mockCommunities}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        defaultCommunityId={1}
      />
    );

    const select = screen.getByLabelText('Community') as HTMLSelectElement;
    expect(select.value).toBe('1'); // Should be set to community with id 1
  });

  it('should validate required fields', async () => {
    renderWithRouter(
      <CreatePostForm
        communities={mockCommunities}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const submitButton = screen.getByText('Create Post');
    fireEvent.click(submitButton);

    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument();
      expect(screen.getByText('Community is required')).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should validate link posts require URL', async () => {
    renderWithRouter(
      <CreatePostForm
        communities={mockCommunities}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Select link post type
    const linkRadio = screen.getByLabelText('Link');
    fireEvent.click(linkRadio);

    // Fill title and community
    const titleInput = screen.getByLabelText('Title');
    const communitySelect = screen.getByLabelText('Community');

    fireEvent.change(titleInput, { target: { value: 'Test Title' } });
    fireEvent.change(communitySelect, { target: { value: '1' } });

    // Submit without URL
    const submitButton = screen.getByText('Create Post');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('URL is required for link posts')).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
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
    const contentTextarea = screen.getByLabelText('Content');
    const communitySelect = screen.getByLabelText('Community');

    fireEvent.change(titleInput, { target: { value: 'Test Post Title' } });
    fireEvent.change(contentTextarea, { target: { value: 'Test post content' } });
    fireEvent.change(communitySelect, { target: { value: '1' } });

    // Submit
    const submitButton = screen.getByText('Create Post');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        title: 'Test Post Title',
        body: 'Test post content',
        communityId: 1,
        postType: 'text',
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
    const linkRadio = screen.getByLabelText('Link');
    fireEvent.click(linkRadio);

    // Fill form
    const titleInput = screen.getByLabelText('Title');
    const urlInput = screen.getByLabelText('URL');
    const communitySelect = screen.getByLabelText('Community');

    fireEvent.change(titleInput, { target: { value: 'Test Link Post' } });
    fireEvent.change(urlInput, { target: { value: 'https://example.com' } });
    fireEvent.change(communitySelect, { target: { value: '2' } });

    // Submit
    const submitButton = screen.getByText('Create Post');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        title: 'Test Link Post',
        linkUrl: 'https://example.com',
        communityId: 2,
        postType: 'link',
      });
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

  it('should validate URL format', async () => {
    renderWithRouter(
      <CreatePostForm
        communities={mockCommunities}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Select link type
    const linkRadio = screen.getByLabelText('Link');
    fireEvent.click(linkRadio);

    // Fill with invalid URL
    const titleInput = screen.getByLabelText('Title');
    const urlInput = screen.getByLabelText('URL');
    const communitySelect = screen.getByLabelText('Community');

    fireEvent.change(titleInput, { target: { value: 'Test Title' } });
    fireEvent.change(urlInput, { target: { value: 'invalid-url' } });
    fireEvent.change(communitySelect, { target: { value: '1' } });

    const submitButton = screen.getByText('Create Post');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid URL')).toBeInTheDocument();
    });
  });
});
