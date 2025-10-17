'use client'

import { useEffect } from 'react'
import { monitoringService } from '@/lib/monitoring'

export function MonitoringInitializer() {
  useEffect(() => {
    // Initialize monitoring service
    monitoringService.initialize()

    // Track page load
    monitoringService.trackPageLoad(window.location.pathname)

    // Track user actions
    const handleUserAction = (event: Event) => {
      const target = event.target as HTMLElement
      if (target) {
        monitoringService.trackUserAction({
          action: event.type,
          component: target.tagName.toLowerCase(),
          success: true,
        })
      }
    }

    // Add event listeners for user actions
    document.addEventListener('click', handleUserAction)
    document.addEventListener('keydown', handleUserAction)
    document.addEventListener('scroll', handleUserAction)

    // Cleanup
    return () => {
      document.removeEventListener('click', handleUserAction)
      document.removeEventListener('keydown', handleUserAction)
      document.removeEventListener('scroll', handleUserAction)
    }
  }, [])

  return null
}
