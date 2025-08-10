/**
 * Admin API Service
 * Handles admin panel-related API calls including complete system management
 */

import { apiClient } from "./client"
import { API_ENDPOINTS } from "./endpoints"
import type {
  AdminDashboard,
  SystemHealth,
  User,
  PaginatedResponse,
  APIResponse,
} from "./types"

export class AdminAPI {
  /**
   * Get admin dashboard overview
   */
  async getDashboard(): Promise<AdminDashboard> {
    return apiClient.get<AdminDashboard>(API_ENDPOINTS.admin.dashboard)
  }

  /**
   * Get users for admin management
   */
  async getUsers(params?: {
    search?: string
    status?: 'active' | 'suspended' | 'banned'
    subscription?: 'active' | 'inactive'
    page?: number
  }): Promise<PaginatedResponse<User>> {
    return apiClient.get<PaginatedResponse<User>>(API_ENDPOINTS.admin.users, { params })
  }

  /**
   * Get system health status
   */
  async getSystemHealth(): Promise<SystemHealth> {
    return apiClient.get<SystemHealth>(API_ENDPOINTS.admin.systemHealth)
  }

  // === ANALYTICS ===

  /**
   * Get admin analytics
   */
  async getAnalytics(): Promise<any> {
    return apiClient.get(API_ENDPOINTS.admin.analytics)
  }

  // === USER MANAGEMENT ===

  /**
   * Suspend user account
   */
  async suspendUser(userId: string, reason?: string): Promise<APIResponse> {
    return apiClient.post<APIResponse>(API_ENDPOINTS.admin.suspendUser(userId), {
      reason,
    })
  }

  /**
   * Unsuspend user account
   */
  async unsuspendUser(userId: string): Promise<APIResponse> {
    return apiClient.post<APIResponse>(API_ENDPOINTS.admin.unsuspendUser(userId))
  }

  /**
   * Perform bulk action on users
   */
  async bulkUserAction(data: {
    user_ids: string[]
    action: 'suspend' | 'unsuspend' | 'ban' | 'unban' | 'delete'
    reason?: string
  }): Promise<APIResponse> {
    return apiClient.post<APIResponse>(API_ENDPOINTS.admin.bulkUserAction, data)
  }

  /**
   * Export users data
   */
  async exportUsers(params?: {
    format?: 'csv' | 'excel'
    filters?: Record<string, any>
  }): Promise<{ download_url: string; expires_at: string }> {
    return apiClient.post(API_ENDPOINTS.admin.exportUsers, params)
  }

  /**
   * Get user actions history
   */
  async getUserActions(userId: string): Promise<any[]> {
    return apiClient.get(API_ENDPOINTS.admin.userActions(userId))
  }

  // === PARTY MANAGEMENT ===

  /**
   * Get parties for admin management
   */
  async getParties(params?: {
    search?: string
    status?: 'active' | 'ended'
    page?: number
  }): Promise<PaginatedResponse<any>> {
    return apiClient.get<PaginatedResponse<any>>(API_ENDPOINTS.admin.parties, { params })
  }

  /**
   * Delete party
   */
  async deleteParty(partyId: string): Promise<APIResponse> {
    return apiClient.delete<APIResponse>(API_ENDPOINTS.admin.deleteParty(partyId))
  }

  // === VIDEO MANAGEMENT ===

  /**
   * Get videos for admin management
   */
  async getVideos(params?: {
    search?: string
    status?: 'active' | 'processing' | 'failed'
    page?: number
  }): Promise<PaginatedResponse<any>> {
    return apiClient.get<PaginatedResponse<any>>(API_ENDPOINTS.admin.videos, { params })
  }

  /**
   * Delete video
   */
  async deleteVideo(videoId: string): Promise<APIResponse> {
    return apiClient.delete<APIResponse>(API_ENDPOINTS.admin.deleteVideo(videoId))
  }

  // === CONTENT REPORTS ===

  /**
   * Get content reports
   */
  async getReports(params?: {
    status?: 'pending' | 'resolved' | 'dismissed'
    type?: string
    page?: number
  }): Promise<PaginatedResponse<any>> {
    return apiClient.get<PaginatedResponse<any>>(API_ENDPOINTS.admin.reports, { params })
  }

  /**
   * Resolve report
   */
  async resolveReport(reportId: string, data?: {
    action: 'dismiss' | 'warning' | 'suspend' | 'ban'
    reason?: string
  }): Promise<APIResponse> {
    return apiClient.post<APIResponse>(API_ENDPOINTS.admin.resolveReport(reportId), data)
  }

  // === SYSTEM MANAGEMENT ===

  /**
   * Get system logs
   */
  async getLogs(params?: {
    level?: 'debug' | 'info' | 'warning' | 'error'
    component?: string
    date_range?: {
      start: string
      end: string
    }
    page?: number
  }): Promise<PaginatedResponse<any>> {
    return apiClient.get<PaginatedResponse<any>>(API_ENDPOINTS.admin.logs, { params })
  }

  /**
   * Get system maintenance status
   */
  async getMaintenance(): Promise<{
    status: 'normal' | 'maintenance' | 'degraded'
    message?: string
    scheduled_maintenance?: {
      start_time: string
      end_time: string
      description: string
    }
  }> {
    return apiClient.get(API_ENDPOINTS.admin.maintenance)
  }

