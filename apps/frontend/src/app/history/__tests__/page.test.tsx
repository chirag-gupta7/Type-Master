jest.mock('@/lib/api', () => ({
  testAPI: {
    getTestHistory: jest.fn(),
  },
}));

import { render, screen, fireEvent, act } from '@testing-library/react';
import { testAPI } from '@/lib/api';
import HistoryPage from '../page';

describe('HistoryPage', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('renders test history with formatted values and accuracy styling', async () => {
    (testAPI.getTestHistory as jest.Mock).mockResolvedValue({
      tests: [
        {
          id: 'test-1',
          wpm: 65.4,
          accuracy: 96.2,
          duration: 60,
          createdAt: '2026-03-15T10:30:00Z',
        },
        {
          id: 'test-2',
          wpm: 50.1,
          accuracy: 91.5,
          duration: 30,
          createdAt: '2026-03-14T09:15:00Z',
        },
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      },
    });

    await act(async () => {
      render(<HistoryPage />);
    });

    expect(await screen.findByText('Test History')).not.toBeNull();
    expect(screen.getByText('65.4')).not.toBeNull();
    expect(screen.getByText('96.2%')).not.toBeNull();
    expect(screen.getByText('1m')).not.toBeNull();
    expect(screen.getByText('30s')).not.toBeNull();
    expect(screen.getByText('50.1')).not.toBeNull();
    expect(screen.getByText('91.5%')).not.toBeNull();
  });

  it('handles pagination next and previous buttons', async () => {
    (testAPI.getTestHistory as jest.Mock).mockResolvedValue({
      tests: [
        {
          id: 'test-1',
          wpm: 70,
          accuracy: 98,
          duration: 60,
          createdAt: '2026-03-15T10:30:00Z',
        },
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 15,
        totalPages: 2,
      },
    });

    await act(async () => {
      render(<HistoryPage />);
    });

    expect(await screen.findByText('Page 1 of 2')).not.toBeNull();

    const nextBtn = screen.getByText('Next');
    await act(async () => {
      fireEvent.click(nextBtn);
    });

    expect(testAPI.getTestHistory).toHaveBeenLastCalledWith(2, 10);
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

    await act(async () => {
      render(<HistoryPage />);
    });

    expect(
      await screen.findByText('No test history available. Take your first typing test!')
    ).not.toBeNull();
  });

  it('renders error state when API fails', async () => {
    (testAPI.getTestHistory as jest.Mock).mockRejectedValue(new Error('Network error'));

    await act(async () => {
      render(<HistoryPage />);
    });

    expect(await screen.findByText('Error loading test history')).not.toBeNull();
    expect(screen.getByText('Network error')).not.toBeNull();
  });
});
