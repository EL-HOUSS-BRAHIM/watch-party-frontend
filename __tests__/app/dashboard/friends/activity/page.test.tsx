import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FriendsActivityFeed from '@/app/dashboard/friends/activity/page'
import { usersAPI } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

// Mock the API modules
jest.mock('@/lib/api', () => ({
  usersAPI: {
    getActivity: jest.fn(),
  },
}))

// Mock the toast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: jest.fn(),
}))

const mockToast = jest.fn()

const mockActivityResponse = {
  results: [
    {
      id: '1',
      user: {
        id: '1',
        username: 'testuser1',
        display_name: 'Test User 1',
        avatar_url: '/test-avatar1.jpg',
        is_online: true
      },
      activity_type: 'video_watch',
      metadata: {
        title: 'Test Video',
        description: 'A great test video',
        thumbnail: '/test-thumb.jpg',
        video_id: 'vid123'
      },
      created_at: '2025-01-01T12:00:00Z',
      privacy: 'public'
    },
    {
      id: '2',
      user: {
        id: '2',
        username: 'testuser2',
        display_name: 'Test User 2',
        avatar_url: '/test-avatar2.jpg',
        is_online: false
      },
      activity_type: 'party_join',
      metadata: {
        title: 'Test Party',
        party_id: 'party456'
      },
      created_at: '2025-01-01T11:30:00Z',
      privacy: 'friends'
    },
    {
      id: '3',
      user: {
        id: '3',
        username: 'testuser3',
        display_name: 'Test User 3',
        avatar_url: '/test-avatar3.jpg'
      },
      activity_type: 'achievement_unlock',
      metadata: {
        title: 'First Watch',
        achievement_id: 'ach789'
      },
      created_at: '2025-01-01T10:15:00Z',
      privacy: 'public'
    }
  ]
}

describe('FriendsActivityFeed', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useToast as jest.Mock).mockReturnValue({ toast: mockToast })
    ;(usersAPI.getActivity as jest.Mock).mockResolvedValue(mockActivityResponse)
  })

  it('fetches activities on mount', async () => {
    render(<FriendsActivityFeed />)

    await waitFor(() => {
      expect(usersAPI.getActivity).toHaveBeenCalledWith({ page: 1 })
    })

    expect(screen.getByText('Test Video')).toBeInTheDocument()
    expect(screen.getByText('Test Party')).toBeInTheDocument()
    expect(screen.getByText('First Watch')).toBeInTheDocument()
  })

  it('applies activity type filter', async () => {
    const user = userEvent.setup()
    render(<FriendsActivityFeed />)

    await waitFor(() => {
      expect(screen.getByText('Test Video')).toBeInTheDocument()
    })

    // Open filter dropdown
    const filterSelect = screen.getByRole('combobox', { name: /filter by type/i })
    await user.click(filterSelect)

    // Select video activities only
    const videoOption = screen.getByRole('option', { name: /video activities/i })
    await user.click(videoOption)

    await waitFor(() => {
      expect(usersAPI.getActivity).toHaveBeenCalledWith({ 
        page: 1, 
        type: 'video_watch' 
      })
    })
  })

  it('applies timeframe filter', async () => {
    const user = userEvent.setup()
    render(<FriendsActivityFeed />)

    await waitFor(() => {
      expect(screen.getByText('Test Video')).toBeInTheDocument()
    })

    // Open timeframe dropdown
    const timeframeSelect = screen.getByRole('combobox', { name: /timeframe/i })
    await user.click(timeframeSelect)

    // Select this week
    const weekOption = screen.getByRole('option', { name: /this week/i })
    await user.click(weekOption)

    await waitFor(() => {
      expect(usersAPI.getActivity).toHaveBeenCalledWith({ 
        page: 1, 
        timeframe: 'week' 
      })
    })
  })

  it('handles API errors gracefully', async () => {
    ;(usersAPI.getActivity as jest.Mock).mockRejectedValue(new Error('API Error'))

    render(<FriendsActivityFeed />)

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Could not load friend activity',
        description: 'Please try again later.',
        variant: 'destructive',
      })
    })
  })

  it('handles empty response gracefully', async () => {
    ;(usersAPI.getActivity as jest.Mock).mockResolvedValue({ results: [] })

    render(<FriendsActivityFeed />)

    await waitFor(() => {
      expect(screen.getByText(/no recent activity/i)).toBeInTheDocument()
    })
  })

  it('displays loading state initially', () => {
    render(<FriendsActivityFeed />)
    expect(screen.getByTestId('activity-loading')).toBeInTheDocument()
  })

  it('normalizes malformed activity data', async () => {
    const malformedResponse = {
      results: [
        {
          // Missing required fields
          id: '1',
          activity_type: null,
          user: null,
          metadata: null,
          created_at: 'invalid-date'
        }
      ]
    }

    ;(usersAPI.getActivity as jest.Mock).mockResolvedValue(malformedResponse)

    render(<FriendsActivityFeed />)

    await waitFor(() => {
      // Should not crash and should handle malformed data
      expect(usersAPI.getActivity).toHaveBeenCalled()
    })

    // Should display normalized data with fallbacks
    expect(screen.getByText('Activity update')).toBeInTheDocument()
    expect(screen.getByText('Friend')).toBeInTheDocument()
  })

  it('filters activities locally based on selected type', async () => {
    const user = userEvent.setup()
    render(<FriendsActivityFeed />)

    await waitFor(() => {
      expect(screen.getByText('Test Video')).toBeInTheDocument()
      expect(screen.getByText('Test Party')).toBeInTheDocument()
      expect(screen.getByText('First Watch')).toBeInTheDocument()
    })

    // Change to video filter
    const filterSelect = screen.getByRole('combobox', { name: /filter by type/i })
    await user.click(filterSelect)
    const videoOption = screen.getByRole('option', { name: /video activities/i })
    await user.click(videoOption)

    // Should only show video activities
    expect(screen.getByText('Test Video')).toBeInTheDocument()
    expect(screen.queryByText('Test Party')).not.toBeInTheDocument()
    expect(screen.queryByText('First Watch')).not.toBeInTheDocument()
  })

  it('refreshes data when filters change', async () => {
    const user = userEvent.setup()
    render(<FriendsActivityFeed />)

    await waitFor(() => {
      expect(usersAPI.getActivity).toHaveBeenCalledTimes(1)
    })

    // Change timeframe
    const timeframeSelect = screen.getByRole('combobox', { name: /timeframe/i })
    await user.click(timeframeSelect)
    const weekOption = screen.getByRole('option', { name: /this week/i })
    await user.click(weekOption)

    await waitFor(() => {
      expect(usersAPI.getActivity).toHaveBeenCalledTimes(2)
    })
  })
})