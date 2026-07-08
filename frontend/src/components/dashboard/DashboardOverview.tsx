'use client'

import { useQuery } from 'react-query'
import { Container, Cpu, HardDrive, Shield, Activity } from 'lucide-react'
import { apiClient } from '@/lib/api'
import type { Container as ContainerType } from './ContainerList'

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export function DashboardOverview() {
  const { data: containers = [] } = useQuery<ContainerType[]>(
    'containers',
    async () => {
      const response = await apiClient.get('/containers')
      if (!response.ok) return []
      const data = await response.json()
      return data.containers || []
    },
    { refetchInterval: 5000 }
  )

  const running = containers.filter((c) => c.state === 'running').length
  const stopped = containers.filter((c) => c.state === 'exited').length
  const totalCpu = containers.reduce((sum, c) => sum + (c.cpu_usage || 0), 0)
  const totalMem = containers.reduce((sum, c) => sum + (c.memory_usage || 0), 0)
  const opsecCount = containers.filter(
    (c) => c.name?.toLowerCase().includes('opsec') || c.labels?.['opsec.profile']
  ).length

  const stats = [
    { label: 'Running', value: running, icon: Activity, color: 'text-cyber-neon', sub: `${stopped} stopped` },
    { label: 'Total Containers', value: containers.length, icon: Container, color: 'text-cyber-accent', sub: 'all states' },
    { label: 'Cluster CPU', value: `${totalCpu.toFixed(1)}%`, icon: Cpu, color: 'text-blue-400', sub: 'aggregate' },
    { label: 'Cluster Memory', value: formatBytes(totalMem), icon: HardDrive, color: 'text-purple-400', sub: 'in use' },
    { label: 'OPSEC Containers', value: opsecCount, icon: Shield, color: 'text-cyber-warning', sub: 'hardened' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <div key={stat.label} className="cyber-card p-4 hover:border-cyber-accent/30 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <Icon className={`w-4 h-4 ${stat.color}`} />
              <span className="text-xs text-gray-500">{stat.sub}</span>
            </div>
            <p className={`text-2xl font-mono font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
          </div>
        )
      })}
    </div>
  )
}
