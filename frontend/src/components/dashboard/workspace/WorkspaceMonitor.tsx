'use client'

import { useEffect, useRef, useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useAuthStore } from '@/stores/authStore'

interface WorkspaceMonitorProps {
  containerId: string
}

interface StatsPoint {
  time: string
  cpu: number
  memoryMB: number
  netRx: number
  netTx: number
}

function parseStats(raw: string): StatsPoint | null {
  try {
    const data = JSON.parse(raw)
    if (data.error) return null

    const cpuDelta = data.cpu_stats?.cpu_usage?.total_usage - (data.precpu_stats?.cpu_usage?.total_usage || 0)
    const systemDelta = data.cpu_stats?.system_cpu_usage - (data.precpu_stats?.system_cpu_usage || 0)
    const cpuCount = data.cpu_stats?.online_cpus || 1
    const cpuPercent = systemDelta > 0 ? (cpuDelta / systemDelta) * cpuCount * 100 : 0

    const memUsage = data.memory_stats?.usage || 0
    const memMB = memUsage / (1024 * 1024)

    const networks = (data.networks || {}) as Record<string, { rx_bytes?: number; tx_bytes?: number }>
    const netRx = Object.values(networks).reduce((sum, n) => sum + (n.rx_bytes || 0), 0) / 1024
    const netTx = Object.values(networks).reduce((sum, n) => sum + (n.tx_bytes || 0), 0) / 1024

    return {
      time: new Date().toLocaleTimeString(),
      cpu: Math.max(0, Math.min(100, cpuPercent)),
      memoryMB: Math.round(memMB * 10) / 10,
      netRx: Math.round(netRx),
      netTx: Math.round(netTx),
    }
  } catch {
    return null
  }
}

export function WorkspaceMonitor({ containerId }: WorkspaceMonitorProps) {
  const [history, setHistory] = useState<StatsPoint[]>([])
  const [latest, setLatest] = useState<StatsPoint | null>(null)
  const [connected, setConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const { token } = useAuthStore()

  useEffect(() => {
    if (!token) return

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/ws/containers/${containerId}/stats?token=${encodeURIComponent(token)}`
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => setConnected(true)
    ws.onclose = () => setConnected(false)
    ws.onerror = () => setConnected(false)

    ws.onmessage = (event) => {
      const raw = typeof event.data === 'string' ? event.data : new TextDecoder().decode(event.data)
      const point = parseStats(raw)
      if (point) {
        setLatest(point)
        setHistory((prev) => [...prev.slice(-29), point])
      }
    }

    return () => ws.close()
  }, [containerId, token])

  return (
    <div className="flex flex-col h-full p-4 overflow-auto cyber-scrollbar">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium text-white">Live Monitor</h3>
          <p className="text-sm text-gray-400">Real-time container resource usage</p>
        </div>
        <span className={`flex items-center space-x-2 text-xs ${connected ? 'text-cyber-neon' : 'text-gray-500'}`}>
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-cyber-neon animate-pulse' : 'bg-gray-500'}`} />
          {connected ? 'Live' : 'Connecting'}
        </span>
      </div>

      {latest && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'CPU', value: `${latest.cpu.toFixed(1)}%`, color: 'text-cyber-accent' },
            { label: 'Memory', value: `${latest.memoryMB} MB`, color: 'text-cyber-neon' },
            { label: 'Net RX', value: `${latest.netRx} KB`, color: 'text-blue-400' },
            { label: 'Net TX', value: `${latest.netTx} KB`, color: 'text-purple-400' },
          ].map((stat) => (
            <div key={stat.label} className="cyber-card p-4">
              <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
              <p className={`text-2xl font-mono font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-[200px]">
        <div className="cyber-card p-4">
          <h4 className="text-sm text-cyber-accent mb-3">CPU Usage</h4>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a3a4a" />
              <XAxis dataKey="time" tick={{ fill: '#666', fontSize: 10 }} />
              <YAxis tick={{ fill: '#666', fontSize: 10 }} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: '#111', border: '1px solid #00ffff33' }} />
              <Area type="monotone" dataKey="cpu" stroke="#00ffff" fill="#00ffff22" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="cyber-card p-4">
          <h4 className="text-sm text-cyber-neon mb-3">Memory (MB)</h4>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a3a4a" />
              <XAxis dataKey="time" tick={{ fill: '#666', fontSize: 10 }} />
              <YAxis tick={{ fill: '#666', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#111', border: '1px solid #00ff8833' }} />
              <Area type="monotone" dataKey="memoryMB" stroke="#00ff88" fill="#00ff8822" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
