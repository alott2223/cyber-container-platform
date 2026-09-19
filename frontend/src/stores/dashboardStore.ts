import { create } from 'zustand'
import type { Container } from '@/components/dashboard/ContainerList'
import type { TabType } from '@/components/dashboard/Dashboard'

export type WorkspaceTab = 'terminal' | 'files' | 'logs' | 'monitor' | 'opsec'

interface DashboardState {
  commandPaletteOpen: boolean
  setCommandPaletteOpen: (open: boolean) => void
  workspaceContainer: Container | null
  workspaceTab: WorkspaceTab
  openWorkspace: (container: Container, tab?: WorkspaceTab) => void
  closeWorkspace: () => void
  setWorkspaceTab: (tab: WorkspaceTab) => void
  activeTab: TabType
  setActiveTab: (tab: TabType) => void
  globalSearch: string
  setGlobalSearch: (q: string) => void
}

export const useDashboardStore = create<DashboardState>((set) => ({
  commandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  workspaceContainer: null,
  workspaceTab: 'terminal',
  openWorkspace: (container, tab = 'terminal') =>
    set({ workspaceContainer: container, workspaceTab: tab }),
  closeWorkspace: () => set({ workspaceContainer: null }),
  setWorkspaceTab: (tab) => set({ workspaceTab: tab }),
  activeTab: 'containers',
  setActiveTab: (tab) => set({ activeTab: tab }),
  globalSearch: '',
  setGlobalSearch: (q) => set({ globalSearch: q }),
}))
