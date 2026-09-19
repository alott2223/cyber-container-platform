import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  isAuthenticated: boolean
  token: string | null
  user: { username: string; role?: string; mustChangePassword?: boolean } | null
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  setLoading: (loading: boolean) => void
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      token: null,
      user: null,
      isLoading: false,

      login: async (username: string, password: string) => {
        set({ isLoading: true })
        
        try {
          const response = await fetch('/api/v1/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
          })

          if (!response.ok) {
            throw new Error('Login failed')
          }

          const data = await response.json()
          
          set({
            isAuthenticated: true,
            token: data.token,
            user: data.user || { username },
            isLoading: false,
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      changePassword: async (currentPassword: string, newPassword: string) => {
        const token = get().token
        const response = await fetch('/api/v1/auth/change-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify({
            current_password: currentPassword,
            new_password: newPassword,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to change password')
        }

        set({
          user: {
            ...get().user!,
            mustChangePassword: false,
          },
        })
      },

      logout: () => {
        set({
          isAuthenticated: false,
          token: null,
          user: null,
          isLoading: false,
        })
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },
    }),
    {
      name: 'cyber-auth-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        token: state.token,
        user: state.user,
        isLoading: false,
      }),
    }
  )
)
