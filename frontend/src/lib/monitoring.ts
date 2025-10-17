interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  tags?: Record<string, string>
}

interface UserAction {
  action: string
  component: string
  timestamp: number
  duration?: number
  success: boolean
  error?: string
}

class MonitoringService {
  private metrics: PerformanceMetric[] = []
  private userActions: UserAction[] = []
  private maxLogSize = 1000

  // Performance monitoring
  measurePerformance(name: string, fn: () => void): void {
    const start = performance.now()
    try {
      fn()
      const duration = performance.now() - start
      this.recordMetric({
        name: `performance.${name}`,
        value: duration,
        timestamp: Date.now(),
        tags: { success: 'true' },
      })
    } catch (error) {
      const duration = performance.now() - start
      this.recordMetric({
        name: `performance.${name}`,
        value: duration,
        timestamp: Date.now(),
        tags: { success: 'false', error: error instanceof Error ? error.message : 'unknown' },
      })
      throw error
    }
  }

  async measureAsyncPerformance<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now()
    try {
      const result = await fn()
      const duration = performance.now() - start
      this.recordMetric({
        name: `performance.${name}`,
        value: duration,
        timestamp: Date.now(),
        tags: { success: 'true' },
      })
      return result
    } catch (error) {
      const duration = performance.now() - start
      this.recordMetric({
        name: `performance.${name}`,
        value: duration,
        timestamp: Date.now(),
        tags: { success: 'false', error: error instanceof Error ? error.message : 'unknown' },
      })
      throw error
    }
  }

  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric)
    
    // Keep only the latest metrics
    if (this.metrics.length > this.maxLogSize) {
      this.metrics = this.metrics.slice(-this.maxLogSize)
    }

    // Send to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendMetricToService(metric)
    }
  }

  // User action tracking
  trackUserAction(action: Omit<UserAction, 'timestamp'>): void {
    const userAction: UserAction = {
      ...action,
      timestamp: Date.now(),
    }

    this.userActions.push(userAction)
    
    // Keep only the latest actions
    if (this.userActions.length > this.maxLogSize) {
      this.userActions = this.userActions.slice(-this.maxLogSize)
    }

    // Send to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendActionToService(userAction)
    }
  }

  // Page load monitoring
  trackPageLoad(page: string): void {
    if (typeof window !== 'undefined' && window.performance) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      
      if (navigation) {
        this.recordMetric({
          name: 'page.load_time',
          value: navigation.loadEventEnd - navigation.fetchStart,
          timestamp: Date.now(),
          tags: { page },
        })

        this.recordMetric({
          name: 'page.dom_content_loaded',
          value: navigation.domContentLoadedEventEnd - navigation.fetchStart,
          timestamp: Date.now(),
          tags: { page },
        })

        this.recordMetric({
          name: 'page.first_paint',
          value: navigation.responseEnd - navigation.fetchStart,
          timestamp: Date.now(),
          tags: { page },
        })
      }
    }
  }

  // API call monitoring
  trackApiCall(endpoint: string, method: string, duration: number, success: boolean, statusCode?: number): void {
    this.recordMetric({
      name: 'api.call_duration',
      value: duration,
      timestamp: Date.now(),
      tags: {
        endpoint,
        method,
        success: success.toString(),
        status_code: statusCode?.toString() || 'unknown',
      },
    })
  }

  // Error tracking
  trackError(error: Error, context?: Record<string, string>): void {
    this.recordMetric({
      name: 'error.count',
      value: 1,
      timestamp: Date.now(),
      tags: {
        error_type: error.name,
        error_message: error.message,
        ...context,
      },
    })
  }

  // Memory usage monitoring
  trackMemoryUsage(): void {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory
      if (memory) {
        this.recordMetric({
          name: 'memory.used_heap',
          value: memory.usedJSHeapSize,
          timestamp: Date.now(),
        })

        this.recordMetric({
          name: 'memory.total_heap',
          value: memory.totalJSHeapSize,
          timestamp: Date.now(),
        })

        this.recordMetric({
          name: 'memory.heap_limit',
          value: memory.jsHeapSizeLimit,
          timestamp: Date.now(),
        })
      }
    }
  }

  // Send data to monitoring service
  private sendMetricToService(metric: PerformanceMetric): void {
    try {
      fetch('/api/v1/metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metric),
      }).catch(() => {
        // Silently fail if monitoring endpoint is not available
      })
    } catch {
      // Silently fail
    }
  }

  private sendActionToService(action: UserAction): void {
    try {
      fetch('/api/v1/actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(action),
      }).catch(() => {
        // Silently fail if monitoring endpoint is not available
      })
    } catch {
      // Silently fail
    }
  }

  // Get metrics for debugging
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics]
  }

  getUserActions(): UserAction[] {
    return [...this.userActions]
  }

  // Clear data
  clearMetrics(): void {
    this.metrics = []
  }

  clearUserActions(): void {
    this.userActions = []
  }

  // Initialize monitoring
  initialize(): void {
    // Track page load
    if (typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        this.trackPageLoad(window.location.pathname)
      })

      // Track memory usage periodically
      setInterval(() => {
        this.trackMemoryUsage()
      }, 30000) // Every 30 seconds

      // Track page visibility changes
      document.addEventListener('visibilitychange', () => {
        this.trackUserAction({
          action: 'page_visibility_change',
          component: 'document',
          success: true,
        })
      })
    }
  }
}

export const monitoringService = new MonitoringService()
export type { PerformanceMetric, UserAction }
