import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { EnhancedSocialFeatures } from '@/components/social/enhanced-social-features'
import { socialAPI, usersAPI } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

// Mock the API modules
jest.mock('@/lib/api', () => ({
  socialAPI: {
    getGroups: jest.fn(),
    joinGroup: jest.fn(),
  },
  usersAPI: {
    getFriends: jest.fn(),
    getFriendSuggestions: jest.fn(),
    getActivity: jest.fn(),
    getAchievements: jest.fn(),
    sendFriendRequest: jest.fn(),
  },
}))

// Mock the toast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: jest.fn(),
}))

const mockToast = jest.fn()

const mockFriendsResponse = {
  results: [
    {
      id: '1',
      username: 'testuser1',
      display_name: 'Test User 1',
      avatar_url: '/test-avatar1.jpg',
      is_online: true,
      last_seen: '2025-01-01T00:00:00Z'
    }
  ]
}

const mockSuggestionsResponse = [
  {
    id: '2',
    username: 'suggested1',
    display_name: 'Suggested User',
    avatar_url: '/suggested-avatar.jpg',
    is_online: false,
    mutual_friends: 5
  }
]

const mockCommunitiesResponse = {
  results: [
    {
      id: '1',
      name: 'Test Community',
      description: 'A test community',
      member_count: 100,
      is_public: true,
      thumbnail: '/community-thumb.jpg'
    }
  ]
}

const mockActivityResponse = {
  results: [
    {
      id: '1',
      user: {
        id: '1',
        username: 'testuser1',
        display_name: 'Test User 1',
        avatar_url: '/test-avatar1.jpg'
      },
      activity_type: 'video_watch',
      metadata: {
        title: 'Test Video',
        video_id: 'vid123'
      },
      created_at: '2025-01-01T00:00:00Z'
    }
  ]
}

const mockAchievementsResponse = [
  {
    id: '1',
    name: 'First Watch',
    description: 'Watched your first video',
    icon: '🎬',
    unlocked_at: '2025-01-01T00:00:00Z'
  }
]

describe('EnhancedSocialFeatures', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useToast as jest.Mock).mockReturnValue({ toast: mockToast })
    ;(usersAPI.getFriends as jest.Mock).mockResolvedValue(mockFriendsResponse)
    ;(usersAPI.getFriendSuggestions as jest.Mock).mockResolvedValue(mockSuggestionsResponse)
    ;(socialAPI.getGroups as jest.Mock).mockResolvedValue(mockCommunitiesResponse)
    ;(usersAPI.getActivity as jest.Mock).mockResolvedValue(mockActivityResponse)
    ;(usersAPI.getAchievements as jest.Mock).mockResolvedValue(mockAchievementsResponse)
  })

  it('renders loading state initially', () => {
    render(<EnhancedSocialFeatures />)
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('fetches and displays social data on mount', async () => {
    render(<EnhancedSocialFeatures />)

    await waitFor(() => {
      expect(usersAPI.getFriends).toHaveBeenCalledWith({ limit: 20 })
      expect(usersAPI.getFriendSuggestions).toHaveBeenCalledWith({ limit: 20 })
      expect(socialAPI.getGroups).toHaveBeenCalledWith({ page: 1, public_only: true })
      expect(usersAPI.getActivity).toHaveBeenCalledWith({ page: 1 })
      expect(usersAPI.getAchievements).toHaveBeenCalled()
    })

    // Check that the data is displayed
    expect(screen.getByText('Test User 1')).toBeInTheDocument()
    expect(screen.getByText('Test Community')).toBeInTheDocument()
  })

  it('handles API errors gracefully', async () => {
    ;(usersAPI.getFriends as jest.Mock).mockRejectedValue(new Error('API Error'))

    render(<EnhancedSocialFeatures />)

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Failed to load social data. Please try again.',
        variant: 'destructive',
      })
    })
  })

  it('can send friend requests', async () => {
    ;(usersAPI.sendFriendRequest as jest.Mock).mockResolvedValue({})

    render(<EnhancedSocialFeatures />)

    await waitFor(() => {
      expect(screen.getByText('Suggested User')).toBeInTheDocument()
    })

    const addFriendButton = screen.getByRole('button', { name: /add friend/i })
    fireEvent.click(addFriendButton)

    await waitFor(() => {
      expect(usersAPI.sendFriendRequest).toHaveBeenCalledWith('2')
    })
  })

  it('handles empty responses gracefully', async () => {
    ;(usersAPI.getFriends as jest.Mock).mockResolvedValue({ results: [] })
    ;(usersAPI.getFriendSuggestions as jest.Mock).mockResolvedValue([])
    ;(socialAPI.getGroups as jest.Mock).mockResolvedValue({ results: [] })
    ;(usersAPI.getActivity as jest.Mock).mockResolvedValue({ results: [] })
    ;(usersAPI.getAchievements as jest.Mock).mockResolvedValue([])

    render(<EnhancedSocialFeatures />)

    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument()
    })

    // Should still render the UI structure without errors
    expect(screen.getByRole('tablist')).toBeInTheDocument()
  })
})