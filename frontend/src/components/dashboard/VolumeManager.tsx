'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Plus, Trash2, RefreshCw, HardDrive, Folder, X } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useForm } from 'react-hook-form'
import { apiClient } from '@/lib/api'

interface Volume {
  name: string
  driver: string
  mountpoint: string
  labels: Record<string, string>
  created_at: string
}

export function VolumeManager() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const queryClient = useQueryClient()

  const { data: volumes = [], isLoading, error } = useQuery<Volume[]>(
    'volumes',
    async () => {
      const response = await fetch('http://localhost:8080/api/v1/volumes', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('cyber-auth-storage')}`,
        },
      })
      if (!response.ok) throw new Error('Failed to fetch volumes')
      const data = await response.json()
      return data.volumes
    }
  )

  const removeVolumeMutation = useMutation(
    async (name: string) => {
      const response = await fetch(`http://localhost:8080/api/v1/volumes/${name}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('cyber-auth-storage')}`,
        },
      })
      if (!response.ok) throw new Error('Failed to remove volume')
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('volumes')
        toast.success('Volume removed successfully')
      },
      onError: () => {
        toast.error('Failed to remove volume')
      },
    }
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-cyber-error">Failed to load volumes</p>
        <button 
          onClick={() => queryClient.invalidateQueries('volumes')}
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
          <h1 className="text-3xl font-cyber font-bold text-gradient">Volumes</h1>
          <p className="text-gray-400 mt-1">Manage persistent data storage</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="cyber-button-primary"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Volume
        </button>
      </div>

      {/* Volumes Grid */}
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
      ) : volumes.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-cyber-surface/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <HardDrive className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-medium text-gray-400 mb-2">No volumes found</h3>
          <p className="text-gray-500 mb-4">Create your first volume to get started</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="cyber-button-primary"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Volume
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {volumes.map((volume) => (
            <div key={volume.name} className="cyber-card p-6 group">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-medium text-white truncate">{volume.name}</h3>
                  <p className="text-sm text-gray-400">{volume.driver}</p>
                </div>
                <button
                  onClick={() => removeVolumeMutation.mutate(volume.name)}
                  className="p-2 text-cyber-error hover:bg-cyber-error/10 rounded transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Details */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Created</span>
                  <span className="text-xs text-gray-400">{formatDate(volume.created_at)}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Mount Point</span>
                  <div className="flex items-center space-x-1">
                    <Folder className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-400 truncate max-w-32">
                      {volume.mountpoint}
                    </span>
                  </div>
                </div>
              </div>

            {/* Labels */}
            {volume.labels && Object.keys(volume.labels).length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-2">Labels</p>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(volume.labels).slice(0, 3).map(([key, value]) => (
                      <span
                        key={key}
                        className="px-2 py-1 bg-cyber-surface/50 text-xs text-cyber-accent rounded"
                      >
                        {key}={value}
                      </span>
                    ))}
                    {Object.keys(volume.labels).length > 3 && (
                      <span className="px-2 py-1 bg-cyber-surface/50 text-xs text-gray-400 rounded">
                        +{Object.keys(volume.labels).length - 3} more
                      </span>
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
                  <HardDrive className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Volume Modal */}
      {showCreateModal && (
        <CreateVolumeModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            queryClient.invalidateQueries('volumes')
            setShowCreateModal(false)
          }}
        />
      )}
    </div>
  )
}

interface CreateVolumeModalProps {
  onClose: () => void
  onSuccess: () => void
}

interface VolumeFormData {
  name: string
  driver: string
}

function CreateVolumeModal({ onClose, onSuccess }: CreateVolumeModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VolumeFormData>()

  const onSubmit = async (data: VolumeFormData) => {
    setIsLoading(true)
    try {
      const response = await apiClient.post('/volumes', {
        name: data.name,
        driver: data.driver || 'local',
      })

      if (!response.ok) {
        throw new Error('Failed to create volume')
      }

      toast.success('Volume created successfully!')
      onSuccess()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create volume')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="cyber-card p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Create Volume</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Volume Name
            </label>
            <input
              {...register('name', { required: 'Volume name is required' })}
              type="text"
              className="cyber-input w-full"
              placeholder="my-volume"
            />
            {errors.name && (
              <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Driver
            </label>
            <select
              {...register('driver')}
              className="cyber-input w-full"
              defaultValue="local"
            >
              <option value="local">Local</option>
              <option value="nfs">NFS</option>
              <option value="cifs">CIFS</option>
            </select>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="cyber-button flex-1"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="cyber-button-primary flex-1"
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Volume'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
