import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SmartFriendSearch } from '@/components/social/smart-friend-search'
import { usersAPI } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

// Mock the API modules
jest.mock('@/lib/api', () => ({
  usersAPI: {
    searchUsers: jest.fn(),
    getFriendSuggestions: jest.fn(),
    sendFriendRequest: jest.fn(),
  },
}))

// Mock the toast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: jest.fn(),
}))

const mockToast = jest.fn()

const mockSearchResults = [
  {
    id: '1',
    username: 'searchresult1',
    display_name: 'Search Result 1',
    avatar_url: '/search-avatar1.jpg',
    is_online: true,
    mutual_friends: 3,
    common_interests: ['movies', 'gaming'],
    location: 'New York'
  }
]

const mockSuggestions = [
  {
    id: '2',
    username: 'suggestion1',
    display_name: 'Suggestion 1',
    avatar_url: '/suggestion-avatar1.jpg',
    is_online: false,
    mutual_friends: 5,
    common_interests: ['music', 'tv'],
    location: 'California'
  }
]

describe('SmartFriendSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useToast as jest.Mock).mockReturnValue({ toast: mockToast })
    ;(usersAPI.searchUsers as jest.Mock).mockResolvedValue(mockSearchResults)
    ;(usersAPI.getFriendSuggestions as jest.Mock).mockResolvedValue(mockSuggestions)
    ;(usersAPI.sendFriendRequest as jest.Mock).mockResolvedValue({})
  })

  it('loads friend suggestions on mount', async () => {
    render(<SmartFriendSearch />)

    await waitFor(() => {
      expect(usersAPI.getFriendSuggestions).toHaveBeenCalledWith({ limit: 12 })
    })

    expect(screen.getByText('Suggestion 1')).toBeInTheDocument()
  })

  it('performs search when typing in search input', async () => {
    const user = userEvent.setup()
    render(<SmartFriendSearch />)

    const searchInput = screen.getByPlaceholderText(/search for friends/i)
    await user.type(searchInput, 'test user')

    await waitFor(() => {
      expect(usersAPI.searchUsers).toHaveBeenCalledWith({
        query: 'test user',
        limit: 20,
        filters: expect.objectContaining({
          sortBy: 'relevance',
          location: 'any',
          hasAvatar: false,
          isOnline: false,
          verifiedOnly: false,
          minMutualFriends: 0,
          genres: []
        })
      })
    })

    expect(screen.getByText('Search Result 1')).toBeInTheDocument()
  })

  it('does not search for queries shorter than 3 characters', async () => {
    const user = userEvent.setup()
    render(<SmartFriendSearch />)

    const searchInput = screen.getByPlaceholderText(/search for friends/i)
    await user.type(searchInput, 'ab')

    // Should not make API call
    expect(usersAPI.searchUsers).not.toHaveBeenCalled()
  })

  it('applies search filters', async () => {
    const user = userEvent.setup()
    render(<SmartFriendSearch />)

    // Open filters
    const filtersButton = screen.getByRole('button', { name: /filters/i })
    await user.click(filtersButton)

    // Change some filter settings
    const onlineOnlySwitch = screen.getByRole('switch', { name: /online only/i })
    await user.click(onlineOnlySwitch)

    // Type in search to trigger API call
    const searchInput = screen.getByPlaceholderText(/search for friends/i)
    await user.type(searchInput, 'test user')

    await waitFor(() => {
      expect(usersAPI.searchUsers).toHaveBeenCalledWith({
        query: 'test user',
        limit: 20,
        filters: expect.objectContaining({
          isOnline: true
        })
      })
    })
  })

  it('can send friend requests from search results', async () => {
    const user = userEvent.setup()
    render(<SmartFriendSearch />)

    const searchInput = screen.getByPlaceholderText(/search for friends/i)
    await user.type(searchInput, 'test user')

    await waitFor(() => {
      expect(screen.getByText('Search Result 1')).toBeInTheDocument()
    })

    const addFriendButton = screen.getByRole('button', { name: /add friend/i })
    await user.click(addFriendButton)

    await waitFor(() => {
      expect(usersAPI.sendFriendRequest).toHaveBeenCalledWith('1')
    })
  })

  it('can send friend requests from suggestions', async () => {
    const user = userEvent.setup()
    render(<SmartFriendSearch />)

    await waitFor(() => {
      expect(screen.getByText('Suggestion 1')).toBeInTheDocument()
    })

    const addFriendButtons = screen.getAllByRole('button', { name: /add friend/i })
    await user.click(addFriendButtons[0])

    await waitFor(() => {
      expect(usersAPI.sendFriendRequest).toHaveBeenCalledWith('2')
    })
  })

  it('handles API errors gracefully', async () => {
    ;(usersAPI.getFriendSuggestions as jest.Mock).mockRejectedValue(new Error('API Error'))

    render(<SmartFriendSearch />)

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Unable to load suggestions',
        description: 'Please try refreshing suggestions in a moment.',
        variant: 'destructive',
      })
    })
  })

  it('displays loading states correctly', async () => {
    const user = userEvent.setup()
    // Make the API call take longer to complete
    ;(usersAPI.searchUsers as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockSearchResults), 100))
    )

    render(<SmartFriendSearch />)

    const searchInput = screen.getByPlaceholderText(/search for friends/i)
    await user.type(searchInput, 'test user')

    // Should show loading state
    expect(screen.getByTestId('search-loading')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.queryByTestId('search-loading')).not.toBeInTheDocument()
    })
  })
})