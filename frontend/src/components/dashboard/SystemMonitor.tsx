'use client'

import { useEffect, useState } from 'react'
import { useQuery } from 'react-query'
import { Activity, Cpu, HardDrive, MemoryStick, Server, HddStack } from 'lucide-react'
import { apiClient } from '@/lib/api'

export function SystemMonitor() {
  const [refreshInterval, setRefreshInterval] = useState(5000)

  const { data: systemInfo, isLoading } = useQuery(
    'systemInfo',
    async () => {
      const response = await apiClient.get('/system/info')
      if (!response.ok) throw new Error('Failed to fetch system info')
      return response.json()
    },
    {
      refetchInterval: refreshInterval,
    }
  )

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const memoryUsage = systemInfo?.memory_limit
    ? ((systemInfo.memory_limit - (systemInfo.memory_limit - (systemInfo.memory_usage || 0))) / systemInfo.memory_limit) * 100
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-cyber font-bold text-gradient">System Monitor</h1>
          <p className="text-gray-400 mt-1">Real-time system resource monitoring</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            className="cyber-input"
          >
            <option value={1000}>Update every 1s</option>
            <option value={5000}>Update every 5s</option>
            <option value={10000}>Update every 10s</option>
            <option value={30000}>Update every 30s</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="cyber-card p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-neon mx-auto mb-4"></div>
          <p className="text-gray-400">Loading system information...</p>
        </div>
      ) : systemInfo ? (
        <>
          {/* System Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Containers */}
            <div className="cyber-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-cyber-accent/20 rounded-lg">
                  <Server className="w-6 h-6 text-cyber-accent" />
                </div>
                <span className="text-2xl font-bold text-cyber-neon">
                  {systemInfo.containers || 0}
                </span>
              </div>
              <p className="text-sm text-gray-400">Total Containers</p>
              <div className="mt-3 flex space-x-2 text-xs">
                <span className="text-green-400">Running: {systemInfo.containers_running || 0}</span>
                <span className="text-yellow-400">Paused: {systemInfo.containers_paused || 0}</span>
                <span className="text-red-400">Stopped: {systemInfo.containers_stopped || 0}</span>
              </div>
            </div>

            {/* Images */}
            <div className="cyber-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <HddStack className="w-6 h-6 text-blue-400" />
                </div>
                <span className="text-2xl font-bold text-blue-400">
                  {systemInfo.images || 0}
                </span>
              </div>
              <p className="text-sm text-gray-400">Docker Images</p>
            </div>

            {/* CPU */}
            <div className="cyber-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <Cpu className="w-6 h-6 text-green-400" />
                </div>
                <span className="text-2xl font-bold text-green-400">
                  {systemInfo.cpus || 0}
                </span>
              </div>
              <p className="text-sm text-gray-400">CPU Cores</p>
            </div>

            {/* Memory */}
            <div className="cyber-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-500/20 rounded-lg">
                  <MemoryStick className="w-6 h-6 text-purple-400" />
                </div>
                <span className="text-2xl font-bold text-purple-400">
                  {formatBytes(systemInfo.memory_limit || 0)}
                </span>
              </div>
              <p className="text-sm text-gray-400">Total Memory</p>
              <div className="mt-3">
                <div className="h-2 bg-cyber-surface rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 transition-all duration-300"
                    style={{ width: `${Math.min(memoryUsage, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed System Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Docker Information */}
            <div className="cyber-card p-6">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-cyber-accent" />
                Docker Information
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-cyber-surface">
                  <span className="text-gray-400">Version</span>
                  <span className="text-white font-mono">{systemInfo.docker_version || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-cyber-surface">
                  <span className="text-gray-400">Operating System</span>
                  <span className="text-white">{systemInfo.os || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-cyber-surface">
                  <span className="text-gray-400">Architecture</span>
                  <span className="text-white">{systemInfo.architecture || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-400">Total Memory</span>
                  <span className="text-white">{formatBytes(systemInfo.memory_limit || 0)}</span>
                </div>
              </div>
            </div>

            {/* Resource Usage */}
            <div className="cyber-card p-6">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                <HardDrive className="w-5 h-5 mr-2 text-cyber-accent" />
                Resource Usage
              </h3>
              <div className="space-y-4">
                {/* Memory Usage */}
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400">Memory</span>
                    <span className="text-white">
                      {formatBytes(systemInfo.memory_limit - (systemInfo.memory_limit - (systemInfo.memory_usage || 0)))}
                      {' / '}
                      {formatBytes(systemInfo.memory_limit || 0)}
                    </span>
                  </div>
                  <div className="h-3 bg-cyber-surface rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-300"
                      style={{ width: `${Math.min(memoryUsage, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Container Stats */}
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400">Containers</span>
                    <span className="text-white">
                      {systemInfo.containers_running || 0} / {systemInfo.containers || 0}
                    </span>
                  </div>
                  <div className="h-3 bg-cyber-surface rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-300"
                      style={{
                        width: `${systemInfo.containers ? ((systemInfo.containers_running || 0) / systemInfo.containers) * 100 : 0}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="cyber-card p-12 text-center">
          <p className="text-gray-400">Failed to load system information</p>
        </div>
      )}
    </div>
  )
}

