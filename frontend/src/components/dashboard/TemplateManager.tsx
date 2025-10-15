'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Plus, Trash2, RefreshCw, FileText, Edit, Play } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Template {
  id: number
  name: string
  description: string
  image: string
  config: string
  created_at: string
}

export function TemplateManager() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const queryClient = useQueryClient()

  const { data: templates = [], isLoading, error } = useQuery<Template[]>(
    'templates',
    async () => {
      const response = await fetch('http://localhost:8080/api/v1/templates', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('cyber-auth-storage')}`,
        },
      })
      if (!response.ok) throw new Error('Failed to fetch templates')
      const data = await response.json()
      return data.templates
    }
  )

  const deleteTemplateMutation = useMutation(
    async (id: number) => {
      const response = await fetch(`http://localhost:8080/api/v1/templates/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('cyber-auth-storage')}`,
        },
      })
      if (!response.ok) throw new Error('Failed to delete template')
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('templates')
        toast.success('Template deleted successfully')
      },
      onError: () => {
        toast.error('Failed to delete template')
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
        <p className="text-cyber-error">Failed to load templates</p>
        <button 
          onClick={() => queryClient.invalidateQueries('templates')}
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
          <h1 className="text-3xl font-cyber font-bold text-gradient">Templates</h1>
          <p className="text-gray-400 mt-1">Manage container templates and configurations</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="cyber-button-primary"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Template
        </button>
      </div>

      {/* Templates Grid */}
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
      ) : templates.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-cyber-surface/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-medium text-gray-400 mb-2">No templates found</h3>
          <p className="text-gray-500 mb-4">Create your first template to get started</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="cyber-button-primary"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div key={template.id} className="cyber-card p-6 group">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-medium text-white truncate">{template.name}</h3>
                  <p className="text-sm text-gray-400">{template.image}</p>
                </div>
                <button
                  onClick={() => deleteTemplateMutation.mutate(template.id)}
                  className="p-2 text-cyber-error hover:bg-cyber-error/10 rounded transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Description */}
              {template.description && (
                <div className="mb-4">
                  <p className="text-sm text-gray-300 line-clamp-2">{template.description}</p>
                </div>
              )}

              {/* Details */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Created</span>
                  <span className="text-xs text-gray-400">{formatDate(template.created_at)}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Config Size</span>
                  <span className="text-xs text-cyber-accent">
                    {Math.round(template.config.length / 1024)}KB
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <button className="flex-1 cyber-button text-xs">
                  <Play className="w-3 h-3 mr-1" />
                  Deploy
                </button>
                <button className="cyber-button text-xs">
                  <Edit className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
