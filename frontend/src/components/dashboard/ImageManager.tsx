'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Download, Trash2, Search, Image as ImageIcon } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { apiClient } from '@/lib/api'

export function ImageManager() {
  const [searchTerm, setSearchTerm] = useState('')
  const [pullImageName, setPullImageName] = useState('')
  const [isPulling, setIsPulling] = useState(false)
  const queryClient = useQueryClient()

  const { data: images, isLoading } = useQuery('images', async () => {
    const response = await apiClient.get('/images')
    if (!response.ok) throw new Error('Failed to fetch images')
    return response.json()
  })

  const removeImageMutation = useMutation(
    async (imageId: string) => {
      const response = await apiClient.delete(`/images/${imageId}`)
      if (!response.ok) throw new Error('Failed to remove image')
      return response.json()
    },
    {
      onSuccess: () => {
        toast.success('Image removed successfully')
        queryClient.invalidateQueries('images')
      },
      onError: (error: Error) => {
        toast.error(`Failed to remove image: ${error.message}`)
      },
    }
  )

  const pullImage = async () => {
    if (!pullImageName.trim()) {
      toast.error('Please enter an image name')
      return
    }

    setIsPulling(true)
    try {
      const response = await apiClient.post('/images/pull', {
        image: pullImageName.trim(),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to pull image')
      }

      toast.success(`Image ${pullImageName} pulled successfully!`)
      setPullImageName('')
      queryClient.invalidateQueries('images')
    } catch (error) {
      toast.error(`Failed to pull image: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsPulling(false)
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const filteredImages = images?.images
    ? images.images.filter((img: any) =>
        img.RepoTags && img.RepoTags.some((tag: string) =>
          tag.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-cyber font-bold text-gradient">Image Manager</h1>
          <p className="text-gray-400 mt-1">Manage Docker images</p>
        </div>
      </div>

      {/* Pull Image */}
      <div className="cyber-card p-6">
        <h3 className="text-lg font-medium text-white mb-4 flex items-center">
          <Download className="w-5 h-5 mr-2 text-cyber-accent" />
          Pull Image
        </h3>
        <div className="flex space-x-2">
          <input
            type="text"
            value={pullImageName}
            onChange={(e) => setPullImageName(e.target.value)}
            placeholder="e.g., nginx:latest, redis:alpine"
            className="cyber-input flex-1"
            onKeyPress={(e) => e.key === 'Enter' && pullImage()}
          />
          <button
            onClick={pullImage}
            disabled={isPulling}
            className="cyber-button-primary px-6"
          >
            {isPulling ? 'Pulling...' : 'Pull'}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Pull images from Docker Hub or other registries
        </p>
      </div>

      {/* Search */}
      <div className="cyber-card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search images..."
            className="cyber-input pl-10 w-full"
          />
        </div>
      </div>

      {/* Images List */}
      {isLoading ? (
        <div className="cyber-card p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-neon mx-auto mb-4"></div>
          <p className="text-gray-400">Loading images...</p>
        </div>
      ) : filteredImages.length === 0 ? (
        <div className="cyber-card p-12 text-center">
          <ImageIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No images found</p>
          <p className="text-gray-500 text-sm mt-2">Pull an image to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredImages.map((image: any) => (
            <div key={image.Id} className="cyber-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <ImageIcon className="w-5 h-5 text-cyber-accent" />
                    <div>
                      <h3 className="text-white font-medium">
                        {image.RepoTags && image.RepoTags.length > 0
                          ? image.RepoTags[0]
                          : '<none>:<none>'}
                      </h3>
                      <p className="text-xs text-gray-400 font-mono">
                        {image.Id.substring(0, 12)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <span>Size: {formatSize(image.Size)}</span>
                    <span>
                      Created: {new Date(image.Created * 1000).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => removeImageMutation.mutate(image.Id)}
                  disabled={removeImageMutation.isLoading}
                  className="cyber-button-danger px-4"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

