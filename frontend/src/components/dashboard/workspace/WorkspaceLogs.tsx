'use client'

import { useEffect, useRef, useState } from 'react'
import { Pause, Play, Trash2 } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

interface WorkspaceLogsProps {
  containerId: string
}

export function WorkspaceLogs({ containerId }: WorkspaceLogsProps) {
  const logRef = useRef<HTMLPreElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const [logs, setLogs] = useState('')
  const [connected, setConnected] = useState(false)
  const [paused, setPaused] = useState(false)
  const pausedRef = useRef(false)
  const { token } = useAuthStore()

  useEffect(() => {
    pausedRef.current = paused
  }, [paused])

  useEffect(() => {
    if (!token) return

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/ws/containers/${containerId}/logs?token=${encodeURIComponent(token)}`
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => setConnected(true)
    ws.onclose = () => setConnected(false)
    ws.onerror = () => setConnected(false)

    ws.onmessage = (event) => {
      if (pausedRef.current) return
      const chunk = typeof event.data === 'string' ? event.data : new TextDecoder().decode(event.data)
      setLogs((prev) => {
        const next = prev + chunk
        return next.length > 500000 ? next.slice(-400000) : next
      })
    }

    return () => {
      ws.close()
    }
  }, [containerId, token])

  useEffect(() => {
    if (!paused && logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [logs, paused])

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-cyber-border bg-cyber-surface/40 shrink-0">
        <div className="flex items-center space-x-2">
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-cyber-neon animate-pulse' : 'bg-gray-500'}`} />
          <span className="text-sm text-gray-400">{connected ? 'Streaming logs' : 'Connecting...'}</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setPaused((p) => !p)}
            className="cyber-button text-xs px-2 py-1"
          >
            {paused ? <Play className="w-3 h-3 mr-1 inline" /> : <Pause className="w-3 h-3 mr-1 inline" />}
            {paused ? 'Resume' : 'Pause'}
          </button>
          <button onClick={() => setLogs('')} className="cyber-button text-xs px-2 py-1">
            <Trash2 className="w-3 h-3 mr-1 inline" />
            Clear
          </button>
        </div>
      </div>
      <pre
        ref={logRef}
        className="flex-1 overflow-auto p-4 text-xs font-mono text-gray-300 bg-black/60 cyber-scrollbar whitespace-pre-wrap break-all"
      >
        {logs || (connected ? 'Waiting for log output...' : 'Connecting to log stream...')}
      </pre>
    </div>
  )
}
