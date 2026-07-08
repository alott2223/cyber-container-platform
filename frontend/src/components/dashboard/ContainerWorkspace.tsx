'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  X, Maximize2, Minimize2, Terminal, Mountain, Folder, ScrollText,
  Activity, Shield, PanelLeftClose, PanelLeftOpen,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useDashboardStore, type WorkspaceTab } from '@/stores/dashboardStore'
import type { Container } from './ContainerList'
import { WorkspaceFiles } from './workspace/WorkspaceFiles'
import { WorkspaceLogs } from './workspace/WorkspaceLogs'
import { WorkspaceMonitor } from './workspace/WorkspaceMonitor'
import { WorkspaceOPSEC } from './workspace/WorkspaceOPSEC'

interface ContainerWorkspaceProps {
  container: Container
  initialTab?: WorkspaceTab
  onClose: () => void
}

const ALPINE_QUICK_COMMANDS = [
  { label: 'ls -la', cmd: 'ls -la\r' },
  { label: 'OS Info', cmd: 'cat /etc/os-release\r' },
  { label: 'Processes', cmd: 'ps aux\r' },
  { label: 'Disk', cmd: 'df -h\r' },
  { label: 'Network', cmd: 'ip addr 2>/dev/null || ifconfig\r' },
  { label: 'OPSEC', cmd: '/opsec/scripts/opsec-baseline.sh 2>/dev/null || echo OPSEC scripts not mounted\r' },
]

const TABS: { id: WorkspaceTab; label: string; icon: typeof Terminal }[] = [
  { id: 'terminal', label: 'Terminal', icon: Terminal },
  { id: 'files', label: 'Files', icon: Folder },
  { id: 'logs', label: 'Logs', icon: ScrollText },
  { id: 'monitor', label: 'Monitor', icon: Activity },
  { id: 'opsec', label: 'OPSEC', icon: Shield },
]

