'use client'

import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useAuthStore } from '@/stores/authStore'
import { useDashboardStore } from '@/stores/dashboardStore'
import { ContainerList } from './ContainerList'
import { NetworkManager } from './NetworkManager'
import { VolumeManager } from './VolumeManager'
import { TemplateManager } from './TemplateManager'
import { Terminal } from './Terminal'
import { Metrics } from './Metrics'
import { Settings } from './Settings'
import { SystemMonitor } from './SystemMonitor'
import { ImageManager } from './ImageManager'
import { FileManager } from './FileManager'
import { ComposeManager } from './ComposeManager'
import { RealTimeMonitor } from './RealTimeMonitor'
import { ProcessManager } from './ProcessManager'
import { OPSECManager } from './OPSECManager'
import { ContainerWorkspace } from './ContainerWorkspace'
import { CommandPalette } from './CommandPalette'
import { DashboardOverview } from './DashboardOverview'
import type { Container } from './ContainerList'
import type { WorkspaceTab } from '@/stores/dashboardStore'

export type TabType = 'containers' | 'networks' | 'volumes' | 'templates' | 'terminal' | 'metrics' | 'images' | 'files' | 'compose' | 'processes' | 'monitor' | 'system' | 'opsec' | 'settings'

export function Dashboard() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { user } = useAuthStore()
  const {
    activeTab,
    setActiveTab,
    workspaceContainer,
    workspaceTab,
    openWorkspace,
    closeWorkspace,
  } = useDashboardStore()

  const handleOpenWorkspace = (container: Container, tab: WorkspaceTab = 'terminal') => {
    openWorkspace(container, tab)
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'containers':
        return (
          <>
            <DashboardOverview />
            <ContainerList
              onShellClick={() => setActiveTab('terminal')}
              onOpenConsole={(container) => handleOpenWorkspace(container, 'terminal')}
              onOpenLogs={(container) => handleOpenWorkspace(container, 'logs')}
            />
          </>
        )
      case 'networks':
        return <NetworkManager />
      case 'volumes':
        return <VolumeManager />
      case 'templates':
        return <TemplateManager />
      case 'terminal':
        return <Terminal />
      case 'metrics':
        return <Metrics />
      case 'images':
        return <ImageManager />
      case 'files':
        return <FileManager />
      case 'compose':
        return <ComposeManager />
      case 'processes':
        return <ProcessManager />
      case 'monitor':
        return <RealTimeMonitor />
      case 'system':
        return <SystemMonitor />
      case 'opsec':
        return <OPSECManager />
      case 'settings':
        return <Settings />
      default:
        return (
          <ContainerList
            onShellClick={() => setActiveTab('terminal')}
            onOpenConsole={(c) => handleOpenWorkspace(c, 'terminal')}
          />
        )
    }
  }

  return (
    <div className="min-h-screen bg-cyber-bg flex">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        <Header onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />

        <main className="flex-1 p-6 overflow-auto cyber-scrollbar">
          {user?.mustChangePassword && (
            <div className="mb-4 p-4 rounded-lg border border-yellow-500/40 bg-yellow-500/10 text-yellow-100">
              <p className="font-medium">Password change required</p>
              <p className="text-sm mt-1 text-yellow-200/90">
                For security, please update your default password in Settings before managing containers.
              </p>
              <button
                onClick={() => setActiveTab('settings')}
                className="mt-3 cyber-button-primary text-sm"
              >
                Go to Settings
              </button>
            </div>
          )}
          {renderContent()}
        </main>
      </div>

      <CommandPalette />

      {workspaceContainer && (
        <ContainerWorkspace
          container={workspaceContainer}
          initialTab={workspaceTab}
          onClose={closeWorkspace}
        />
      )}
    </div>
  )
}
