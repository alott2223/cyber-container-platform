'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { 
  Folder, 
  File, 
  Upload, 
  Download, 
  Trash2, 
  Edit, 
  FolderPlus,
  ArrowLeft,
  Search,
  MoreVertical
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { apiClient } from '@/lib/api'

interface FileItem {
  name: string
  type: 'file' | 'directory'
  size: number
  modified: string
  permissions: string
  path: string
}

export function FileManager() {
  const [currentPath, setCurrentPath] = useState('/')
  const [selectedContainer, setSelectedContainer] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const queryClient = useQueryClient()

  // Get list of containers for file browsing
  const { data: containers = [] } = useQuery('containers', async () => {
    const response = await apiClient.get('/containers')
    if (!response.ok) throw new Error('Failed to fetch containers')
    const data = await response.json()
    return data.containers.filter((c: any) => c.state === 'running')
  })

  // Get files in current directory
  const { data: files = [], isLoading } = useQuery(
    ['files', selectedContainer, currentPath],
    async () => {
      if (!selectedContainer) return []
      
      const response = await apiClient.post(`/containers/${selectedContainer}/exec`, {
        command: ['ls', '-la', currentPath]
      })
      
      if (!response.ok) throw new Error('Failed to list files')
      const data = await response.json()
      
      // Parse ls output into file objects
      const lines = data.output.split('\n').filter((line: string) => line.trim())
      const fileItems: FileItem[] = []
      
      lines.forEach((line: string) => {
        const parts = line.trim().split(/\s+/)
        if (parts.length >= 9 && !line.startsWith('total')) {
          const permissions = parts[0]
          const size = parseInt(parts[4]) || 0
          const name = parts.slice(8).join(' ')
          
          if (name !== '.' && name !== '..') {
            fileItems.push({
              name,
              type: permissions.startsWith('d') ? 'directory' : 'file',
              size,
              modified: `${parts[5]} ${parts[6]} ${parts[7]}`,
              permissions,
              path: currentPath === '/' ? `/${name}` : `${currentPath}/${name}`
            })
          }
        }
      })
      
      return fileItems
    },
    {
      enabled: !!selectedContainer,
    }
  )

  const navigateToPath = (path: string) => {
    setCurrentPath(path)
  }

  const navigateUp = () => {
    const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/'
    setCurrentPath(parentPath)
  }

  const downloadFile = async (file: FileItem) => {
    try {
      const response = await apiClient.post(`/containers/${selectedContainer}/exec`, {
        command: ['cat', file.path]
      })
      
      if (!response.ok) throw new Error('Failed to read file')
      const data = await response.json()
      
      // Create download
      const blob = new Blob([data.output], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = file.name
      a.click()
      URL.revokeObjectURL(url)
      
      toast.success(`Downloaded ${file.name}`)
    } catch (error) {
      toast.error(`Failed to download ${file.name}`)
    }
  }

  const deleteFile = async (file: FileItem) => {
    try {
      const command = file.type === 'directory' ? ['rmdir', file.path] : ['rm', file.path]
      const response = await apiClient.post(`/containers/${selectedContainer}/exec`, {
        command
      })
      
      if (!response.ok) throw new Error('Failed to delete file')
      
      toast.success(`Deleted ${file.name}`)
      queryClient.invalidateQueries(['files', selectedContainer, currentPath])
    } catch (error) {
      toast.error(`Failed to delete ${file.name}`)
    }
  }

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-cyber font-bold text-gradient">File Manager</h1>
          <p className="text-gray-400 mt-1">Browse and manage container files</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          disabled={!selectedContainer}
          className="cyber-button-primary disabled:opacity-50"
        >
          <Upload className="w-5 h-5 mr-2" />
          Upload File
        </button>
      </div>

      {/* Container Selection */}
      <div className="cyber-card p-4">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-cyber-accent">Container:</label>
          <select
            value={selectedContainer}
            onChange={(e) => {
              setSelectedContainer(e.target.value)
              setCurrentPath('/')
            }}
            className="cyber-input flex-1"
          >
            <option value="">Select a running container...</option>
            {containers.map((container: any) => (
              <option key={container.id} value={container.id}>
                {container.name} ({container.image})
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedContainer && (
        <>
          {/* Navigation */}
          <div className="cyber-card p-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={navigateUp}
                disabled={currentPath === '/'}
                className="cyber-button disabled:opacity-50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </button>
              <div className="flex-1 flex items-center space-x-2">
                <Folder className="w-4 h-4 text-cyber-accent" />
                <span className="text-white font-mono">{currentPath}</span>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search files..."
                  className="cyber-input pl-10 w-64"
                />
              </div>
            </div>
          </div>

          {/* File List */}
          {isLoading ? (
            <div className="cyber-card p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-neon mx-auto mb-4"></div>
              <p className="text-gray-400">Loading files...</p>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="cyber-card p-12 text-center">
              <Folder className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No files found</p>
              <p className="text-gray-500 text-sm mt-2">
                {searchTerm ? 'Try adjusting your search criteria' : 'This directory is empty'}
              </p>
            </div>
          ) : (
            <div className="cyber-card p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-cyber-surface/50">
                    <tr>
                      <th className="text-left p-4 text-cyber-accent font-medium">Name</th>
                      <th className="text-left p-4 text-cyber-accent font-medium">Size</th>
                      <th className="text-left p-4 text-cyber-accent font-medium">Modified</th>
                      <th className="text-left p-4 text-cyber-accent font-medium">Permissions</th>
                      <th className="text-right p-4 text-cyber-accent font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFiles.map((file) => (
                      <tr
                        key={file.path}
                        className="border-b border-cyber-border hover:bg-cyber-surface/30 transition-colors"
                      >
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            {file.type === 'directory' ? (
                              <Folder className="w-4 h-4 text-blue-400" />
                            ) : (
                              <File className="w-4 h-4 text-gray-400" />
                            )}
                            <button
                              onClick={() => {
                                if (file.type === 'directory') {
                                  navigateToPath(file.path)
                                }
                              }}
                              className={`text-white hover:text-cyber-accent transition-colors ${
                                file.type === 'directory' ? 'cursor-pointer' : 'cursor-default'
                              }`}
                            >
                              {file.name}
                            </button>
                          </div>
                        </td>
                        <td className="p-4 text-gray-400">
                          {file.type === 'file' ? `${(file.size / 1024).toFixed(1)} KB` : '-'}
                        </td>
                        <td className="p-4 text-gray-400 font-mono text-sm">
                          {file.modified}
                        </td>
                        <td className="p-4 text-gray-400 font-mono text-sm">
                          {file.permissions}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end space-x-2">
                            {file.type === 'file' && (
                              <button
                                onClick={() => downloadFile(file)}
                                className="cyber-button text-xs"
                                title="Download"
                              >
                                <Download className="w-3 h-3" />
                              </button>
                            )}
                            <button
                              onClick={() => deleteFile(file)}
                              className="cyber-button text-cyber-error border-cyber-error hover:bg-cyber-error/10 text-xs"
                              title="Delete"
                            >
                              <Trash2 className="w-3 h-3" />
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
        </>
      )}
    </div>
  )
}