export function ContainerWorkspace({ container, initialTab = 'terminal', onClose }: ContainerWorkspaceProps) {
  const terminalRef = useRef<HTMLDivElement>(null)
  const xtermRef = useRef<any>(null)
  const fitAddonRef = useRef<any>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showFilePanel, setShowFilePanel] = useState(true)
  const { token } = useAuthStore()
  const { workspaceTab, setWorkspaceTab } = useDashboardStore()

  const isAlpine = container.image?.toLowerCase().includes('alpine')
  const isRunning = container.state === 'running'

  useEffect(() => {
    setWorkspaceTab(initialTab)
  }, [initialTab, setWorkspaceTab])

  const toggleFullscreen = useCallback(() => {
    const el = document.getElementById('container-workspace-root')
    if (!document.fullscreenElement && el?.requestFullscreen) {
      el.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => setIsFullscreen(true))
    } else if (document.fullscreenElement) {
      document.exitFullscreen().then(() => setIsFullscreen(false))
    } else {
      setIsFullscreen((v) => !v)
    }
  }, [])

  const sendCommand = useCallback((cmd: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(cmd)
    }
  }, [])

  const sendResize = useCallback(() => {
    if (!xtermRef.current || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return
    wsRef.current.send(JSON.stringify({
      type: 'resize',
      cols: xtermRef.current.cols,
      rows: xtermRef.current.rows,
    }))
  }, [])

  useEffect(() => {
    if (workspaceTab !== 'terminal' || !isRunning || !token) {
      if (workspaceTab === 'terminal') {
        setError(isRunning ? 'Not authenticated' : 'Container must be running for terminal')
      }
      return
    }

    let disposed = false

    const init = async () => {
      const { Terminal } = await import('@xterm/xterm')
      const { FitAddon } = await import('@xterm/addon-fit')
      const { WebLinksAddon } = await import('@xterm/addon-web-links')

      if (disposed || !terminalRef.current) return

      const term = new Terminal({
        cursorBlink: true,
        fontSize: 14,
        fontFamily: 'JetBrains Mono, Consolas, monospace',
        theme: {
          background: '#0a0e17',
          foreground: '#00ff88',
          cursor: '#00ffff',
          selectionBackground: '#1a3a4a',
          black: '#0a0e17',
          green: '#00ff88',
          cyan: '#00ffff',
          white: '#e0e0e0',
        },
        allowProposedApi: true,
      })

      const fitAddon = new FitAddon()
      term.loadAddon(fitAddon)
      term.loadAddon(new WebLinksAddon())
      term.open(terminalRef.current)
      fitAddon.fit()

      xtermRef.current = term
      fitAddonRef.current = fitAddon

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const wsUrl = `${protocol}//${window.location.host}/ws/containers/${container.id}/exec?token=${encodeURIComponent(token)}`
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        setConnected(true)
        setError(null)
        sendResize()
        term.focus()
      }

      ws.onmessage = (event) => {
        term.write(typeof event.data === 'string' ? event.data : new TextDecoder().decode(event.data))
      }

      ws.onerror = () => {
        setError('WebSocket connection failed')
        setConnected(false)
      }

      ws.onclose = () => {
        setConnected(false)
        term.writeln('\r\n\x1b[90m[disconnected]\x1b[0m')
      }

      term.onData((data) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(data)
        }
      })

      const onResize = () => {
        fitAddon.fit()
        sendResize()
      }
      window.addEventListener('resize', onResize)

      return () => {
        window.removeEventListener('resize', onResize)
      }
    }

    const cleanupPromise = init()

    return () => {
      disposed = true
      wsRef.current?.close()
      xtermRef.current?.dispose()
      xtermRef.current = null
      cleanupPromise?.then((fn) => fn?.())
    }
  }, [container.id, isRunning, token, sendResize, workspaceTab])

  useEffect(() => {
    if (workspaceTab === 'terminal' && fitAddonRef.current) {
      setTimeout(() => fitAddonRef.current?.fit(), 100)
    }
  }, [workspaceTab, showFilePanel])

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.fullscreenElement) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const renderTabContent = () => {
    switch (workspaceTab) {
      case 'terminal':
        return (
          <div className={`flex flex-1 min-h-0 ${showFilePanel ? 'flex-row' : 'flex-col'}`}>
            {showFilePanel && (
              <div className="w-64 shrink-0 border-r border-cyber-border bg-cyber-surface/30 overflow-hidden flex flex-col">
                <WorkspaceFiles
                  containerId={container.id}
                  compact
                  onNavigate={(path) => sendCommand(`cd ${path} && ls -la\r`)}
                />
              </div>
            )}
            <div className="flex-1 min-h-0 flex flex-col">
              {isAlpine && isRunning && (
                <div className="px-3 py-2 border-b border-cyber-border bg-cyber-surface/40 flex flex-wrap gap-2 shrink-0">
                  <span className="text-xs text-cyber-accent self-center mr-1">Alpine:</span>
                  {ALPINE_QUICK_COMMANDS.map((item) => (
                    <button
                      key={item.label}
                      onClick={() => sendCommand(item.cmd)}
                      disabled={!connected}
                      className="text-xs px-2 py-1 rounded bg-cyber-surface border border-cyber-border text-gray-300 hover:text-cyber-accent hover:border-cyber-accent/50 disabled:opacity-40 transition-colors"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex-1 min-h-0 p-2 bg-black">
                <div ref={terminalRef} className="h-full w-full xterm" />
              </div>
            </div>
          </div>
        )
      case 'files':
        return <WorkspaceFiles containerId={container.id} />
      case 'logs':
        return <WorkspaceLogs containerId={container.id} />
      case 'monitor':
        return <WorkspaceMonitor containerId={container.id} />
      case 'opsec':
        return (
          <WorkspaceOPSEC
            container={container}
            onRunCommand={(cmd) => {
              setWorkspaceTab('terminal')
              setTimeout(() => sendCommand(cmd), 600)
            }}
            connected={connected}
          />
        )
      default:
        return null
    }
  }

  return (
    <div
      id="container-workspace-root"
      className={`fixed inset-0 z-50 flex flex-col bg-cyber-bg ${
        isFullscreen ? '' : 'p-4 bg-black/80 backdrop-blur-sm'
      }`}
    >
      <div className={`flex flex-col h-full ${isFullscreen ? '' : 'cyber-card overflow-hidden max-w-[96rem] mx-auto w-full'}`}>
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-cyber-border bg-cyber-surface/90 shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            {isAlpine ? (
              <Mountain className="w-5 h-5 text-cyber-accent shrink-0" />
            ) : (
              <Terminal className="w-5 h-5 text-cyber-accent shrink-0" />
            )}
            <div className="min-w-0">
              <h2 className="text-white font-medium truncate">{container.name}</h2>
              <p className="text-xs text-gray-400 truncate">{container.image}</p>
            </div>
            {workspaceTab === 'terminal' && (
              <>
                <span className={`shrink-0 w-2 h-2 rounded-full ${connected ? 'bg-cyber-neon animate-pulse' : 'bg-gray-500'}`} />
                <span className="text-xs text-gray-400 shrink-0">{connected ? 'Live' : 'Connecting...'}</span>
              </>
            )}
          </div>

          {/* Tab bar */}
          <div className="hidden md:flex items-center space-x-1 mx-4">
            {TABS.map((tab) => {
              const Icon = tab.icon
              const active = workspaceTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setWorkspaceTab(tab.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    active
                      ? 'bg-cyber-accent/20 text-cyber-accent border border-cyber-accent/30'
                      : 'text-gray-400 hover:text-white hover:bg-cyber-surface/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {workspaceTab === 'terminal' && (
              <button
                onClick={() => setShowFilePanel((v) => !v)}
                className="cyber-button p-2 hidden md:block"
                title="Toggle file panel"
              >
                {showFilePanel ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
              </button>
            )}
            <button onClick={toggleFullscreen} className="cyber-button p-2" title="Toggle fullscreen">
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button onClick={onClose} className="cyber-button p-2 text-cyber-error border-cyber-error/50" title="Close (Esc)">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile tabs */}
        <div className="flex md:hidden items-center space-x-1 px-3 py-2 border-b border-cyber-border bg-cyber-surface/50 overflow-x-auto shrink-0">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const active = workspaceTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setWorkspaceTab(tab.id)}
                className={`flex items-center space-x-1 px-2 py-1 rounded text-xs whitespace-nowrap ${
                  active ? 'bg-cyber-accent/20 text-cyber-accent' : 'text-gray-400'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {error && workspaceTab === 'terminal' && (
          <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/30 text-red-300 text-sm shrink-0">
            {error}
          </div>
        )}

        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {renderTabContent()}
        </div>

        <div className="px-4 py-2 border-t border-cyber-border bg-cyber-surface/50 text-xs text-gray-500 shrink-0 flex justify-between">
          <span>
            Workspace — <kbd className="text-cyber-accent">Esc</kbd> close, <kbd className="text-cyber-accent">Ctrl+K</kbd> command palette
          </span>
          <span className="text-gray-600">{container.id.slice(0, 12)}</span>
        </div>
      </div>
    </div>
  )
}
