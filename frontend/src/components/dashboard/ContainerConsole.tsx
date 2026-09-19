'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { X, Maximize2, Minimize2, Terminal, Mountain } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import type { Container } from './ContainerList'

interface ContainerConsoleProps {
  container: Container
  onClose: () => void
}

const ALPINE_QUICK_COMMANDS = [
  { label: 'ls -la', cmd: 'ls -la\r' },
  { label: 'OS Info', cmd: 'cat /etc/os-release\r' },
  { label: 'Processes', cmd: 'ps aux\r' },
  { label: 'Disk', cmd: 'df -h\r' },
  { label: 'Network', cmd: 'ip addr 2>/dev/null || ifconfig\r' },
  { label: 'OPSEC Baseline', cmd: '/opsec/scripts/opsec-baseline.sh 2>/dev/null || echo OPSEC scripts not mounted\r' },
]

export function ContainerConsole({ container, onClose }: ContainerConsoleProps) {
  const terminalRef = useRef<HTMLDivElement>(null)
  const xtermRef = useRef<any>(null)
  const fitAddonRef = useRef<any>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { token } = useAuthStore()

  const isAlpine = container.image?.toLowerCase().includes('alpine')
  const isRunning = container.state === 'running'

  const toggleFullscreen = useCallback(() => {
    const el = document.getElementById('container-console-root')
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
    if (!isRunning || !token) {
      setError(isRunning ? 'Not authenticated' : 'Container must be running to open console')
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
      cleanupPromise?.then((fn) => fn?.())
    }
  }, [container.id, isRunning, token, sendResize])

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

  return (
    <div
      id="container-console-root"
      className={`fixed inset-0 z-50 flex flex-col bg-cyber-bg ${
        isFullscreen ? '' : 'p-4 bg-black/80 backdrop-blur-sm'
      }`}
    >
      <div className={`flex flex-col h-full ${isFullscreen ? '' : 'cyber-card overflow-hidden max-w-7xl mx-auto w-full'}`}>
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
            <span className={`shrink-0 w-2 h-2 rounded-full ${connected ? 'bg-cyber-neon animate-pulse' : 'bg-gray-500'}`} />
            <span className="text-xs text-gray-400 shrink-0">{connected ? 'Live' : 'Connecting...'}</span>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <button onClick={toggleFullscreen} className="cyber-button p-2" title="Toggle fullscreen">
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button onClick={onClose} className="cyber-button p-2 text-cyber-error border-cyber-error/50" title="Close (Esc)">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Alpine quick actions */}
        {isAlpine && isRunning && (
          <div className="px-4 py-2 border-b border-cyber-border bg-cyber-surface/40 flex flex-wrap gap-2 shrink-0">
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

        {error && (
          <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/30 text-red-300 text-sm shrink-0">
            {error}
          </div>
        )}

        {/* xterm container */}
        <div className="flex-1 min-h-0 p-2 bg-black">
          <div ref={terminalRef} className="h-full w-full xterm" />
        </div>

        <div className="px-4 py-2 border-t border-cyber-border bg-cyber-surface/50 text-xs text-gray-500 shrink-0">
          Interactive shell — type commands directly. Press <kbd className="text-cyber-accent">F11</kbd> or use the maximize button for fullscreen.
        </div>
      </div>
    </div>
  )
}
