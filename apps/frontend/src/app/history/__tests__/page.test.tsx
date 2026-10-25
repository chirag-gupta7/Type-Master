jest.mock('@/lib/api', () => ({
  testAPI: {
    getTestHistory: jest.fn(),
  },
}));

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { testAPI } from '@/lib/api';
import HistoryPage from '../page';

describe('HistoryPage', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('renders loading state initially and displays test history table', async () => {
    (testAPI.getTestHistory as jest.Mock).mockResolvedValue({
      tests: [
        {
          id: 'test-1',
          wpm: 85.4,
          accuracy: 96.2,
          duration: 60,
          createdAt: '2026-03-15T10:30:00.000Z',
        },
        {
          id: 'test-2',
          wpm: 62.0,
          accuracy: 88.5,
          duration: 125,
          createdAt: '2026-03-14T14:15:00.000Z',
        },
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      },
    });

    render(<HistoryPage />);

    expect(screen.getByText('Loading test history...')).toBeDefined();

    expect(await screen.findByText('Test History')).toBeDefined();
    expect(screen.getByText('85.4')).toBeDefined();
    expect(screen.getByText('96.2%')).toBeDefined();
    expect(screen.getByText('1m')).toBeDefined();
    expect(screen.getByText('62.0')).toBeDefined();
    expect(screen.getByText('88.5%')).toBeDefined();
    expect(screen.getByText('2m 5s')).toBeDefined();

    expect(testAPI.getTestHistory).toHaveBeenCalledWith(1, 10);
  });

  it('renders empty state when no tests are returned', async () => {
    (testAPI.getTestHistory as jest.Mock).mockResolvedValue({
      tests: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 1,
      },
    });

    render(<HistoryPage />);

    expect(
      await screen.findByText('No test history available. Take your first typing test!')
    ).toBeDefined();
  });

  it('renders error message when API call fails', async () => {
    (testAPI.getTestHistory as jest.Mock).mockRejectedValue(new Error('Failed to connect'));

    render(<HistoryPage />);

    expect(await screen.findByText('Error loading test history')).toBeDefined();
    expect(screen.getByText('Failed to connect')).toBeDefined();
  });

  it('handles pagination next and previous buttons', async () => {
    (testAPI.getTestHistory as jest.Mock).mockResolvedValue({
      tests: [
        {
          id: 'test-1',
          wpm: 75.0,
          accuracy: 92.0,
          duration: 45,
          createdAt: '2026-03-15T10:30:00.000Z',
        },
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 15,
        totalPages: 2,
      },
    });

    render(<HistoryPage />);

    expect(await screen.findByText('Page 1 of 2')).toBeDefined();

    const nextBtn = screen.getByText('Next');
    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(testAPI.getTestHistory).toHaveBeenCalledWith(2, 10);
    });
  });
});
