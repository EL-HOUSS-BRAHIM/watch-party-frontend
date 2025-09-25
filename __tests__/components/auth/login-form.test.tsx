import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { jest } from "@jest/globals"

const mockLogin = jest.fn()
const mockSocialLogin = jest.fn()
const mockToast = jest.fn()
const useAuthMock = jest.fn()
const useToastMock = jest.fn()
const useRouterMock = jest.fn()
const useSearchParamsMock = jest.fn()

const LoginPage = require("@/app/(auth)/login/page").default as typeof import("@/app/(auth)/login/page").default

const createSearchParams = (params: Record<string, string> = {}) => ({
  get: (key: string) => params[key] ?? null,
})

jest.mock("@/contexts/auth-context", () => ({
  useAuth: (...args: unknown[]) => useAuthMock(...args),
}))

jest.mock("@/hooks/use-toast", () => ({
  useToast: (...args: unknown[]) => useToastMock(...args),
}))

jest.mock("next/navigation", () => ({
  useRouter: (...args: unknown[]) => useRouterMock(...args),
  useSearchParams: (...args: unknown[]) => useSearchParamsMock(...args),
}))

describe("LoginPage", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLogin.mockReset()
    mockSocialLogin.mockReset()
    mockToast.mockReset()
    useAuthMock.mockReset()
    useToastMock.mockReset()
    useRouterMock.mockReset()
    useSearchParamsMock.mockReset()

    mockLogin.mockResolvedValue(undefined)
    mockSocialLogin.mockResolvedValue(undefined)

    useAuthMock.mockReturnValue({
      login: mockLogin,
      socialLogin: mockSocialLogin,
      isLoading: false,
    })

    useToastMock.mockReturnValue({ toast: mockToast })
    useRouterMock.mockReturnValue({ push: jest.fn(), replace: jest.fn() })
    useSearchParamsMock.mockReturnValue(createSearchParams())
  })

  it("renders login form correctly", () => {
    render(<LoginPage />)

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument()
  })

  it("displays messages from search params", () => {
    useSearchParamsMock.mockReturnValue(createSearchParams({ message: "Welcome back!" }))

    render(<LoginPage />)

    expect(screen.getByText("Welcome back!")).toBeInTheDocument()
  })

  it("validates required fields", async () => {
    render(<LoginPage />)

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
      expect(screen.getByText(/password is required/i)).toBeInTheDocument()
    })
  })

  it("validates email format", async () => {
    render(<LoginPage />)

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "invalid-email" },
    })

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
    })
  })

  it("submits form with valid data", async () => {
    render(<LoginPage />)

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "test@example.com" },
    })
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "password123" },
    })

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }))

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("test@example.com", "password123")
    })
  })

  it("shows global loading state from auth context", () => {
    useAuthMock.mockReturnValue({
      login: mockLogin,
      socialLogin: mockSocialLogin,
      isLoading: true,
    })

    render(<LoginPage />)

    expect(screen.getByText(/checking authentication/i)).toBeInTheDocument()
  })
})
