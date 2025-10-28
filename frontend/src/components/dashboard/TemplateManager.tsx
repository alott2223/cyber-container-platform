'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Plus, Trash2, RefreshCw, FileText, Edit, Play, ExternalLink, BookOpen } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { containerTemplates, ContainerTemplate, getTemplatesByCategory } from '@/data/templates'
import { apiClient } from '@/lib/api'

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
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedTemplate, setSelectedTemplate] = useState<ContainerTemplate | null>(null)
  const queryClient = useQueryClient()
  
  const categories = ['all', 'web', 'database', 'cache', 'language', 'utility']

  const deployTemplate = async (template: ContainerTemplate) => {
    try {
      const portMapping: Record<string, string> = {}
      Object.entries(template.ports).forEach(([host, container]) => {
        portMapping[host] = container
      })

      const response = await apiClient.post('/containers', {
        name: `${template.id}-${Date.now()}`,
        image: template.image,
        ports: portMapping,
        environment: template.environment,
        volumes: template.volumes,
        networks: template.networks,
      })

      if (!response.ok) throw new Error('Failed to deploy template')
      
      toast.success(`${template.name} deployed successfully!`)
      queryClient.invalidateQueries('containers')
    } catch (error) {
      toast.error(`Failed to deploy ${template.name}`)
    }
  }

  const filteredTemplates = selectedCategory === 'all' 
    ? containerTemplates 
    : getTemplatesByCategory(selectedCategory as ContainerTemplate['category'])

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
          <h1 className="text-3xl font-cyber font-bold text-gradient">Container Templates</h1>
          <p className="text-gray-400 mt-1">Deploy pre-configured containers with one click</p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-lg transition-all ${
              selectedCategory === category
                ? 'bg-cyber-accent text-black font-medium'
                : 'bg-cyber-surface text-gray-400 hover:bg-cyber-surface/80'
            }`}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <div key={template.id} className="cyber-card p-6 group hover:border-cyber-accent/50 transition-all">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span className="text-3xl">{template.icon}</span>
                <div>
                  <h3 className="text-lg font-medium text-white">{template.name}</h3>
                  <p className="text-xs text-gray-400 capitalize">{template.category}</p>
                </div>
              </div>
              <span className={`px-2 py-1 text-xs rounded ${
                template.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
                template.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {template.difficulty}
              </span>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-300 mb-4 line-clamp-2">{template.description}</p>

            {/* Image */}
            <div className="mb-4 p-2 bg-cyber-surface/50 rounded">
              <code className="text-xs text-cyber-accent">{template.image}</code>
            </div>

            {/* Ports */}
            {Object.keys(template.ports).length > 0 && (
              <div className="mb-4">
                <span className="text-xs text-gray-500">Ports: </span>
                <span className="text-xs text-cyber-accent">
                  {Object.entries(template.ports).map(([host, container]) => 
                    `${host}:${container}`
                  ).join(', ')}
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-2">
              <button 
                onClick={() => deployTemplate(template)}
                className="flex-1 cyber-button-primary text-sm"
              >
                <Play className="w-4 h-4 mr-2" />
                Deploy
              </button>
              {template.documentation && (
                <a
                  href={template.documentation}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cyber-button text-sm"
                >
                  <BookOpen className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
