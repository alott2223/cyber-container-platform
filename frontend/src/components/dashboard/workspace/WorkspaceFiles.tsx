'use client'

import { useState } from 'react'
import { useQuery } from 'react-query'
import { Folder, File, ArrowLeft, RefreshCw, ChevronRight } from 'lucide-react'
import { apiClient } from '@/lib/api'

interface FileItem {
  name: string
  type: 'file' | 'directory'
  size: number
  modified: string
  permissions: string
  path: string
}

interface WorkspaceFilesProps {
  containerId: string
  compact?: boolean
  onNavigate?: (path: string) => void
}

function parseLsOutput(output: string, currentPath: string): FileItem[] {
  const lines = output.split('\n').filter((line) => line.trim())
  const fileItems: FileItem[] = []

  lines.forEach((line) => {
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
          path: currentPath === '/' ? `/${name}` : `${currentPath}/${name}`,
        })
      }
    }
  })

  return fileItems.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1
    return a.name.localeCompare(b.name)
  })
}

export function WorkspaceFiles({ containerId, compact = false, onNavigate }: WorkspaceFilesProps) {
  const [currentPath, setCurrentPath] = useState('/')

  const { data: files = [], isLoading, refetch, isFetching } = useQuery(
    ['workspace-files', containerId, currentPath],
    async () => {
      const response = await apiClient.post(`/containers/${containerId}/exec`, {
        command: ['ls', '-la', currentPath],
      })
      if (!response.ok) throw new Error('Failed to list files')
      const data = await response.json()
      return parseLsOutput(data.output || '', currentPath)
    },
    { enabled: !!containerId, refetchInterval: compact ? 10000 : false }
  )

  const navigateTo = (path: string) => {
    setCurrentPath(path)
    onNavigate?.(path)
  }

  const navigateUp = () => {
    const parent = currentPath.split('/').slice(0, -1).join('/') || '/'
    navigateTo(parent)
  }

  const breadcrumbs = currentPath === '/' ? ['/'] : ['/', ...currentPath.split('/').filter(Boolean)]

  return (
    <div className={`flex flex-col h-full ${compact ? '' : 'p-4'}`}>
      {!compact && (
        <div className="mb-4">
          <h3 className="text-lg font-medium text-white">File Explorer</h3>
          <p className="text-sm text-gray-400">Browse container filesystem</p>
        </div>
      )}

      <div className={`flex items-center space-x-2 ${compact ? 'px-2 py-2 border-b border-cyber-border' : 'mb-3'}`}>
        <button
          onClick={navigateUp}
          disabled={currentPath === '/'}
          className="cyber-button p-1.5 disabled:opacity-30"
          title="Go up"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => refetch()} className="cyber-button p-1.5" title="Refresh">
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
        </button>
        <div className="flex-1 flex items-center text-xs font-mono text-gray-400 overflow-x-auto cyber-scrollbar">
          {breadcrumbs.map((crumb, i) => {
            const path = i === 0 ? '/' : '/' + breadcrumbs.slice(1, i + 1).join('/')
            return (
              <span key={path} className="flex items-center shrink-0">
                {i > 0 && <ChevronRight className="w-3 h-3 mx-0.5 text-gray-600" />}
                <button
                  onClick={() => navigateTo(path)}
                  className="hover:text-cyber-accent transition-colors px-0.5"
                >
                  {crumb === '/' ? '/' : crumb}
                </button>
              </span>
            )
          })}
        </div>
      </div>

      <div className={`flex-1 overflow-y-auto cyber-scrollbar ${compact ? 'px-1' : ''}`}>
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-gray-500 text-sm">Loading...</div>
        ) : files.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-gray-500 text-sm">Empty directory</div>
        ) : (
          <div className="space-y-0.5">
            {files.map((file) => (
              <button
                key={file.path}
                onClick={() => file.type === 'directory' && navigateTo(file.path)}
                className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded text-left transition-colors ${
                  file.type === 'directory'
                    ? 'hover:bg-cyber-accent/10 cursor-pointer'
                    : 'hover:bg-cyber-surface/50 cursor-default'
                }`}
              >
                {file.type === 'directory' ? (
                  <Folder className="w-4 h-4 text-blue-400 shrink-0" />
                ) : (
                  <File className="w-4 h-4 text-gray-500 shrink-0" />
                )}
                <span className={`text-sm truncate ${file.type === 'directory' ? 'text-white' : 'text-gray-300'}`}>
                  {file.name}
                </span>
                {!compact && file.type === 'file' && (
                  <span className="text-xs text-gray-600 ml-auto shrink-0">
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
