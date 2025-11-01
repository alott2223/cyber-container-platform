'use client'

import { 
  Container, 
  Network, 
  HardDrive, 
  FileText, 
  Terminal, 
  BarChart3, 
  Settings, 
  ChevronLeft,
  ChevronRight,
  Zap,
  Activity,
  Image,
  Folder,
  Layers,
  Cpu,
  Monitor
} from 'lucide-react'
import { TabType } from './Dashboard'

interface SidebarProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  collapsed: boolean
  onToggle: () => void
}

const tabs = [
  { id: 'containers' as TabType, label: 'Containers', icon: Container },
  { id: 'networks' as TabType, label: 'Networks', icon: Network },
  { id: 'volumes' as TabType, label: 'Volumes', icon: HardDrive },
  { id: 'templates' as TabType, label: 'Templates', icon: FileText },
  { id: 'terminal' as TabType, label: 'Terminal', icon: Terminal },
  { id: 'metrics' as TabType, label: 'Metrics', icon: BarChart3 },
  { id: 'images' as TabType, label: 'Images', icon: Image },
  { id: 'files' as TabType, label: 'Files', icon: Folder },
  { id: 'compose' as TabType, label: 'Compose', icon: Layers },
  { id: 'processes' as TabType, label: 'Processes', icon: Cpu },
  { id: 'monitor' as TabType, label: 'Monitor', icon: Monitor },
  { id: 'system' as TabType, label: 'System', icon: Activity },
  { id: 'settings' as TabType, label: 'Settings', icon: Settings },
]

export function Sidebar({ activeTab, onTabChange, collapsed, onToggle }: SidebarProps) {
  return (
    <div className={`fixed left-0 top-0 h-full bg-cyber-surface/90 backdrop-blur-sm border-r border-cyber-border transition-all duration-300 z-40 ${collapsed ? 'w-16' : 'w-64'}`}>
      {/* Header */}
      <div className="p-4 border-b border-cyber-border">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-cyber-accent to-cyber-neon rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-black" />
              </div>
              <span className="text-lg font-cyber font-bold text-gradient">CYBER</span>
            </div>
          )}
          <button
            onClick={onToggle}
            className="p-2 hover:bg-cyber-surface/50 rounded-lg transition-colors"
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 group ${
                isActive
                  ? 'bg-cyber-accent/20 text-cyber-accent border border-cyber-accent/30'
                  : 'text-gray-400 hover:text-white hover:bg-cyber-surface/50'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-cyber-accent' : 'text-gray-400 group-hover:text-white'}`} />
              {!collapsed && (
                <span className="font-medium">{tab.label}</span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Status Indicator */}
      {!collapsed && (
        <div className="absolute bottom-4 left-4 right-4">
          <div className="cyber-card p-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-cyber-neon rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-400">System Online</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Docker Engine Connected
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
