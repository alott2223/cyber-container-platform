import { useAuthStore } from '@/stores/authStore'
import { errorHandler } from './errorHandler'
import { monitoringService } from './monitoring'

const API_BASE_URL = 'http://localhost:8080/api/v1'

// Add request timeout
const REQUEST_TIMEOUT = 10000 // 10 seconds

// Add retry mechanism for failed requests
const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second

class ApiClient {
  private getAuthHeaders(): HeadersInit {
    const token = useAuthStore.getState().token
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    }
  }

  async get(endpoint: string): Promise<Response> {
    return this.makeRequest('GET', endpoint)
  }

  async post(endpoint: string, data?: any): Promise<Response> {
    return this.makeRequest('POST', endpoint, data)
  }

  async put(endpoint: string, data?: any): Promise<Response> {
    return this.makeRequest('PUT', endpoint, data)
  }

  async delete(endpoint: string): Promise<Response> {
    return this.makeRequest('DELETE', endpoint)
  }

  private async makeRequest(method: string, endpoint: string, data?: any): Promise<Response> {
    const startTime = performance.now()
    
    try {
      const response = await monitoringService.measureAsyncPerformance(
        `api.${method.toLowerCase()}`,
        async () => {
          return fetch(`${API_BASE_URL}${endpoint}`, {
            method,
            headers: this.getAuthHeaders(),
            body: data ? JSON.stringify(data) : undefined,
          })
        }
      )

      const duration = performance.now() - startTime
      const success = response.ok

      // Track API call metrics
      monitoringService.trackApiCall(
        endpoint,
        method,
        duration,
        success,
        response.status
      )

      // Handle errors
      if (!success) {
        const errorData = await response.json().catch(() => ({}))
        errorHandler.handleServerError(
          new Error(errorData.message || `HTTP ${response.status}`),
          { component: 'api', action: `${method} ${endpoint}` }
        )
      }

      return response
    } catch (error) {
      const duration = performance.now() - startTime
      
      // Track failed API call
      monitoringService.trackApiCall(
        endpoint,
        method,
        duration,
        false
      )

      // Handle network errors
      errorHandler.handleNetworkError(
        error instanceof Error ? error : new Error('Network error'),
        { component: 'api', action: `${method} ${endpoint}` }
      )

      throw error
    }
  }
}

export const apiClient = new ApiClient()
