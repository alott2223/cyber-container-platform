import { useAuthStore } from '@/stores/authStore'

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
    return fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    })
  }

  async post(endpoint: string, data?: any): Promise<Response> {
    return fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put(endpoint: string, data?: any): Promise<Response> {
    return fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete(endpoint: string): Promise<Response> {
    return fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    })
  }
}

export const apiClient = new ApiClient()
