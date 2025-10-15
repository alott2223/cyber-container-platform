'use client'

import { useState } from 'react'
import { Play, Square, Trash2, Terminal, MoreVertical, ExternalLink } from 'lucide-react'
import { Container } from './ContainerList'

interface ContainerCardProps {
  container: Container
  onStart: () => void
  onStop: () => void
  onRemove: () => void
  isLoading: boolean
}

export function ContainerCard({ container, onStart, onStop, onRemove, isLoading }: ContainerCardProps) {
  const [showMenu, setShowMenu] = useState(false)

  const getStatusColor = (state: string) => {
    switch (state) {
      case 'running':
        return 'status-running'
      case 'exited':
        return 'status-stopped'
      case 'paused':
        return 'status-paused'
      default:
        return 'status-stopped'
    }
  }

  const getStatusText = (state: string) => {
    switch (state) {
      case 'running':
        return 'Running'
      case 'exited':
        return 'Stopped'
      case 'paused':
        return 'Paused'
      default:
        return 'Unknown'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="container-node group">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-medium text-white truncate">{container.name}</h3>
          <p className="text-sm text-gray-400 truncate">{container.image}</p>
        </div>
        
        {/* Status Indicator */}
        <div className="flex items-center space-x-2 ml-2">
          <div className={`status-indicator ${getStatusColor(container.state)} animate-pulse`}></div>
          <span className="text-xs text-gray-400">{getStatusText(container.state)}</span>
          {container.state === 'running' && (
            <span className="text-xs text-green-400">●</span>
          )}
        </div>

        {/* Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 hover:bg-cyber-surface/50 rounded transition-colors opacity-0 group-hover:opacity-100"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-48 cyber-card p-2 z-10">
              <button className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-cyber-surface/50 rounded transition-colors">
                <Terminal className="w-4 h-4" />
                <span>Open Terminal</span>
              </button>
              <button className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-cyber-surface/50 rounded transition-colors">
                <ExternalLink className="w-4 h-4" />
                <span>View Logs</span>
              </button>
              <div className="border-t border-cyber-border my-1"></div>
              <button 
                onClick={onRemove}
                className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-400 hover:text-cyber-error hover:bg-cyber-surface/50 rounded transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Remove</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="space-y-3 mb-4">
        {/* Ports */}
        {container.ports && container.ports.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 mb-1">Ports</p>
            <div className="flex flex-wrap gap-1">
              {container.ports.slice(0, 3).map((port, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-cyber-surface/50 text-xs text-cyber-accent rounded"
                >
                  {port.public_port}:{port.private_port}
                </span>
              ))}
              {container.ports && container.ports.length > 3 && (
                <span className="px-2 py-1 bg-cyber-surface/50 text-xs text-gray-400 rounded">
                  +{container.ports.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Resources */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">CPU Usage</p>
            <p className="text-sm font-mono text-cyber-accent">
              {container.cpu_usage.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Memory</p>
            <p className="text-sm font-mono text-cyber-neon">
              {formatBytes(container.memory_usage)}
            </p>
          </div>
        </div>

        {/* Created */}
        <div>
          <p className="text-xs text-gray-500 mb-1">Created</p>
          <p className="text-xs text-gray-400">{formatDate(container.created)}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex space-x-2">
        {container.state === 'running' ? (
          <button
            onClick={onStop}
            disabled={isLoading}
            className="flex-1 cyber-button text-cyber-warning border-cyber-warning hover:bg-cyber-warning/10"
          >
            <Square className="w-4 h-4 mr-2" />
            Stop
          </button>
        ) : (
          <button
            onClick={onStart}
            disabled={isLoading}
            className="flex-1 cyber-button text-cyber-neon border-cyber-neon hover:bg-cyber-neon/10"
          >
            <Play className="w-4 h-4 mr-2" />
            Start
          </button>
        )}
        
        <button className="cyber-button">
          <Terminal className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
