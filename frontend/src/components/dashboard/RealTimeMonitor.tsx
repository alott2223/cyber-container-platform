'use client'

import { useEffect, useState } from 'react'
import { useQuery } from 'react-query'
import { Activity, Cpu, MemoryStick, Network, HardDrive, Zap } from 'lucide-react'
import { apiClient } from '@/lib/api'

interface SystemMetrics {
  cpu_usage: number
  memory_usage: number
  memory_total: number
  disk_usage: number
  disk_total: number
  network_rx: number
  network_tx: number
  containers_running: number
  containers_total: number
  timestamp: number
}

export function RealTimeMonitor() {
  const [metrics, setMetrics] = useState<SystemMetrics[]>([])
  const [isConnected, setIsConnected] = useState(false)

  // WebSocket connection for real-time metrics
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080/ws')
    
    ws.onopen = () => {
      setIsConnected(true)
      console.log('Connected to real-time metrics')
    }
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'metrics') {
          setMetrics(prev => {
            const newMetrics = [...prev, data.payload]
            // Keep only last 60 data points (1 minute at 1 second intervals)
            return newMetrics.slice(-60)
          })
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error)
      }
    }
    
    ws.onclose = () => {
      setIsConnected(false)
      console.log('Disconnected from real-time metrics')
    }
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      setIsConnected(false)
    }
    
    return () => {
      ws.close()
    }
  }, [])

  // Fallback to polling if WebSocket fails
  const { data: systemInfo } = useQuery(
    'system-metrics',
    async () => {
      const response = await apiClient.get('/system/info')
      if (!response.ok) throw new Error('Failed to fetch system info')
      return response.json()
    },
    {
      refetchInterval: isConnected ? false : 5000, // Only poll if WebSocket not connected
    }
  )

  const latestMetrics = metrics.length > 0 ? metrics[metrics.length - 1] : null
  
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatBps = (bps: number) => {
    if (bps === 0) return '0 B/s'
    const k = 1024
    const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s']
    const i = Math.floor(Math.log(bps) / Math.log(k))
    return Math.round(bps / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-cyber font-bold text-gradient">Real-Time Monitor</h1>
          <p className="text-gray-400 mt-1">Live system performance monitoring</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
          <span className="text-sm text-gray-400">
            {isConnected ? 'Live' : 'Polling'}
          </span>
        </div>
      </div>

      {/* Real-time Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* CPU Usage */}
        <div className="cyber-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <Cpu className="w-6 h-6 text-green-400" />
            </div>
            <span className="text-2xl font-bold text-green-400">
              {latestMetrics ? `${latestMetrics.cpu_usage.toFixed(1)}%` : '0.0%'}
            </span>
          </div>
          <p className="text-sm text-gray-400">CPU Usage</p>
          <div className="mt-3">
            <div className="h-2 bg-cyber-surface rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${latestMetrics?.cpu_usage || 0}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Memory Usage */}
        <div className="cyber-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <MemoryStick className="w-6 h-6 text-purple-400" />
            </div>
            <span className="text-2xl font-bold text-purple-400">
              {latestMetrics ? formatBytes(latestMetrics.memory_usage) : '0 B'}
            </span>
          </div>
          <p className="text-sm text-gray-400">Memory Usage</p>
          <div className="mt-3">
            <div className="h-2 bg-cyber-surface rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 transition-all duration-300"
                style={{ 
                  width: `${latestMetrics ? (latestMetrics.memory_usage / latestMetrics.memory_total) * 100 : 0}%` 
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Network I/O */}
        <div className="cyber-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Network className="w-6 h-6 text-blue-400" />
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-blue-400">
                ↓ {latestMetrics ? formatBps(latestMetrics.network_rx) : '0 B/s'}
              </div>
              <div className="text-sm text-blue-300">
                ↑ {latestMetrics ? formatBps(latestMetrics.network_tx) : '0 B/s'}
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-400">Network I/O</p>
        </div>

        {/* Disk Usage */}
        <div className="cyber-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-500/20 rounded-lg">
              <HardDrive className="w-6 h-6 text-orange-400" />
            </div>
            <span className="text-2xl font-bold text-orange-400">
              {latestMetrics ? formatBytes(latestMetrics.disk_usage) : '0 B'}
            </span>
          </div>
          <p className="text-sm text-gray-400">Disk Usage</p>
          <div className="mt-3">
            <div className="h-2 bg-cyber-surface rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-500 transition-all duration-300"
                style={{ 
                  width: `${latestMetrics ? (latestMetrics.disk_usage / latestMetrics.disk_total) * 100 : 0}%` 
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CPU Chart */}
        <div className="cyber-card p-6">
          <h3 className="text-lg font-medium text-white mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-cyber-accent" />
            CPU Usage Over Time
          </h3>
          <div className="h-48 bg-cyber-surface/30 rounded-lg p-4">
            <div className="h-full flex items-end space-x-1">
              {metrics.slice(-30).map((metric, index) => (
                <div
                  key={index}
                  className="flex-1 bg-green-500 rounded-t transition-all duration-300"
                  style={{ height: `${(metric.cpu_usage / 100) * 100}%` }}
                  title={`${metric.cpu_usage.toFixed(1)}%`}
                ></div>
              ))}
            </div>
          </div>
        </div>

        {/* Memory Chart */}
        <div className="cyber-card p-6">
          <h3 className="text-lg font-medium text-white mb-4 flex items-center">
            <MemoryStick className="w-5 h-5 mr-2 text-cyber-accent" />
            Memory Usage Over Time
          </h3>
          <div className="h-48 bg-cyber-surface/30 rounded-lg p-4">
            <div className="h-full flex items-end space-x-1">
              {metrics.slice(-30).map((metric, index) => (
                <div
                  key={index}
                  className="flex-1 bg-purple-500 rounded-t transition-all duration-300"
                  style={{ height: `${(metric.memory_usage / metric.memory_total) * 100}%` }}
                  title={`${formatBytes(metric.memory_usage)} / ${formatBytes(metric.memory_total)}`}
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Performance Alerts */}
      <div className="cyber-card p-6">
        <h3 className="text-lg font-medium text-white mb-4 flex items-center">
          <Zap className="w-5 h-5 mr-2 text-cyber-accent" />
          Performance Alerts
        </h3>
        <div className="space-y-3">
          {latestMetrics && latestMetrics.cpu_usage > 80 && (
            <div className="flex items-center p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
              <Zap className="w-4 h-4 text-red-400 mr-3" />
              <div>
                <p className="text-red-400 font-medium">High CPU Usage</p>
                <p className="text-red-300 text-sm">CPU usage is at {latestMetrics.cpu_usage.toFixed(1)}%</p>
              </div>
            </div>
          )}
          
          {latestMetrics && (latestMetrics.memory_usage / latestMetrics.memory_total) > 0.85 && (
            <div className="flex items-center p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
              <Zap className="w-4 h-4 text-yellow-400 mr-3" />
              <div>
                <p className="text-yellow-400 font-medium">High Memory Usage</p>
                <p className="text-yellow-300 text-sm">
                  Memory usage is at {((latestMetrics.memory_usage / latestMetrics.memory_total) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          )}
          
          {latestMetrics && (latestMetrics.disk_usage / latestMetrics.disk_total) > 0.90 && (
            <div className="flex items-center p-3 bg-orange-500/20 border border-orange-500/30 rounded-lg">
              <Zap className="w-4 h-4 text-orange-400 mr-3" />
              <div>
                <p className="text-orange-400 font-medium">Low Disk Space</p>
                <p className="text-orange-300 text-sm">
                  Disk usage is at {((latestMetrics.disk_usage / latestMetrics.disk_total) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          )}
          
          {(!latestMetrics || (
            latestMetrics.cpu_usage < 80 && 
            (latestMetrics.memory_usage / latestMetrics.memory_total) < 0.85 &&
            (latestMetrics.disk_usage / latestMetrics.disk_total) < 0.90
          )) && (
            <div className="flex items-center p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
              <Zap className="w-4 h-4 text-green-400 mr-3" />
              <div>
                <p className="text-green-400 font-medium">System Performance Good</p>
                <p className="text-green-300 text-sm">All metrics are within normal ranges</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
