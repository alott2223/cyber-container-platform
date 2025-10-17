'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { 
  Play, 
  Square, 
  Trash2, 
  Terminal, 
  Settings, 
  RefreshCw,
  Plus,
  Filter,
  Search
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { ContainerCard } from './ContainerCard'
import { CreateContainerModal } from './CreateContainerModal'
import { apiClient } from '@/lib/api'

export interface Container {
  id: string
  name: string
  image: string
  status: string
  state: string
  created: string
  ports: Array<{
    private_port: number
    public_port: number
    type: string
    ip: string
  }>
  labels: Record<string, string>
  environment: Record<string, string>
  cpu_usage: number
  memory_usage: number
}

export function ContainerList() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const queryClient = useQueryClient()

  const { data: containers = [], isLoading, error } = useQuery<Container[]>(
    'containers',
    async () => {
      const response = await apiClient.get('/containers')
      if (!response.ok) throw new Error('Failed to fetch containers')
      const data = await response.json()
      return data.containers
    },
    {
      refetchInterval: 5000, // Refetch every 5 seconds
    }
  )

  const startContainerMutation = useMutation(
    async (id: string) => {
      const response = await apiClient.post(`/containers/${id}/start`)
      if (!response.ok) throw new Error('Failed to start container')
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('containers')
        toast.success('Container started successfully')
      },
      onError: () => {
        toast.error('Failed to start container')
      },
    }
  )

  const stopContainerMutation = useMutation(
    async (id: string) => {
      const response = await apiClient.post(`/containers/${id}/stop`)
      if (!response.ok) throw new Error('Failed to stop container')
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('containers')
        toast.success('Container stopped successfully')
      },
      onError: () => {
        toast.error('Failed to stop container')
      },
    }
  )

  const removeContainerMutation = useMutation(
    async (id: string) => {
      const response = await apiClient.delete(`/containers/${id}`)
      if (!response.ok) throw new Error('Failed to remove container')
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('containers')
        toast.success('Container removed successfully')
      },
      onError: () => {
        toast.error('Failed to remove container')
      },
    }
  )

  const filteredContainers = containers.filter(container => {
    const matchesSearch = container.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         container.image.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || container.state === statusFilter
    return matchesSearch && matchesStatus
  })

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-cyber-error">Failed to load containers</p>
        <button 
          onClick={() => queryClient.invalidateQueries('containers')}
          className="cyber-button mt-4"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-cyber font-bold text-gradient">Containers</h1>
          <p className="text-gray-400 mt-1">Manage your containerized applications</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="cyber-button-primary"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Container
        </button>
      </div>

      {/* Filters */}
      <div className="cyber-card p-4">
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search containers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="cyber-input pl-10 w-full"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="cyber-input"
          >
            <option value="all">All Status</option>
            <option value="running">Running</option>
            <option value="exited">Stopped</option>
            <option value="paused">Paused</option>
          </select>

          {/* Refresh */}
          <button
            onClick={() => queryClient.invalidateQueries('containers')}
            className="cyber-button"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Container Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="cyber-card p-6 animate-pulse">
              <div className="h-4 bg-gray-700 rounded mb-4"></div>
              <div className="h-3 bg-gray-700 rounded mb-2"></div>
              <div className="h-3 bg-gray-700 rounded mb-4"></div>
              <div className="flex space-x-2">
                <div className="h-8 bg-gray-700 rounded flex-1"></div>
                <div className="h-8 bg-gray-700 rounded w-8"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredContainers.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-cyber-surface/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Settings className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-medium text-gray-400 mb-2">No containers found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Get started by creating your first container'
            }
          </p>
          {(!searchTerm && statusFilter === 'all') && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="cyber-button-primary"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Container
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContainers.map((container) => (
            <ContainerCard
              key={container.id}
              container={container}
              onStart={() => startContainerMutation.mutate(container.id)}
              onStop={() => stopContainerMutation.mutate(container.id)}
              onRemove={() => removeContainerMutation.mutate(container.id)}
              isLoading={startContainerMutation.isLoading || stopContainerMutation.isLoading}
            />
          ))}
        </div>
      )}

      {/* Create Container Modal */}
      {showCreateModal && (
        <CreateContainerModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            queryClient.invalidateQueries('containers')
          }}
        />
      )}
    </div>
  )
}
