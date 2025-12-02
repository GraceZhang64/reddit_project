import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import CommunityPage from '../pages/CommunityPage';
import { communitiesApi, postsApi } from '../services/api';

// Mock the API
jest.mock('../services/api', () => ({
  communitiesApi: {
    getBySlug: jest.fn(),
    getPosts: jest.fn(),
    getAll: jest.fn(),
  },
  postsApi: {
    create: jest.fn(),
  },
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock window.dispatchEvent
global.dispatchEvent = jest.fn();

const mockCommunity = {
  id: 1,
  name: 'testcommunity',
  slug: 'testcommunity',
  description: 'A test community',
  memberCount: 42,
  createdAt: '2024-01-01T00:00:00Z',
};

const mockPosts = [
  {
    id: 1,
    title: 'Test Post',
    body: 'Test content',
    author: 'testuser',
    communityName: 'testcommunity',
    voteCount: 10,
    commentCount: 5,
    createdAt: '2024-01-01T00:00:00Z',
  },
];

const renderWithRouter = (ui: React.ReactElement, { route = '/r/testcommunity' } = {}) => {
  window.history.pushState({}, 'Test page', route);
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('CommunityPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockClear();

    // Mock successful API calls
    (communitiesApi.getBySlug as jest.Mock).mockResolvedValue(mockCommunity);
    (communitiesApi.getPosts as jest.Mock).mockResolvedValue({
      posts: mockPosts,
      pagination: { page: 1, limit: 50, total: 1, totalPages: 1 }
    });
    (communitiesApi.getAll as jest.Mock).mockResolvedValue({
      communities: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
    });
  });

  it('should render community details and posts', async () => {
    renderWithRouter(<CommunityPage />);

    await waitFor(() => {
      expect(screen.getByText('r/testcommunity')).toBeInTheDocument();
      expect(screen.getByText('A test community')).toBeInTheDocument();
      expect(screen.getByText('42 members')).toBeInTheDocument();
    });

    expect(communitiesApi.getBySlug).toHaveBeenCalledWith('testcommunity');
    expect(communitiesApi.getPosts).toHaveBeenCalledWith('testcommunity', 1, 50);
  });

  it('should handle join/leave functionality', async () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify(['othercommunity']));

    renderWithRouter(<CommunityPage />);

    await waitFor(() => {
      expect(screen.getByText('Join')).toBeInTheDocument();
    });

    // Click join button
    const joinButton = screen.getByText('Join');
    fireEvent.click(joinButton);

    // Should now show "✓ Joined"
    await waitFor(() => {
      expect(screen.getByText('✓ Joined')).toBeInTheDocument();
    });

    // Check localStorage was updated
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'joinedCommunities',
      JSON.stringify(['othercommunity', 'testcommunity'])
    );

    // Click leave
    const leaveButton = screen.getByText('✓ Joined');
    fireEvent.click(leaveButton);

    await waitFor(() => {
      expect(screen.getByText('Join')).toBeInTheDocument();
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'joinedCommunities',
      JSON.stringify(['othercommunity'])
    );
  });

  it('should show loading state initially', () => {
    renderWithRouter(<CommunityPage />);

    expect(screen.getByText('Loading community...')).toBeInTheDocument();
  });

  it('should handle API errors', async () => {
    (communitiesApi.getBySlug as jest.Mock).mockRejectedValue(new Error('API Error'));

    renderWithRouter(<CommunityPage />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load community. Please try again.')).toBeInTheDocument();
    });

    // Test retry functionality
    const retryButton = screen.getByText('Retry');
    fireEvent.click(retryButton);

    expect(communitiesApi.getBySlug).toHaveBeenCalledTimes(2);
  });

  it('should handle post creation', async () => {
    (postsApi.create as jest.Mock).mockResolvedValue({ id: 2 });

    renderWithRouter(<CommunityPage />);

    await waitFor(() => {
      expect(screen.getByText('+ Create Post')).toBeInTheDocument();
    });

    // Click create post button
    const createButton = screen.getByText('+ Create Post');
    fireEvent.click(createButton);

    // Should show create form
    expect(screen.getByText('Create Post')).toBeInTheDocument();

    // Fill form and submit would require more complex mocking
    // This tests that the button opens the form
  });

  it('should display post information correctly', async () => {
    renderWithRouter(<CommunityPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Post')).toBeInTheDocument();
      expect(screen.getByText('Test content')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument(); // vote count
      expect(screen.getByText('5')).toBeInTheDocument(); // comment count
    });
  });

  it('should show sidebar with community stats', async () => {
    renderWithRouter(<CommunityPage />);

    await waitFor(() => {
      expect(screen.getByText('About Community')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument(); // Members
      expect(screen.getByText('1')).toBeInTheDocument(); // Posts count
    });
  });

  it('should handle sort changes', async () => {
    renderWithRouter(<CommunityPage />);

    await waitFor(() => {
      expect(screen.getByText('Posts')).toBeInTheDocument();
    });

    // Sort functionality is handled by PostSortFilter component
    // This tests that the component renders correctly
    expect(screen.getByText('Test Post')).toBeInTheDocument();
  });
});
