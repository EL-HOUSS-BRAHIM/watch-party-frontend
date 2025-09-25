"use client"

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { AuthAPI } from "@/lib/api/auth"
import { UsersAPI } from "@/lib/api/users"
import type { User as APIUser, RegisterData as APIRegisterData } from "@/lib/api/types"
import { tokenStorage } from "@/lib/auth/token-storage"

// Initialize API instances directly
const authAPI = new AuthAPI()
const usersAPI = new UsersAPI()

// Extended user interface for the frontend context  
interface User extends Omit<APIUser, 'avatar'> {
  avatar?: string | null // Allow both null and undefined for compatibility
  role?: "user" | "admin" | "moderator"
  isEmailVerified?: boolean
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  accessToken: string | null
  refreshToken: string | null
  login: (email: string, password: string) => Promise<void>
  register: (userData: RegisterData) => Promise<void>
  logout: () => void
  forgotPassword: (email: string) => Promise<void>
  resetPassword: (token: string, password: string) => Promise<void>
  verifyEmail: (token: string) => Promise<void>
  resendVerification: () => Promise<void>
  socialLogin: (provider: "google" | "github") => Promise<void>
  refreshToken: () => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<void>
  updateUser: (userData: Partial<User>) => void
  refreshUser: () => Promise<void>
}

interface RegisterData extends APIRegisterData {
  // Keep the same structure as API but allow for frontend-specific extensions
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [accessToken, setAccessToken] = useState<string | null>(tokenStorage.getAccessToken())
  const [refreshToken, setRefreshToken] = useState<string | null>(tokenStorage.getRefreshToken())
  const router = useRouter()

  const isAuthenticated = useMemo(() => {
    return !!user && !!accessToken
  }, [user, accessToken])

  // Keep local state in sync with storage updates
  useEffect(() => {
    const unsubscribe = tokenStorage.subscribe((nextAccessToken, nextRefreshToken) => {
      setAccessToken(nextAccessToken)
      setRefreshToken(nextRefreshToken)
    })

    // Ensure we hydrate tokens from sessionStorage on initial load
    tokenStorage.syncFromStorage()
    setAccessToken(tokenStorage.getAccessToken())
    setRefreshToken(tokenStorage.getRefreshToken())

    return unsubscribe
  }, [])

  // Check for existing session on mount
  useEffect(() => {
    checkAuthStatus()
  }, [])

  // Auto-refresh token
  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(
        () => {
          refreshToken().catch(() => {
            // If refresh fails, logout user
            logout()
          })
        },
        14 * 60 * 1000,
      ) // Refresh every 14 minutes

      return () => clearInterval(interval)
    }
  }, [isAuthenticated])

  const checkAuthStatus = async () => {
    try {
      // Check if we're in the browser environment
      if (typeof window === 'undefined') {
        setIsLoading(false)
        return
      }

      if (!tokenStorage.hasAccessToken()) {
        setIsLoading(false)
        return
      }

      const userData = await authAPI.getProfile()
      setUser({ ...userData, avatar: userData.avatar || undefined })
    } catch (error) {
      console.error("Auth check failed:", error)
      tokenStorage.clearTokens()
      setAccessToken(null)
      setRefreshToken(null)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login({ email, password })

      tokenStorage.setTokens({
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
      })

      const user = {
        ...response.user,
        avatar: response.user.avatar || undefined,
        role: response.user.role,
      }
      setUser(user)

      // Redirect based on user role
      if (user.role === "admin") {
        router.push("/dashboard/admin")
      } else {
        router.push("/dashboard")
      }
    } catch (error) {
      console.error("Login error:", error)
      throw error
    }
  }

  const register = async (userData: RegisterData) => {
    try {
      const response = await authAPI.register(userData)

      // Auto-login after successful registration
      if (response.access_token && response.refresh_token) {
        tokenStorage.setTokens({
          accessToken: response.access_token,
          refreshToken: response.refresh_token,
        })
        setUser({
          ...response.user,
          avatar: response.user.avatar || undefined,
          role: response.user.role,
        })
        router.push("/dashboard")
      } else {
        // Email verification required
        router.push("/login?message=Please check your email to verify your account")
      }
    } catch (error) {
      throw error
    }
  }

  const logout = async () => {
    try {
      await authAPI.logout()
    } catch (error) {
      // Continue with logout even if API call fails
      console.error("Logout API call failed:", error)
    } finally {
      tokenStorage.clearTokens()
      setAccessToken(null)
      setRefreshToken(null)
      setUser(null)
      router.push("/login")
    }
  }

  const forgotPassword = async (email: string) => {
    try {
      await authAPI.forgotPassword({ email })
    } catch (error) {
      throw error
    }
  }

  const resetPassword = async (token: string, password: string) => {
    try {
      await authAPI.resetPassword({ 
        token, 
        new_password: password,
        confirm_password: password 
      })
    } catch (error) {
      throw error
    }
  }

  const verifyEmail = async (token: string) => {
    try {
      await authAPI.verifyEmail(token)

      // Update user data
      if (user) {
        setUser({ ...user, isEmailVerified: true })
      }
    } catch (error) {
      throw error
    }
  }

  const resendVerification = async () => {
    try {
      if (!user?.email) {
        throw new Error("No user email available for verification resend")
      }

      await authAPI.resendVerification(user.email)
    } catch (error) {
      throw error
    }
  }

  const socialLogin = async (provider: "google" | "github") => {
    try {
      const redirectUri = `${window.location.origin}/callback?provider=${provider}`

      const data = await authAPI.getSocialAuthUrl(provider, redirectUri)

      if (data?.redirect_url) {
        window.location.href = data.redirect_url
      } else {
        throw new Error("No redirect URL received")
      }
    } catch (error) {
      console.error("Social login error:", error)
      throw error
    }
  }

  const refreshToken = async () => {
    try {
      if (typeof window === 'undefined') {
        throw new Error("Cannot refresh token on server side")
      }

      const currentRefreshToken = tokenStorage.getRefreshToken()
      if (!currentRefreshToken) {
        throw new Error("No refresh token available")
      }

      const response = await authAPI.refreshToken()
      tokenStorage.setTokens({ accessToken: response.access, refreshToken: currentRefreshToken })

      // Get updated user data
      const userData = await authAPI.getProfile()
      setUser({ ...userData, avatar: userData.avatar || undefined })
    } catch (error) {
      tokenStorage.clearTokens()
      setAccessToken(null)
      setRefreshToken(null)
      setUser(null)
      throw error
    }
  }

  const updateProfile = async (data: Partial<User>) => {
    try {
      // Convert User data to UserProfile format for the API
      const profileData = {
        bio: (data as any).bio,
        timezone: (data as any).timezone,
        language: (data as any).language,
        // Add other profile fields as needed
      }
      
      const response = await usersAPI.updateProfile(profileData)
      setUser({ 
        ...response, 
        ...response.profile,
        avatar: response.avatar || undefined 
      })
    } catch (error) {
      throw error
    }
  }

  const updateUser = (userData: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...userData } : null)
  }

  const refreshUser = async () => {
    try {
      setIsLoading(true)
      if (tokenStorage.hasAccessToken()) {
        const userData = await authAPI.getProfile()
        setUser(userData)
      }
    } catch (error) {
      console.error("Failed to refresh user:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerification,
    socialLogin,
    refreshToken,
    updateProfile,
    updateUser,
    refreshUser,
    accessToken,
    refreshToken,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
