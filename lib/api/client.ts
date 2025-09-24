import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosError } from "axios"
import { API_ENDPOINTS } from "./endpoints"

// Types
export interface ApiResponse<T = any> {
  data: T
  message?: string
  status: number
}

export interface PaginatedResponse<T = any> {
  results: T[]
  count: number
  next?: string
  previous?: string
  page_size: number
  current_page: number
  total_pages: number
}

export interface ApiError {
  message: string
  errors?: Record<string, string[]>
  status: number
  code?: string
}

// Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws"

// Request timeout in milliseconds
const REQUEST_TIMEOUT = 30000

// Retry configuration
const MAX_RETRIES = 3
const RETRY_DELAY = 1000

class ApiClient {
  private client: AxiosInstance
  private retryCount: Map<string, number> = new Map()

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: REQUEST_TIMEOUT,
      headers: {
        "Content-Type": "application/json",
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = this.getAuthToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }

        // Add request timestamp for debugging
        config.metadata = { startTime: new Date() }

        return config
      },
      (error) => {
        return Promise.reject(this.handleError(error))
      },
    )

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        // Log response time in development
        if (process.env.NODE_ENV === "development") {
          const endTime = new Date()
          const startTime = response.config.metadata?.startTime
          if (startTime) {
            const duration = endTime.getTime() - startTime.getTime()
            console.log(`API Request: ${response.config.method?.toUpperCase()} ${response.config.url} - ${duration}ms`)
          }
        }

        return response
      },
      async (error) => {
        const originalRequest = error.config

        // Handle token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true

          try {
            await this.refreshToken()
            const token = this.getAuthToken()
            if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`
              return this.client(originalRequest)
            }
          } catch (refreshError) {
            this.handleAuthError()
            return Promise.reject(this.handleError(error))
          }
        }

        // Handle retries for network errors
        if (this.shouldRetry(error) && !originalRequest._retry) {
          const retryKey = `${originalRequest.method}-${originalRequest.url}`
          const currentRetries = this.retryCount.get(retryKey) || 0

          if (currentRetries < MAX_RETRIES) {
            this.retryCount.set(retryKey, currentRetries + 1)
            originalRequest._retry = true

            // Exponential backoff
            const delay = RETRY_DELAY * Math.pow(2, currentRetries)
            await new Promise((resolve) => setTimeout(resolve, delay))

            return this.client(originalRequest)
          } else {
            this.retryCount.delete(retryKey)
          }
        }

        return Promise.reject(this.handleError(error))
      },
    )
  }

  private getAuthToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("access_token") ?? localStorage.getItem("accessToken")
    }
    return null
  }

  private async refreshToken(): Promise<void> {
    const refreshToken =
      typeof window !== "undefined"
        ? localStorage.getItem("refresh_token") ?? localStorage.getItem("refreshToken")
        : null

    if (!refreshToken) {
      throw new Error("No refresh token available")
    }

    try {
      const response = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.auth.refresh}`, {
        refresh: refreshToken,
      })

      const { access, refresh } = response.data

      if (typeof window !== "undefined") {
        localStorage.setItem("access_token", access)
        localStorage.setItem("accessToken", access)
        if (refresh) {
          localStorage.setItem("refresh_token", refresh)
          localStorage.setItem("refreshToken", refresh)
        }
      }
    } catch (error) {
      // Clear tokens on refresh failure
      if (typeof window !== "undefined") {
        localStorage.removeItem("access_token")
        localStorage.removeItem("accessToken")
        localStorage.removeItem("refresh_token")
        localStorage.removeItem("refreshToken")
      }
      throw error
    }
  }

  private handleAuthError(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token")
      localStorage.removeItem("accessToken")
      localStorage.removeItem("refresh_token")
      localStorage.removeItem("refreshToken")

      // Redirect to login page
      window.location.href = "/login"
    }
  }

  private shouldRetry(error: AxiosError): boolean {
    // Retry on network errors or 5xx server errors
    return (
      !error.response ||
      error.code === "NETWORK_ERROR" ||
      error.code === "TIMEOUT" ||
      (error.response.status >= 500 && error.response.status < 600)
    )
  }

  private handleError(error: AxiosError): ApiError {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response
      return {
        message: data?.message || data?.detail || "An error occurred",
        errors: data?.errors,
        status,
        code: data?.code,
      }
    } else if (error.request) {
      // Network error
      return {
        message: "Network error. Please check your connection.",
        status: 0,
        code: "NETWORK_ERROR",
      }
    } else {
      // Request setup error
      return {
        message: error.message || "An unexpected error occurred",
        status: 0,
        code: "REQUEST_ERROR",
      }
    }
  }

  // HTTP Methods
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config)
    return response.data
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post(url, data, config)
    return response.data
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config)
    return response.data
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config)
    return response.data
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config)
    return response.data
  }

  // File upload with progress
  async upload<T = any>(
    url: string,
    file: File,
    onProgress?: (progress: number) => void,
    additionalData?: Record<string, any>,
  ): Promise<T> {
    const formData = new FormData()
    formData.append("file", file)

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value)
      })
    }

    const response = await this.client.post<T>(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(progress)
        }
      },
    })

    return response.data
  }

  // Download file
  async download(url: string, filename?: string): Promise<void> {
    const response = await this.client.get(url, {
      responseType: "blob",
    })

    // Create download link
    const blob = new Blob([response.data])
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = downloadUrl
    link.download = filename || "download"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(downloadUrl)
  }

  // WebSocket connection
  createWebSocket(endpoint: string, protocols?: string[]): WebSocket {
    const token = this.getAuthToken()
    const wsUrl = `${WS_BASE_URL}${endpoint}${token ? `?token=${token}` : ""}`

    return new WebSocket(wsUrl, protocols)
  }

  // Utility methods
  setAuthToken(token: string): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("access_token", token)
    }
  }

  clearAuthToken(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token")
      localStorage.removeItem("refresh_token")
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.get("/health/")
      return true
    } catch {
      return false
    }
  }
}

// Create singleton instance
const apiClient = new ApiClient()

// Export specific API modules
export { apiClient }
export default apiClient

// Error handling utilities
export const isApiError = (error: any): error is ApiError => {
  return error && typeof error.message === "string" && typeof error.status === "number"
}

export const getErrorMessage = (error: any): string => {
  if (isApiError(error)) {
    return error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  return "An unexpected error occurred"
}

export const getFieldErrors = (error: any): Record<string, string[]> => {
  if (isApiError(error) && error.errors) {
    return error.errors
  }
  return {}
}
