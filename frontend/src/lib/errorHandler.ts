interface AppError {
  code: string
  message: string
  details?: string
  timestamp: string
}

interface ErrorContext {
  component?: string
  action?: string
  userId?: string
  requestId?: string
}

class ErrorHandler {
  private errorLog: AppError[] = []
  private maxLogSize = 100

  handleError(error: Error | AppError, context?: ErrorContext): void {
    const errorData: AppError = {
      code: 'code' in error ? error.code : 'UNKNOWN_ERROR',
      message: error.message,
      details: 'details' in error ? error.details : ('stack' in error ? error.stack : undefined),
      timestamp: new Date().toISOString(),
    }

    // Add to error log
    this.addToLog(errorData)

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error occurred:', {
        error: errorData,
        context,
      })
    }

    // Send to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoring(errorData, context)
    }

    // Show user-friendly error message
    this.showUserError(errorData)
  }

  private addToLog(error: AppError): void {
    this.errorLog.unshift(error)
    
    // Keep only the latest errors
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize)
    }
  }

  private sendToMonitoring(error: AppError, context?: ErrorContext): void {
    // In a real enterprise application, this would send to monitoring services
    // like Sentry, DataDog, or New Relic
    try {
      fetch('/api/v1/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error,
          context,
          userAgent: navigator.userAgent,
          url: window.location.href,
        }),
      }).catch(() => {
        // Silently fail if monitoring endpoint is not available
      })
    } catch {
      // Silently fail
    }
  }

  private showUserError(error: AppError): void {
    // Show user-friendly error message based on error code
    const userMessage = this.getUserFriendlyMessage(error.code)
    
    // In a real application, this would show a toast notification
    // or update a global error state
    console.warn('User error:', userMessage)
  }

  private getUserFriendlyMessage(code: string): string {
    const messages: Record<string, string> = {
      'NETWORK_ERROR': 'Network connection failed. Please check your internet connection.',
      'AUTHENTICATION_ERROR': 'Authentication failed. Please log in again.',
      'AUTHORIZATION_ERROR': 'You do not have permission to perform this action.',
      'VALIDATION_ERROR': 'Please check your input and try again.',
      'SERVER_ERROR': 'Server error occurred. Please try again later.',
      'TIMEOUT_ERROR': 'Request timed out. Please try again.',
      'UNKNOWN_ERROR': 'An unexpected error occurred. Please try again.',
    }

    return messages[code] || messages['UNKNOWN_ERROR']
  }

  getErrorLog(): AppError[] {
    return [...this.errorLog]
  }

  clearErrorLog(): void {
    this.errorLog = []
  }

  // Specific error handlers
  handleNetworkError(error: Error, context?: ErrorContext): void {
    this.handleError({
      code: 'NETWORK_ERROR',
      message: error.message,
      timestamp: new Date().toISOString(),
    }, context)
  }

  handleAuthError(error: Error, context?: ErrorContext): void {
    this.handleError({
      code: 'AUTHENTICATION_ERROR',
      message: error.message,
      timestamp: new Date().toISOString(),
    }, context)
  }

  handleValidationError(error: Error, context?: ErrorContext): void {
    this.handleError({
      code: 'VALIDATION_ERROR',
      message: error.message,
      timestamp: new Date().toISOString(),
    }, context)
  }

  handleServerError(error: Error, context?: ErrorContext): void {
    this.handleError({
      code: 'SERVER_ERROR',
      message: error.message,
      timestamp: new Date().toISOString(),
    }, context)
  }
}

export const errorHandler = new ErrorHandler()
export type { AppError, ErrorContext }
