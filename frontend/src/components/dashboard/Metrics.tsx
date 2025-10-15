'use client'

import { useState, useEffect } from 'react'
import { useQuery } from 'react-query'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { Cpu, HardDrive, Activity } from 'lucide-react'
import { apiClient } from '@/lib/api'

interface ContainerStats {
  id: string
  name: string
  cpu_usage: number
  memory_usage: number
  state: string
}

export function Metrics() {
  const [timeRange, setTimeRange] = useState('1h')

  const { data: containers = [] } = useQuery<ContainerStats[]>(
    'container-stats',
    async () => {
      const response = await apiClient.get('/containers')
      if (!response.ok) throw new Error('Failed to fetch container stats')
      const data = await response.json()
      return data.containers
    },
    {
      refetchInterval: 5000,
    }
  )

  // Calculate aggregate metrics
  const totalContainers = containers.length
  const runningContainers = containers.filter(c => c.state === 'running').length
  const totalCpuUsage = containers.reduce((sum, c) => sum + c.cpu_usage, 0)
  const totalMemoryUsage = containers.reduce((sum, c) => sum + c.memory_usage, 0)

  // Prepare chart data
  const cpuData = containers.map(container => ({
    name: container.name.length > 10 ? container.name.substring(0, 10) + '...' : container.name,
    cpu: container.cpu_usage,
    memory: Math.round(container.memory_usage / 1024 / 1024), // Convert to MB
  }))

  const stateData = [
    { name: 'Running', value: runningContainers, color: '#00ff88' },
    { name: 'Stopped', value: totalContainers - runningContainers, color: '#ff3366' },
  ]

  // Mock historical data for demonstration
  const historicalData = Array.from({ length: 24 }, (_, i) => ({
    time: `${i}:00`,
    cpu: Math.random() * 100,
    memory: Math.random() * 100,
    containers: Math.floor(Math.random() * 10) + 5,
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-cyber font-bold text-gradient">Metrics</h1>
          <p className="text-gray-400 mt-1">System performance and resource utilization</p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="cyber-input"
        >
          <option value="1h">Last Hour</option>
          <option value="6h">Last 6 Hours</option>
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
        </select>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="cyber-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Containers</p>
              <p className="text-2xl font-bold text-white">{totalContainers}</p>
            </div>
            <div className="w-12 h-12 bg-cyber-accent/20 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-cyber-accent" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs text-gray-400">
              {runningContainers} running, {totalContainers - runningContainers} stopped
            </p>
          </div>
        </div>

        <div className="cyber-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">CPU Usage</p>
              <p className="text-2xl font-bold text-cyber-accent">{totalCpuUsage.toFixed(1)}%</p>
            </div>
            <div className="w-12 h-12 bg-cyber-accent/20 rounded-lg flex items-center justify-center">
              <Cpu className="w-6 h-6 text-cyber-accent" />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-cyber-accent h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(totalCpuUsage, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="cyber-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Memory Usage</p>
              <p className="text-2xl font-bold text-cyber-neon">
                {Math.round(totalMemoryUsage / 1024 / 1024)} MB
              </p>
            </div>
            <div className="w-12 h-12 bg-cyber-neon/20 rounded-lg flex items-center justify-center">
              <HardDrive className="w-6 h-6 text-cyber-neon" />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-cyber-neon h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min((totalMemoryUsage / 1024 / 1024 / 1024) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="cyber-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Storage</p>
              <p className="text-2xl font-bold text-cyber-warning">2.4 GB</p>
            </div>
            <div className="w-12 h-12 bg-cyber-warning/20 rounded-lg flex items-center justify-center">
              <HardDrive className="w-6 h-6 text-cyber-warning" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs text-gray-400">Used of 10 GB available</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CPU Usage Chart */}
        <div className="cyber-card p-6">
          <h3 className="text-lg font-medium text-white mb-4">CPU Usage by Container</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={cpuData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#111111', 
                  border: '1px solid #00ffff',
                  borderRadius: '8px'
                }} 
              />
              <Bar dataKey="cpu" fill="#00ffff" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Memory Usage Chart */}
        <div className="cyber-card p-6">
          <h3 className="text-lg font-medium text-white mb-4">Memory Usage by Container</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={cpuData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#111111', 
                  border: '1px solid #00ffff',
                  borderRadius: '8px'
                }} 
              />
              <Bar dataKey="memory" fill="#00ff88" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Historical Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Historical CPU */}
        <div className="cyber-card p-6">
          <h3 className="text-lg font-medium text-white mb-4">Historical CPU Usage</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="time" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#111111', 
                  border: '1px solid #00ffff',
                  borderRadius: '8px'
                }} 
              />
              <Line type="monotone" dataKey="cpu" stroke="#00ffff" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Container States */}
        <div className="cyber-card p-6">
          <h3 className="text-lg font-medium text-white mb-4">Container States</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stateData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {stateData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#111111', 
                  border: '1px solid #00ffff',
                  borderRadius: '8px'
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
