'use client'

import { useState } from 'react'
import { Menu, Bell, User, LogOut, Search, Command } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useDashboardStore } from '@/stores/dashboardStore'
import { toast } from 'react-hot-toast'

interface HeaderProps {
  onToggleSidebar: () => void
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const { user, logout } = useAuthStore()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const { setCommandPaletteOpen, globalSearch, setGlobalSearch } = useDashboardStore()

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
  }

  const openPalette = () => setCommandPaletteOpen(true)

  return (
    <header className="bg-cyber-surface/80 backdrop-blur-sm border-b border-cyber-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onToggleSidebar}
            className="p-2 hover:bg-cyber-surface/50 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="relative group">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search containers, networks..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              onFocus={openPalette}
              onClick={openPalette}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || (e.ctrlKey && e.key === 'k')) {
                  e.preventDefault()
                  openPalette()
                }
              }}
              className="cyber-input pl-10 pr-20 w-80 cursor-pointer"
              readOnly
            />
            <button
              onClick={openPalette}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1 text-xs text-gray-500 hover:text-cyber-accent transition-colors"
            >
              <Command className="w-3 h-3" />
              <span className="hidden sm:inline">Ctrl+K</span>
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={openPalette}
            className="p-2 hover:bg-cyber-surface/50 rounded-lg transition-colors"
            title="Command palette (Ctrl+K)"
          >
            <Command className="w-5 h-5 text-cyber-accent" />
          </button>

          <button className="p-2 hover:bg-cyber-surface/50 rounded-lg transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-cyber-error rounded-full"></span>
          </button>

          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 p-2 hover:bg-cyber-surface/50 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-cyber-accent to-cyber-neon rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-black" />
              </div>
              <span className="text-sm font-medium">{user?.username}</span>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 cyber-card p-2 z-50">
                <div className="px-3 py-2 border-b border-cyber-border">
                  <p className="text-sm font-medium">{user?.username}</p>
                  <p className="text-xs text-gray-400">Administrator</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-400 hover:text-cyber-error hover:bg-cyber-surface/50 rounded transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
