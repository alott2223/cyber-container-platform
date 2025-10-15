'use client'

import { useEffect, useRef, useState } from 'react'
import { apiClient } from '@/lib/api'

export function Terminal() {
  const terminalRef = useRef<HTMLDivElement>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [currentCommand, setCurrentCommand] = useState('')
  const [output, setOutput] = useState<string[]>([])
  const [isExecuting, setIsExecuting] = useState(false)

  useEffect(() => {
    // Initialize terminal
    setIsConnected(true)
    setOutput([
      'Cyber Container Platform Terminal',
      'Connected to Docker Engine',
      '',
      'Available commands:',
      '  docker ps          - List containers',
      '  docker images      - List images',
      '  docker logs <id>   - View container logs',
      '  docker stats       - Container stats',
      '  docker network ls  - List networks',
      '  clear             - Clear terminal',
      '  help              - Show help',
      '',
      'cyber@terminal:~$'
    ])
  }, [])

  const executeCommand = async (command: string) => {
    if (!command.trim() || isExecuting) return

    setIsExecuting(true)
    
    // Add command to output
    setOutput(prev => [...prev, `cyber@terminal:~$ ${command}`])

    try {
      const cmd = command.trim()
      
      if (cmd === 'clear') {
        setOutput(['cyber@terminal:~$'])
        return
      }
      
      if (cmd === 'help') {
        const result = `Available commands:
  docker ps          - List containers
  docker images      - List images
  docker stats       - Container stats
  docker network ls  - List networks
  clear             - Clear terminal
  help              - Show this help`
        setOutput(prev => [...prev, result, ''])
        return
      }

      let result = ''
      
      if (cmd === 'docker ps') {
        const response = await apiClient.get('/containers')
        if (response.ok) {
          const data = await response.json()
          result = `CONTAINER ID   IMAGE     COMMAND                  CREATED        STATUS        PORTS     NAMES`
          data.containers.forEach((container: any) => {
            const ports = container.ports ? container.ports.map((p: any) => `${p.public_port}:${p.private_port}`).join(', ') : '-'
            result += `\n${container.id.substring(0, 12)}   ${container.image}     "${container.command || 'N/A'}"    ${new Date(container.created).toLocaleDateString()}   ${container.status}   ${ports}   ${container.name}`
          })
        } else {
          result = `Error: Failed to fetch containers`
        }
      } else if (cmd === 'docker images') {
        const response = await apiClient.get('/images')
        if (response.ok) {
          const data = await response.json()
          result = `REPOSITORY   TAG       IMAGE ID       CREATED        SIZE`
          data.images.forEach((image: any) => {
            const repo = image.RepoTags && image.RepoTags.length > 0 ? image.RepoTags[0].split(':')[0] : '<none>'
            const tag = image.RepoTags && image.RepoTags.length > 0 ? image.RepoTags[0].split(':')[1] : '<none>'
            const size = Math.round(image.Size / 1024 / 1024) + 'MB'
            result += `\n${repo}   ${tag}   ${image.ID.substring(7, 19)}   ${new Date(image.Created * 1000).toLocaleDateString()}   ${size}`
          })
        } else {
          result = `Error: Failed to fetch images`
        }
      } else if (cmd === 'docker network ls') {
        const response = await apiClient.get('/networks')
        if (response.ok) {
          const data = await response.json()
          result = `NETWORK ID     NAME           DRIVER    SCOPE`
          data.networks.forEach((network: any) => {
            result += `\n${network.id.substring(0, 12)}   ${network.name}           ${network.driver}    ${network.scope}`
          })
        } else {
          result = `Error: Failed to fetch networks`
        }
      } else if (cmd.startsWith('docker logs ')) {
        const containerId = cmd.split(' ')[2]
        if (containerId) {
          const response = await apiClient.get(`/containers/${containerId}/logs`)
          if (response.ok) {
            result = await response.text()
          } else {
            result = `Error: Failed to fetch logs for container ${containerId}`
          }
        } else {
          result = `Error: Please specify container ID`
        }
      } else {
        result = `Command not found: ${command}`
      }
      
      setOutput(prev => [...prev, result, ''])
    } catch (error) {
      setOutput(prev => [...prev, `Error: ${error instanceof Error ? error.message : 'Unknown error'}`, ''])
    } finally {
      setIsExecuting(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeCommand(currentCommand)
      setCurrentCommand('')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-cyber font-bold text-gradient">Terminal</h1>
          <p className="text-gray-400 mt-1">Interactive Docker command interface</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-cyber-neon' : 'bg-gray-500'}`}></div>
          <span className="text-sm text-gray-400">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Terminal */}
      <div className="cyber-card p-0 overflow-hidden">
        <div 
          ref={terminalRef} 
          className="h-96 w-full overflow-y-auto bg-black p-4 font-mono text-sm text-green-400"
          style={{ 
            fontFamily: 'JetBrains Mono, Consolas, monospace',
            fontSize: '14px',
            lineHeight: '1.2'
          }}
        >
          {output.map((line, index) => (
            <div key={index} className="text-gray-300 whitespace-pre-wrap">
              {line}
            </div>
          ))}
                  <div className="flex items-center">
                    <span className="text-cyan-400">cyber@terminal:~$</span>
                    <input
                      type="text"
                      value={currentCommand}
                      onChange={(e) => setCurrentCommand(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="bg-transparent border-none outline-none text-white ml-2 flex-1"
                      placeholder={isExecuting ? "Executing..." : "Enter command..."}
                      disabled={isExecuting}
                      autoFocus
                    />
                    {isExecuting && (
                      <span className="text-yellow-400 ml-2">⏳</span>
                    )}
                  </div>
        </div>
      </div>

      {/* Quick Commands */}
      <div className="cyber-card p-4">
        <h3 className="text-sm font-medium text-cyber-accent mb-3">Quick Commands</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { cmd: 'docker ps', desc: 'List containers' },
            { cmd: 'docker images', desc: 'List images' },
            { cmd: 'docker stats', desc: 'Container stats' },
            { cmd: 'docker network ls', desc: 'List networks' },
          ].map((item, index) => (
                    <button
                      key={index}
                      className="cyber-button text-xs text-left p-2"
                      onClick={() => {
                        executeCommand(item.cmd)
                      }}
                      disabled={isExecuting}
                    >
              <div className="font-mono text-cyber-accent">{item.cmd}</div>
              <div className="text-gray-400 text-xs">{item.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
