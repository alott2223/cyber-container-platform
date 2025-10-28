'use client'

import { useEffect, useState } from 'react'
import { LoginForm } from '@/components/auth/LoginForm'
import { Dashboard } from '@/components/dashboard/Dashboard'
import { useAuthStore } from '@/stores/authStore'

export default function Home() {
  const { isAuthenticated, isLoading } = useAuthStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  console.log('Page render - isAuthenticated:', isAuthenticated, 'isLoading:', isLoading, 'mounted:', mounted)

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-cyber-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-neon mx-auto mb-4"></div>
          <p className="text-gray-400">Initializing Cyber Platform...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginForm />
  }

  return <Dashboard />
}