  /**
   * Update system maintenance
   */
  async updateMaintenance(data: {
    status: 'normal' | 'maintenance' | 'degraded'
    message?: string
  }): Promise<APIResponse> {
    return apiClient.put<APIResponse>(API_ENDPOINTS.admin.maintenance, data)
  }

  // === COMMUNICATION ===

  /**
   * Broadcast message to all users
   */
  async broadcast(data: {
    title: string
    message: string
    type?: 'info' | 'warning' | 'error' | 'success'
    target_audience?: 'all' | 'premium' | 'active'
  }): Promise<APIResponse> {
    return apiClient.post<APIResponse>(API_ENDPOINTS.admin.broadcast, data)
  }

  /**
   * Send notification to specific users
   */
  async sendNotification(data: {
    user_ids: string[]
    title: string
    message: string
    type?: string
    action_url?: string
  }): Promise<APIResponse> {
    return apiClient.post<APIResponse>(API_ENDPOINTS.admin.sendNotification, data)
  }

  // === SETTINGS ===

  /**
   * Get admin settings
   */
  async getSettings(): Promise<Record<string, any>> {
    return apiClient.get(API_ENDPOINTS.admin.settings)
  }

  /**
   * Update admin settings
   */
  async updateSettings(data: Record<string, any>): Promise<APIResponse> {
    return apiClient.put<APIResponse>(API_ENDPOINTS.admin.updateSettings, data)
  }

  // === HEALTH MONITORING ===

  /**
   * Perform health check
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy' | 'degraded'
    services: Record<string, {
      status: 'up' | 'down' | 'degraded'
      response_time?: number
      last_check: string
    }>
  }> {
    return apiClient.get(API_ENDPOINTS.admin.healthCheck)
  }

  /**
   * Get health status
   */
  async getHealthStatus(): Promise<SystemHealth> {
    return apiClient.get<SystemHealth>(API_ENDPOINTS.admin.healthStatus)
  }

  /**
   * Get health metrics
   */
  async getHealthMetrics(): Promise<{
    cpu_usage: number
    memory_usage: number
    disk_usage: number
    active_connections: number
    response_times: Record<string, number>
    error_rates: Record<string, number>
  }> {
    return apiClient.get(API_ENDPOINTS.admin.healthMetrics)
  }

  // === ACTIVITY & ALERTS ===

  /**
   * Get recent system activity
   */
  async getActivity(): Promise<any[]> {
    // Using logs endpoint as a placeholder for activity
    return apiClient.get(API_ENDPOINTS.admin.logs)
  }

  /**
   * Get system alerts
   */
  async getAlerts(): Promise<any[]> {
    // This would need to be implemented in backend
    return apiClient.get('/api/admin/alerts/')
  }

  /**
   * Resolve system alert
   */
  async resolveAlert(alertId: string): Promise<APIResponse> {
    return apiClient.post<APIResponse>(`/api/admin/alerts/${alertId}/resolve/`)
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(): Promise<any[]> {
    // This would need to be implemented in backend
    return apiClient.get('/api/admin/performance/')
  }

  // === ADDITIONAL USER MANAGEMENT ===

  /**
   * Update user status (activate/deactivate)
   */
  async updateUserStatus(userId: string, status: string): Promise<APIResponse> {
    return apiClient.put<APIResponse>(`/api/admin/users/${userId}/status/`, { status })
  }

  /**
   * Update user role
   */
  async updateUserRole(userId: string, role: string): Promise<APIResponse> {
    return apiClient.put<APIResponse>(`/api/admin/users/${userId}/role/`, { role })
  }

  // === SYSTEM LOGS ===

  /**
   * Get system logs (with enhanced parameters)
   */
  async getSystemLogs(params?: {
    level?: string
    component?: string
    search?: string
    date_from?: string
    date_to?: string
    page?: number
  }): Promise<PaginatedResponse<any>> {
    return apiClient.get<PaginatedResponse<any>>('/api/admin/system-logs/', { params })
  }

  /**
   * Get system logs statistics
   */
  async getSystemLogsStats(timeRange?: string): Promise<any> {
    return apiClient.get(`/api/admin/system-logs/stats/`, { 
      params: timeRange ? { time_range: timeRange } : undefined 
    })
  }

  /**
   * Export system logs
   */
  async exportSystemLogs(params?: Record<string, any>): Promise<any> {
    return apiClient.get('/api/admin/system-logs/export/', { params })
  }

  // === MODERATION ===

  /**
   * Get moderation statistics
   */
  async getModerationStats(): Promise<any> {
    return apiClient.get('/api/admin/moderation/stats/')
  }

  // === SETTINGS MANAGEMENT ===

  /**
   * Reset settings to defaults
   */
  async resetSettings(): Promise<APIResponse> {
    return apiClient.post<APIResponse>('/api/admin/settings/reset/')
  }

  /**
   * Test email configuration
   */
  async testEmailSettings(data: { recipient: string }): Promise<APIResponse> {
    return apiClient.post<APIResponse>('/api/admin/settings/test-email/', data)
  }

  // === ANALYTICS EXPORT ===

  /**
   * Export analytics data
   */
  async exportAnalytics(params?: { time_range?: string; format?: string }): Promise<any> {
    return apiClient.get('/api/admin/analytics/export/', { params })
  }
}

// Export the class but don't instantiate it immediately
// Instance will be created by the lazy loader in index.ts
