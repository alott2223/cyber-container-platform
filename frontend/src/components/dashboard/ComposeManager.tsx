'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { 
  Play, 
  Square, 
  Trash2, 
  Plus, 
  FileText, 
  Upload,
  Download,
  Edit,
  RefreshCw
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { apiClient } from '@/lib/api'

interface ComposeProject {
  name: string
  status: 'running' | 'stopped' | 'partial'
  services: ComposeService[]
  file_path: string
  created_at: string
}

interface ComposeService {
  name: string
  image: string
  status: 'running' | 'stopped' | 'error'
  ports: string[]
  container_id?: string
}

export function ComposeManager() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState<ComposeProject | null>(null)
  const queryClient = useQueryClient()

  // Mock data for now - would connect to real Docker Compose API
  const { data: projects = [], isLoading } = useQuery<ComposeProject[]>(
    'compose-projects',
    async () => {
      // This would be a real API call to list compose projects
      return [
        {
          name: 'web-stack',
          status: 'stopped' as const,
          services: [
            {
              name: 'nginx',
              image: 'nginx:alpine',
              status: 'stopped' as const,
              ports: ['80:80', '443:443']
            },
            {
              name: 'redis',
              image: 'redis:alpine', 
              status: 'stopped' as const,
              ports: ['6379:6379']
            },
            {
              name: 'postgres',
              image: 'postgres:13',
              status: 'stopped' as const,
              ports: ['5432:5432']
            }
          ],
          file_path: '/app/docker-compose.yml',
          created_at: new Date().toISOString()
        },
        {
          name: 'monitoring-stack',
          status: 'stopped' as const,
          services: [
            {
              name: 'prometheus',
              image: 'prom/prometheus',
              status: 'stopped' as const,
              ports: ['9090:9090']
            },
            {
              name: 'grafana',
              image: 'grafana/grafana',
              status: 'stopped' as const,
              ports: ['3000:3000']
            }
          ],
          file_path: '/app/monitoring/docker-compose.yml',
          created_at: new Date().toISOString()
        }
      ]
    }
  )

  const startProject = async (projectName: string) => {
    try {
      // Would execute: docker-compose -f <file> up -d
      toast.success(`Started ${projectName} stack`)
      queryClient.invalidateQueries('compose-projects')
    } catch (error) {
      toast.error(`Failed to start ${projectName}`)
    }
  }

  const stopProject = async (projectName: string) => {
    try {
      // Would execute: docker-compose -f <file> down
      toast.success(`Stopped ${projectName} stack`)
      queryClient.invalidateQueries('compose-projects')
    } catch (error) {
      toast.error(`Failed to stop ${projectName}`)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'text-green-400'
      case 'partial':
        return 'text-yellow-400'
      case 'stopped':
        return 'text-gray-400'
      case 'error':
        return 'text-red-400'
      default:
        return 'text-gray-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return '🟢'
      case 'partial':
        return '🟡'
      case 'stopped':
        return '⚫'
      case 'error':
        return '🔴'
      default:
        return '⚫'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-cyber font-bold text-gradient">Docker Compose</h1>
          <p className="text-gray-400 mt-1">Manage multi-container applications</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="cyber-button-primary"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Stack
        </button>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
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
      ) : projects.length === 0 ? (
        <div className="cyber-card p-12 text-center">
          <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-400 mb-2">No compose projects</h3>
          <p className="text-gray-500 mb-4">Create your first Docker Compose stack</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="cyber-button-primary"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Stack
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {projects.map((project) => (
            <div key={project.name} className="cyber-card p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium text-white mb-1">{project.name}</h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">{getStatusIcon(project.status)}</span>
                    <span className={`text-sm ${getStatusColor(project.status)}`}>
                      {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                    </span>
                  </div>
                </div>
                <button className="cyber-button text-xs">
                  <Edit className="w-3 h-3" />
                </button>
              </div>

              {/* Services */}
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2">Services ({project.services.length})</p>
                <div className="space-y-2">
                  {project.services.map((service) => (
                    <div key={service.name} className="flex items-center justify-between p-2 bg-cyber-surface/30 rounded">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs">{getStatusIcon(service.status)}</span>
                        <span className="text-sm text-white">{service.name}</span>
                        <span className="text-xs text-gray-400">{service.image}</span>
                      </div>
                      {service.ports.length > 0 && (
                        <span className="text-xs text-cyber-accent">
                          {service.ports.join(', ')}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* File Path */}
              <div className="mb-4 p-2 bg-cyber-surface/20 rounded">
                <p className="text-xs text-gray-500">Compose File</p>
                <p className="text-xs text-gray-400 font-mono">{project.file_path}</p>
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                {project.status === 'running' || project.status === 'partial' ? (
                  <button
                    onClick={() => stopProject(project.name)}
                    className="flex-1 cyber-button text-cyber-warning border-cyber-warning hover:bg-cyber-warning/10"
                  >
                    <Square className="w-4 h-4 mr-2" />
                    Stop Stack
                  </button>
                ) : (
                  <button
                    onClick={() => startProject(project.name)}
                    className="flex-1 cyber-button text-cyber-neon border-cyber-neon hover:bg-cyber-neon/10"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Stack
                  </button>
                )}
                <button className="cyber-button">
                  <Download className="w-4 h-4" />
                </button>
                <button className="cyber-button text-cyber-error border-cyber-error hover:bg-cyber-error/10">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Templates */}
      <div className="cyber-card p-6">
        <h3 className="text-lg font-medium text-white mb-4">Quick Start Templates</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              name: 'LAMP Stack',
              description: 'Apache, MySQL, PHP',
              services: ['apache', 'mysql', 'php']
            },
            {
              name: 'MEAN Stack', 
              description: 'MongoDB, Express, Angular, Node.js',
              services: ['mongodb', 'node', 'nginx']
            },
            {
              name: 'Monitoring',
              description: 'Prometheus, Grafana, AlertManager',
              services: ['prometheus', 'grafana', 'alertmanager']
            }
          ].map((template) => (
            <button
              key={template.name}
              className="cyber-card p-4 text-left hover:border-cyber-accent/50 transition-all"
            >
              <h4 className="text-white font-medium mb-1">{template.name}</h4>
              <p className="text-xs text-gray-400 mb-2">{template.description}</p>
              <div className="flex flex-wrap gap-1">
                {template.services.map((service) => (
                  <span
                    key={service}
                    className="px-2 py-1 bg-cyber-accent/20 text-cyber-accent text-xs rounded"
                  >
                    {service}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
