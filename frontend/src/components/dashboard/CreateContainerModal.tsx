'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { X, Plus, Minus } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { apiClient } from '@/lib/api'

interface CreateContainerModalProps {
  onClose: () => void
  onSuccess: () => void
}

interface FormData {
  name: string
  image: string
  ports: Array<{ host: string; container: string }>
  environment: Array<{ key: string; value: string }>
  volumes: Array<{ host: string; container: string }>
  network: string
}

export function CreateContainerModal({ onClose, onSuccess }: CreateContainerModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      name: '',
      image: '',
      ports: [{ host: '', container: '' }],
      environment: [{ key: '', value: '' }],
      volumes: [{ host: '', container: '' }],
      network: 'bridge',
    },
  })

  const watchedValues = watch()

  const addPort = () => {
    setValue('ports', [...watchedValues.ports, { host: '', container: '' }])
  }

  const removePort = (index: number) => {
    setValue('ports', watchedValues.ports.filter((_, i) => i !== index))
  }

  const addEnvironment = () => {
    setValue('environment', [...watchedValues.environment, { key: '', value: '' }])
  }

  const removeEnvironment = (index: number) => {
    setValue('environment', watchedValues.environment.filter((_, i) => i !== index))
  }

  const addVolume = () => {
    setValue('volumes', [...watchedValues.volumes, { host: '', container: '' }])
  }

  const removeVolume = (index: number) => {
    setValue('volumes', watchedValues.volumes.filter((_, i) => i !== index))
  }

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    
    try {
      // Convert arrays to objects
      const ports: Record<string, string> = {}
      data.ports.forEach(port => {
        if (port.host && port.container) {
          ports[port.host] = port.container
        }
      })

      const environment: Record<string, string> = {}
      data.environment.forEach(env => {
        if (env.key && env.value) {
          environment[env.key] = env.value
        }
      })

      const volumes: Record<string, string> = {}
      data.volumes.forEach(volume => {
        if (volume.host && volume.container) {
          volumes[volume.host] = volume.container
        }
      })

      const response = await apiClient.post('/containers', {
        name: data.name,
        image: data.image,
        ports,
        environment,
        volumes,
        network: data.network,
      })

      if (!response.ok) {
        throw new Error('Failed to create container')
      }

      toast.success('Container created successfully')
      onSuccess()
    } catch (error) {
      toast.error('Failed to create container')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="cyber-card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-cyber-border">
          <h2 className="text-2xl font-cyber font-bold text-gradient">Create Container</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-cyber-surface/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-cyber-accent mb-2">
                Container Name *
              </label>
              <input
                {...register('name', { required: 'Container name is required' })}
                type="text"
                className="cyber-input w-full"
                placeholder="my-container"
              />
              {errors.name && (
                <p className="text-cyber-error text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-cyber-accent mb-2">
                Image *
              </label>
              <input
                {...register('image', { required: 'Image is required' })}
                type="text"
                className="cyber-input w-full"
                placeholder="nginx:alpine"
              />
              {errors.image && (
                <p className="text-cyber-error text-sm mt-1">{errors.image.message}</p>
              )}
            </div>
          </div>

          {/* Ports */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-cyber-accent">Port Mappings</label>
              <button
                type="button"
                onClick={addPort}
                className="cyber-button text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Port
              </button>
            </div>
            <div className="space-y-2">
              {watchedValues.ports.map((port, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    {...register(`ports.${index}.host`)}
                    type="text"
                    className="cyber-input flex-1"
                    placeholder="Host port (e.g., 8080)"
                  />
                  <span className="text-gray-400">:</span>
                  <input
                    {...register(`ports.${index}.container`)}
                    type="text"
                    className="cyber-input flex-1"
                    placeholder="Container port (e.g., 80)"
                  />
                  {watchedValues.ports.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePort(index)}
                      className="p-2 text-cyber-error hover:bg-cyber-error/10 rounded transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Environment Variables */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-cyber-accent">Environment Variables</label>
              <button
                type="button"
                onClick={addEnvironment}
                className="cyber-button text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Variable
              </button>
            </div>
            <div className="space-y-2">
              {watchedValues.environment.map((env, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    {...register(`environment.${index}.key`)}
                    type="text"
                    className="cyber-input flex-1"
                    placeholder="Variable name"
                  />
                  <span className="text-gray-400">=</span>
                  <input
                    {...register(`environment.${index}.value`)}
                    type="text"
                    className="cyber-input flex-1"
                    placeholder="Variable value"
                  />
                  {watchedValues.environment.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeEnvironment(index)}
                      className="p-2 text-cyber-error hover:bg-cyber-error/10 rounded transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Volumes */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-cyber-accent">Volume Mounts</label>
              <button
                type="button"
                onClick={addVolume}
                className="cyber-button text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Volume
              </button>
            </div>
            <div className="space-y-2">
              {watchedValues.volumes.map((volume, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    {...register(`volumes.${index}.host`)}
                    type="text"
                    className="cyber-input flex-1"
                    placeholder="Host path"
                  />
                  <span className="text-gray-400">:</span>
                  <input
                    {...register(`volumes.${index}.container`)}
                    type="text"
                    className="cyber-input flex-1"
                    placeholder="Container path"
                  />
                  {watchedValues.volumes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVolume(index)}
                      className="p-2 text-cyber-error hover:bg-cyber-error/10 rounded transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Network */}
          <div>
            <label className="block text-sm font-medium text-cyber-accent mb-2">
              Network
            </label>
            <select {...register('network')} className="cyber-input w-full">
              <option value="bridge">Bridge</option>
              <option value="host">Host</option>
              <option value="none">None</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-cyber-border">
            <button
              type="button"
              onClick={onClose}
              className="cyber-button"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="cyber-button-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create Container'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
