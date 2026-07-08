'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from 'react-query'
import {
  Search, Container, Network, HardDrive, Terminal, Shield, Settings,
  Plus, Maximize2, ScrollText, Activity, Folder,
} from 'lucide-react'
import { apiClient } from '@/lib/api'
import { useDashboardStore, type WorkspaceTab } from '@/stores/dashboardStore'
import type { TabType } from './Dashboard'
import type { Container as ContainerType } from './ContainerList'

interface CommandItem {
  id: string
  label: string
  description?: string
  icon: typeof Search
  category: 'navigation' | 'container' | 'action'
  action: () => void
}

export function CommandPalette() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    setActiveTab,
    openWorkspace,
    globalSearch,
    setGlobalSearch,
  } = useDashboardStore()

  const { data: containers = [] } = useQuery<ContainerType[]>(
    'containers',
    async () => {
      const response = await apiClient.get('/containers')
      if (!response.ok) return []
      const data = await response.json()
      return data.containers || []
    },
    { enabled: commandPaletteOpen }
  )

  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery(globalSearch)
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [commandPaletteOpen, globalSearch])

  const navigate = (tab: TabType) => {
    setActiveTab(tab)
    setCommandPaletteOpen(false)
    setGlobalSearch('')
  }

  const openContainerWorkspace = (container: ContainerType, tab: WorkspaceTab = 'terminal') => {
    openWorkspace(container, tab)
    setCommandPaletteOpen(false)
    setGlobalSearch('')
  }

  const navItems: CommandItem[] = [
    { id: 'nav-containers', label: 'Go to Containers', icon: Container, category: 'navigation', action: () => navigate('containers') },
    { id: 'nav-networks', label: 'Go to Networks', icon: Network, category: 'navigation', action: () => navigate('networks') },
    { id: 'nav-volumes', label: 'Go to Volumes', icon: HardDrive, category: 'navigation', action: () => navigate('volumes') },
    { id: 'nav-terminal', label: 'Go to Terminal', icon: Terminal, category: 'navigation', action: () => navigate('terminal') },
    { id: 'nav-opsec', label: 'Go to OPSEC Manager', icon: Shield, category: 'navigation', action: () => navigate('opsec') },
    { id: 'nav-settings', label: 'Go to Settings', icon: Settings, category: 'navigation', action: () => navigate('settings') },
    { id: 'nav-files', label: 'Go to File Manager', icon: Folder, category: 'navigation', action: () => navigate('files') },
  ]

  const containerItems: CommandItem[] = containers.flatMap((c) => {
    const items: CommandItem[] = [
      {
        id: `ws-${c.id}`,
        label: `Open workspace: ${c.name}`,
        description: c.image,
        icon: Maximize2,
        category: 'container',
        action: () => openContainerWorkspace(c, 'terminal'),
      },
    ]
    if (c.state === 'running') {
      items.push(
        {
          id: `logs-${c.id}`,
          label: `View logs: ${c.name}`,
          description: 'Live log stream',
          icon: ScrollText,
          category: 'container',
          action: () => openContainerWorkspace(c, 'logs'),
        },
        {
          id: `monitor-${c.id}`,
          label: `Monitor: ${c.name}`,
          description: 'CPU & memory charts',
          icon: Activity,
          category: 'container',
          action: () => openContainerWorkspace(c, 'monitor'),
        }
      )
    }
    return items
  })

  const allItems = useMemo(() => {
    const q = query.toLowerCase().trim()
    const items = [...navItems, ...containerItems]
    if (!q) return items
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q)
    )
  }, [query, containers])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(!commandPaletteOpen)
      }
      if (!commandPaletteOpen) return

      if (e.key === 'Escape') {
        setCommandPaletteOpen(false)
        setGlobalSearch('')
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((i) => Math.min(i + 1, allItems.length - 1))
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((i) => Math.max(i - 1, 0))
      }
      if (e.key === 'Enter' && allItems[selectedIndex]) {
        e.preventDefault()
        allItems[selectedIndex].action()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [commandPaletteOpen, allItems, selectedIndex, setCommandPaletteOpen, setGlobalSearch])

  if (!commandPaletteOpen) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh] bg-black/70 backdrop-blur-sm"
      onClick={() => { setCommandPaletteOpen(false); setGlobalSearch('') }}
    >
      <div
        className="w-full max-w-xl cyber-card overflow-hidden shadow-2xl shadow-cyber-accent/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-3 border-b border-cyber-border">
          <Search className="w-5 h-5 text-cyber-accent mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setGlobalSearch(e.target.value)
            }}
            placeholder="Search containers, navigate, run actions..."
            className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-sm"
          />
          <kbd className="text-xs text-gray-500 border border-cyber-border rounded px-1.5 py-0.5">Esc</kbd>
        </div>

        <div className="max-h-80 overflow-y-auto cyber-scrollbar">
          {allItems.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500 text-sm">No results found</div>
          ) : (
            allItems.map((item, index) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 text-left transition-colors ${
                    index === selectedIndex ? 'bg-cyber-accent/15 text-white' : 'text-gray-300 hover:bg-cyber-surface/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${index === selectedIndex ? 'text-cyber-accent' : 'text-gray-500'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{item.label}</p>
                    {item.description && (
                      <p className="text-xs text-gray-500 truncate">{item.description}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-600 capitalize shrink-0">{item.category}</span>
                </button>
              )
            })
          )}
        </div>

        <div className="px-4 py-2 border-t border-cyber-border bg-cyber-surface/30 flex items-center justify-between text-xs text-gray-500">
          <span>
            <kbd className="text-cyber-accent">↑↓</kbd> navigate
            <span className="mx-2">·</span>
            <kbd className="text-cyber-accent">Enter</kbd> select
          </span>
          <span>{allItems.length} results</span>
        </div>
      </div>
    </div>
  )
}
