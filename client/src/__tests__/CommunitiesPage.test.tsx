import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import CommunitiesPage from '../pages/CommunitiesPage';
import { communitiesApi } from '../services/api';

// Mock the API
jest.mock('../services/api', () => ({
  communitiesApi: {
    getAll: jest.fn(),
    search: jest.fn(),
    create: jest.fn(),
  },
}));

const mockCommunities = [
  {
    id: 1,
    name: 'fitness',
    slug: 'fitness',
    description: 'Fitness community',
    memberCount: 23,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'javascript',
    slug: 'javascript',
    description: 'JavaScript programming',
    memberCount: 21,
    createdAt: '2024-01-02T00:00:00Z',
  },
];

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('CommunitiesPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock successful API call
    (communitiesApi.getAll as jest.Mock).mockResolvedValue({
      communities: mockCommunities,
      pagination: { page: 1, limit: 20, total: 2, totalPages: 1 }
    });
  });

  it('should render communities list', async () => {
    renderWithRouter(<CommunitiesPage />);

    await waitFor(() => {
      expect(screen.getByText('fitness')).toBeInTheDocument();
      expect(screen.getByText('javascript')).toBeInTheDocument();
    });

    expect(communitiesApi.getAll).toHaveBeenCalledWith(1, 1000);
  });

  it('should display member counts correctly', async () => {
    renderWithRouter(<CommunitiesPage />);

    await waitFor(() => {
      expect(screen.getByText('23 members')).toBeInTheDocument();
      expect(screen.getByText('21 members')).toBeInTheDocument();
    });
  });

  it('should handle search functionality', async () => {
    (communitiesApi.search as jest.Mock).mockResolvedValue({
      communities: [mockCommunities[0]], // Only fitness matches
      pagination: { page: 1, limit: 50, total: 1, totalPages: 1 }
    });

    renderWithRouter(<CommunitiesPage />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('fitness')).toBeInTheDocument();
    });

    // Find and use search input
    const searchInput = screen.getByPlaceholderText('Search communities...');
    fireEvent.change(searchInput, { target: { value: 'fitness' } });

    // Wait for search results
    await waitFor(() => {
      expect(communitiesApi.search).toHaveBeenCalledWith('fitness', 1, 100);
    });

    expect(screen.getByText('fitness')).toBeInTheDocument();
    expect(screen.queryByText('javascript')).not.toBeInTheDocument();
  });

  it('should clear search and reload all communities', async () => {
    (communitiesApi.search as jest.Mock).mockResolvedValue({
      communities: [mockCommunities[0]],
      pagination: { page: 1, limit: 50, total: 1, totalPages: 1 }
    });

    renderWithRouter(<CommunitiesPage />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getAllByText('fitness')).toBeTruthy();
    });

    // Search for something
    const searchInput = screen.getByPlaceholderText('Search communities...');
    fireEvent.change(searchInput, { target: { value: 'fitness' } });

    await waitFor(() => {
      expect(communitiesApi.search).toHaveBeenCalledWith('fitness', 1, 100);
    });

    // Clear search
    fireEvent.change(searchInput, { target: { value: '' } });

    await waitFor(() => {
      expect(communitiesApi.getAll).toHaveBeenCalledTimes(2); // Initial + reload
    });
  });

  it('should handle community creation', async () => {
    (communitiesApi.create as jest.Mock).mockResolvedValue({
      id: 3,
      name: 'newcommunity',
      slug: 'newcommunity',
      description: 'New community',
      memberCount: 1,
      createdAt: '2024-01-03T00:00:00Z',
    });

    renderWithRouter(<CommunitiesPage />);

    await waitFor(() => {
      expect(screen.getByText('Create Community')).toBeInTheDocument();
    });

    // Click create button
    const createButton = screen.getByText('Create Community');
    fireEvent.click(createButton);

    // Modal should open
    expect(screen.getByText('Create New Community')).toBeInTheDocument();

    // Fill form
    const nameInput = screen.getByPlaceholderText('Community name');
    const descInput = screen.getByPlaceholderText('Community description');

    fireEvent.change(nameInput, { target: { value: 'New Community' } });
    fireEvent.change(descInput, { target: { value: 'A new community' } });

    // Submit
    const submitButton = screen.getByText('Create Community');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(communitiesApi.create).toHaveBeenCalledWith({
        name: 'New Community',
        slug: 'new-community',
        description: 'A new community',
      });
    });
  });

  it('should handle API errors gracefully', async () => {
    (communitiesApi.getAll as jest.Mock).mockRejectedValue(new Error('API Error'));

    renderWithRouter(<CommunitiesPage />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load communities. Please try again.')).toBeInTheDocument();
    });
  });

  it('should show loading state initially', () => {
    renderWithRouter(<CommunitiesPage />);

    expect(screen.getByText('Loading communities...')).toBeInTheDocument();
  });
});
