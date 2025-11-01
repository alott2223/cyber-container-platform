'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
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

export type TabType = 'containers' | 'networks' | 'volumes' | 'templates' | 'terminal' | 'metrics' | 'images' | 'files' | 'compose' | 'processes' | 'monitor' | 'system' | 'settings'

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('containers')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const renderContent = () => {
    switch (activeTab) {
      case 'containers':
        return <ContainerList onShellClick={() => setActiveTab('terminal')} />
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
      case 'settings':
        return <Settings />
      default:
        return <ContainerList onShellClick={() => setActiveTab('terminal')} />
    }
  }

  return (
    <div className="min-h-screen bg-cyber-bg flex">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        {/* Header */}
        <Header onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />

        {/* Content Area */}
        <main className="flex-1 p-6 overflow-auto cyber-scrollbar">
          {renderContent()}
        </main>
      </div>
    </div>
  )
}
