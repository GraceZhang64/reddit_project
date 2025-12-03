import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SearchBar from '../components/SearchBar';

describe('SearchBar Component', () => {
  const mockOnSearch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render search input and icon', () => {
    render(<SearchBar onSearch={mockOnSearch} placeholder="Search..." />);

    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    expect(screen.getByTestId('search-icon')).toBeInTheDocument();
  });

  it('should call onSearch with debounced input', async () => {
    jest.useFakeTimers();

    render(<SearchBar onSearch={mockOnSearch} placeholder="Search..." debounceMs={100} />);

    const input = screen.getByPlaceholderText('Search...');
    fireEvent.change(input, { target: { value: 'test query' } });

    // Should not call immediately
    expect(mockOnSearch).not.toHaveBeenCalled();

    // Fast-forward time
    jest.advanceTimersByTime(100);

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('test query');
    });

    jest.useRealTimers();
  });

  it('should not call onSearch for empty queries', async () => {
    jest.useFakeTimers();

    render(<SearchBar onSearch={mockOnSearch} placeholder="Search..." debounceMs={100} />);

    const input = screen.getByPlaceholderText('Search...');

    // Type something
    fireEvent.change(input, { target: { value: 'test' } });
    jest.advanceTimersByTime(100);

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('test');
    });

    // Clear input
    fireEvent.change(input, { target: { value: '' } });
    jest.advanceTimersByTime(100);

    // Should not call onSearch for empty string
    expect(mockOnSearch).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
  });

  it('should show loading state when searching', async () => {
    jest.useFakeTimers();

    render(<SearchBar onSearch={mockOnSearch} placeholder="Search..." debounceMs={100} />);

    const input = screen.getByPlaceholderText('Search...');
    fireEvent.change(input, { target: { value: 'test' } });

    // Should show loading immediately when typing
    expect(screen.getByTestId('search-loading')).toBeInTheDocument();

    jest.advanceTimersByTime(100);

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('test');
    });

    // Loading should be hidden after search completes
    expect(screen.queryByTestId('search-loading')).not.toBeInTheDocument();

    jest.useRealTimers();
  });

  it('should handle different debounce times', async () => {
    jest.useFakeTimers();

    render(<SearchBar onSearch={mockOnSearch} placeholder="Search..." debounceMs={500} />);

    const input = screen.getByPlaceholderText('Search...');
    fireEvent.change(input, { target: { value: 'test' } });

    // Advance less than debounce time
    jest.advanceTimersByTime(300);
    expect(mockOnSearch).not.toHaveBeenCalled();

    // Advance remaining time
    jest.advanceTimersByTime(200);

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('test');
    });

    jest.useRealTimers();
  });

  it('should clear search when input is cleared', async () => {
    jest.useFakeTimers();

    render(<SearchBar onSearch={mockOnSearch} placeholder="Search..." debounceMs={100} />);

    const input = screen.getByPlaceholderText('Search...');

    // Type something
    fireEvent.change(input, { target: { value: 'test' } });
    jest.advanceTimersByTime(100);

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('test');
    });

    // Clear input
    fireEvent.change(input, { target: { value: '' } });
    jest.advanceTimersByTime(100);

    // Should not call onSearch again for empty string
    expect(mockOnSearch).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
  });

  it('should handle rapid typing correctly', async () => {
    jest.useFakeTimers();

    render(<SearchBar onSearch={mockOnSearch} placeholder="Search..." debounceMs={100} />);

    const input = screen.getByPlaceholderText('Search...');

    // Type rapidly
    fireEvent.change(input, { target: { value: 't' } });
    fireEvent.change(input, { target: { value: 'te' } });
    fireEvent.change(input, { target: { value: 'tes' } });
    fireEvent.change(input, { target: { value: 'test' } });

    // Only advance time once at the end
    jest.advanceTimersByTime(100);

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('test');
      expect(mockOnSearch).toHaveBeenCalledTimes(1);
    });

    jest.useRealTimers();
  });
});

