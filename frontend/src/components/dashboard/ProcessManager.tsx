'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { 
  Activity, 
  Square, 
  Search, 
  Filter,
  MoreVertical,
  Zap,
  AlertTriangle
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { apiClient } from '@/lib/api'

interface Process {
  pid: number
  name: string
  cpu_usage: number
  memory_usage: number
  status: string
  user: string
  command: string
  start_time: string
}

export function ProcessManager() {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'cpu' | 'memory' | 'name'>('cpu')
  const [filterBy, setFilterBy] = useState<'all' | 'high-cpu' | 'high-memory'>('all')
  const queryClient = useQueryClient()

  // Mock process data - would connect to real system API
  const { data: processes = [], isLoading } = useQuery<Process[]>(
    'processes',
    async () => {
      // This would be a real API call to get system processes
      return [
        {
          pid: 1234,
          name: 'dockerd',
          cpu_usage: 2.5,
          memory_usage: 512 * 1024 * 1024, // 512MB
          status: 'running',
          user: 'root',
          command: '/usr/bin/dockerd',
          start_time: '2025-10-28T10:00:00Z'
        },
        {
          pid: 5678,
          name: 'nginx',
          cpu_usage: 0.8,
          memory_usage: 64 * 1024 * 1024, // 64MB
          status: 'running',
          user: 'nginx',
          command: 'nginx: master process',
          start_time: '2025-10-28T12:00:00Z'
        },
        {
          pid: 9012,
          name: 'redis-server',
          cpu_usage: 1.2,
          memory_usage: 128 * 1024 * 1024, // 128MB
          status: 'running',
          user: 'redis',
          command: 'redis-server *:6379',
          start_time: '2025-10-28T11:30:00Z'
        },
        {
          pid: 3456,
          name: 'node',
          cpu_usage: 15.3,
          memory_usage: 256 * 1024 * 1024, // 256MB
          status: 'running',
          user: 'app',
          command: 'node server.js',
          start_time: '2025-10-28T13:00:00Z'
        },
        {
          pid: 7890,
          name: 'postgres',
          cpu_usage: 3.7,
          memory_usage: 384 * 1024 * 1024, // 384MB
          status: 'running',
          user: 'postgres',
          command: 'postgres: main process',
          start_time: '2025-10-28T09:30:00Z'
        }
      ]
    },
    {
      refetchInterval: 3000, // Refresh every 3 seconds
    }
  )

  const killProcess = async (pid: number, name: string) => {
    try {
      // Would execute: kill -9 <pid>
      toast.success(`Killed process ${name} (${pid})`)
      queryClient.invalidateQueries('processes')
    } catch (error) {
      toast.error(`Failed to kill process ${name}`)
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatUptime = (startTime: string) => {
    const start = new Date(startTime)
    const now = new Date()
    const diff = now.getTime() - start.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }

  // Filter and sort processes
  let filteredProcesses = processes.filter(process =>
    process.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    process.command.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (filterBy === 'high-cpu') {
    filteredProcesses = filteredProcesses.filter(p => p.cpu_usage > 5)
  } else if (filterBy === 'high-memory') {
    filteredProcesses = filteredProcesses.filter(p => p.memory_usage > 100 * 1024 * 1024) // > 100MB
  }

  filteredProcesses.sort((a, b) => {
    switch (sortBy) {
      case 'cpu':
        return b.cpu_usage - a.cpu_usage
      case 'memory':
        return b.memory_usage - a.memory_usage
      case 'name':
        return a.name.localeCompare(b.name)
      default:
        return 0
    }
  })

  const totalCpuUsage = processes.reduce((sum, p) => sum + p.cpu_usage, 0)
  const totalMemoryUsage = processes.reduce((sum, p) => sum + p.memory_usage, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-cyber font-bold text-gradient">Process Manager</h1>
          <p className="text-gray-400 mt-1">Monitor and manage system processes</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-400">
            Processes: {processes.length} | CPU: {totalCpuUsage.toFixed(1)}% | Memory: {formatBytes(totalMemoryUsage)}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="cyber-card p-4">
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search processes..."
              className="cyber-input pl-10 w-full"
            />
          </div>

          {/* Filter */}
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value as any)}
            className="cyber-input"
          >
            <option value="all">All Processes</option>
            <option value="high-cpu">High CPU (&gt;5%)</option>
            <option value="high-memory">High Memory (&gt;100MB)</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="cyber-input"
          >
            <option value="cpu">Sort by CPU</option>
            <option value="memory">Sort by Memory</option>
            <option value="name">Sort by Name</option>
          </select>
        </div>
      </div>

      {/* Process Table */}
      {isLoading ? (
        <div className="cyber-card p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-neon mx-auto mb-4"></div>
          <p className="text-gray-400">Loading processes...</p>
        </div>
      ) : (
        <div className="cyber-card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-cyber-surface/50">
                <tr>
                  <th className="text-left p-4 text-cyber-accent font-medium">PID</th>
                  <th className="text-left p-4 text-cyber-accent font-medium">Name</th>
                  <th className="text-left p-4 text-cyber-accent font-medium">CPU %</th>
                  <th className="text-left p-4 text-cyber-accent font-medium">Memory</th>
                  <th className="text-left p-4 text-cyber-accent font-medium">User</th>
                  <th className="text-left p-4 text-cyber-accent font-medium">Uptime</th>
                  <th className="text-right p-4 text-cyber-accent font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProcesses.map((process) => (
                  <tr
                    key={process.pid}
                    className="border-b border-cyber-border hover:bg-cyber-surface/30 transition-colors"
                  >
                    <td className="p-4 text-white font-mono">{process.pid}</td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <Activity className="w-4 h-4 text-cyber-accent" />
                        <span className="text-white">{process.name}</span>
                        {process.cpu_usage > 10 && (
                          <AlertTriangle className="w-3 h-3 text-yellow-400" />
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm font-mono ${
                          process.cpu_usage > 10 ? 'text-red-400' : 
                          process.cpu_usage > 5 ? 'text-yellow-400' : 'text-gray-400'
                        }`}>
                          {process.cpu_usage.toFixed(1)}%
                        </span>
                        <div className="w-16 h-2 bg-cyber-surface rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              process.cpu_usage > 10 ? 'bg-red-500' :
                              process.cpu_usage > 5 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(process.cpu_usage, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-gray-400 font-mono text-sm">
                      {formatBytes(process.memory_usage)}
                    </td>
                    <td className="p-4 text-gray-400">{process.user}</td>
                    <td className="p-4 text-gray-400 text-sm">{formatUptime(process.start_time)}</td>
                    <td className="p-4">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => killProcess(process.pid, process.name)}
                          className="cyber-button text-cyber-error border-cyber-error hover:bg-cyber-error/10 text-xs"
                          title="Kill Process"
                        >
                          <Square className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
