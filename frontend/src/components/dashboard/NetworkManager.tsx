'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Plus, Trash2, RefreshCw, Network, Users } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { apiClient } from '@/lib/api'

interface Network {
  id: string
  name: string
  driver: string
  scope: string
  labels: Record<string, string>
  containers: Record<string, {
    name: string
    endpoint_id: string
    mac_address: string
    ipv4_address: string
    ipv6_address: string
  }>
}

export function NetworkManager() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const queryClient = useQueryClient()

  const { data: networks = [], isLoading, error } = useQuery<Network[]>(
    'networks',
    async () => {
      const response = await apiClient.get('/networks')
      if (!response.ok) throw new Error('Failed to fetch networks')
      const data = await response.json()
      return data.networks
    }
  )

  const removeNetworkMutation = useMutation(
    async (id: string) => {
      const response = await apiClient.delete(`/networks/${id}`)
      if (!response.ok) throw new Error('Failed to remove network')
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('networks')
        toast.success('Network removed successfully')
      },
      onError: () => {
        toast.error('Failed to remove network')
      },
    }
  )

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-cyber-error">Failed to load networks</p>
        <button 
          onClick={() => queryClient.invalidateQueries('networks')}
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
          <h1 className="text-3xl font-cyber font-bold text-gradient">Networks</h1>
          <p className="text-gray-400 mt-1">Manage Docker networks and connectivity</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="cyber-button-primary"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Network
        </button>
      </div>

      {/* Networks Grid */}
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
      ) : networks.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-cyber-surface/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Network className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-medium text-gray-400 mb-2">No networks found</h3>
          <p className="text-gray-500 mb-4">Create your first network to get started</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="cyber-button-primary"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Network
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {networks.map((network) => (
            <div key={network.id} className="cyber-card p-6 group">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-medium text-white truncate">{network.name}</h3>
                  <p className="text-sm text-gray-400">{network.driver}</p>
                </div>
                <button
                  onClick={() => removeNetworkMutation.mutate(network.id)}
                  className="p-2 text-cyber-error hover:bg-cyber-error/10 rounded transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Details */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Scope</span>
                  <span className="text-xs text-cyber-accent">{network.scope}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Containers</span>
                  <div className="flex items-center space-x-1">
                    <Users className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-400">
                      {Object.keys(network.containers).length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Connected Containers */}
              {Object.keys(network.containers).length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-2">Connected Containers</p>
                  <div className="space-y-1">
                    {Object.entries(network.containers).slice(0, 3).map(([name, container]) => (
                      <div key={name} className="flex items-center justify-between text-xs">
                        <span className="text-gray-400 truncate">{container.name}</span>
                        <span className="text-cyber-accent">{container.ipv4_address}</span>
                      </div>
                    ))}
                    {Object.keys(network.containers).length > 3 && (
                      <p className="text-xs text-gray-500">
                        +{Object.keys(network.containers).length - 3} more
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-2">
                <button className="flex-1 cyber-button text-xs">
                  View Details
                </button>
                <button className="cyber-button text-xs">
                  <Network className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
