'use client'

import { useEffect, useRef, useState } from 'react'
import { apiClient } from '@/lib/api'

export function Terminal() {
  const terminalRef = useRef<HTMLDivElement>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [currentCommand, setCurrentCommand] = useState('')
  const [output, setOutput] = useState<string[]>([])
  const [isExecuting, setIsExecuting] = useState(false)
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

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
    
    // Add command to history
    setCommandHistory(prev => [...prev, command])
    setHistoryIndex(-1)
    
    // Add command to output
    setOutput(prev => [...prev, `cyber@terminal:~$ ${command}`])

    try {
      const cmd = command.trim()
      
      if (cmd === 'clear') {
        setOutput(['cyber@terminal:~$'])
        return
      }
      
      if (cmd === 'help' || cmd === '--help' || cmd === '-h') {
        const result = `╔════════════════════════════════════════════════════════════╗
║          🚀 Cyber Container Platform Terminal           ║
╚════════════════════════════════════════════════════════════╝

📋 Available Commands:

  🐳 Container Commands:
    docker ps                    - List all containers
    docker ps -a                 - List all containers (including stopped)
    docker logs <id>             - View container logs
    docker exec <id> <cmd>       - Execute command inside container
    docker stats                 - Real-time container statistics
    docker start <id>            - Start a container
    docker stop <id>             - Stop a container
    docker restart <id>          - Restart a container
    docker rm <id>               - Remove a container
  
  🖼️ Image Commands:
    docker images                - List all images
    docker pull <image>          - Pull an image
    docker rmi <id>              - Remove an image
  
  🌐 Network Commands:
    docker network ls            - List all networks
    docker network inspect <id>  - Inspect a network
  
  💾 Volume Commands:
    docker volume ls             - List all volumes
  
  🛠️ System Commands:
    docker info                  - Show Docker system information
    docker version               - Show Docker version
    clear                        - Clear terminal
    help                         - Show this help message
  
💡 Tips:
  • Use ↑/↓ arrows to navigate command history
  • Press Ctrl+C to cancel a running command
  • Type 'clear' to clean the terminal output

💻 For more information, visit: https://docs.docker.com`
        setOutput(prev => [...prev, result, ''])
        return
      }

      let result = ''
      
      if (cmd === 'docker ps' || cmd === 'docker ps -a') {
        const response = await apiClient.get('/containers')
        if (response.ok) {
          const data = await response.json()
          const containers = data.containers || []
          if (containers.length === 0) {
            result = 'CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS   PORTS   NAMES\n(no containers)'
          } else {
            result = `CONTAINER ID   IMAGE                    STATUS                PORTS         NAMES`
            containers.forEach((container: any) => {
              const ports = container.ports && container.ports.length > 0 ? container.ports.map((p: any) => `${p.public_port || 0}:${p.private_port}`).join(', ') : '-'
              result += `\n${container.id.substring(0, 12)}   ${(container.image || '').padEnd(24)}${(container.status || '').padEnd(22)}${ports.padEnd(14)}${container.name}`
            })
          }
        } else {
          result = `Error: Failed to fetch containers`
        }
      } else if (cmd === 'docker images') {
        const response = await apiClient.get('/images')
        if (response.ok) {
          const data = await response.json()
          const images = data.images || []
          if (images.length === 0) {
            result = 'REPOSITORY   TAG   IMAGE ID   CREATED   SIZE\n(no images)'
          } else {
            result = `REPOSITORY                TAG        IMAGE ID       SIZE`
            images.forEach((img: any) => {
              const tags = img.RepoTags || ['<none>:<none>']
              tags.forEach((tag: string) => {
                const [repo, tagName] = tag.split(':')
                const size = img.Size ? (img.Size / 1024 / 1024).toFixed(1) + 'MB' : 'N/A'
                result += `\n${(repo || '<none>').padEnd(22)}    ${(tagName || '<none>').padEnd(10)} ${(img.Id || '').substring(7, 19)}   ${size}`
              })
            })
          }
        } else {
          result = 'Error: Failed to fetch images'
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
      } else if (cmd.startsWith('docker exec ')) {
        // Parse: docker exec [-it] <container> <command...>
        const parts = cmd.split(/\s+/).slice(2) // remove "docker exec"
        // Strip flags like -it, -i, -t, --interactive, --tty, -d, --detach
        const filtered = parts.filter(p => !p.match(/^-/))
        if (filtered.length < 2) {
          result = `Error: Usage: docker exec <container> <command>`
        } else {
          const containerId = filtered[0]
          const execCommand = filtered.slice(1)
          
          try {
            const response = await apiClient.post(`/containers/${containerId}/exec`, {
              command: execCommand
            })
            
            if (response.ok) {
              const data = await response.json()
              result = data.output || '(no output)'
            } else {
              const errorData = await response.clone().json().catch(() => ({}))
              result = `Error: ${errorData.error || 'Failed to execute command'}`
            }
          } catch (execError) {
            result = `Error: ${execError instanceof Error ? execError.message : 'Failed to execute command'}`
          }
        }
      } else if (cmd.startsWith('docker start ')) {
        const containerId = cmd.split(/\s+/)[2]
        if (containerId) {
          const response = await apiClient.post(`/containers/${containerId}/start`)
          if (response.ok) {
            result = containerId
          } else {
            const err = await response.clone().json().catch(() => ({}))
            result = `Error: ${err.error || 'Failed to start container'}`
          }
        } else {
          result = 'Error: Please specify container ID or name'
        }
      } else if (cmd.startsWith('docker stop ')) {
        const containerId = cmd.split(/\s+/)[2]
        if (containerId) {
          const response = await apiClient.post(`/containers/${containerId}/stop`)
          if (response.ok) {
            result = containerId
          } else {
            const err = await response.clone().json().catch(() => ({}))
            result = `Error: ${err.error || 'Failed to stop container'}`
          }
        } else {
          result = 'Error: Please specify container ID or name'
        }
      } else if (cmd.startsWith('docker rm ')) {
        const containerId = cmd.split(/\s+/)[2]
        if (containerId) {
          const response = await apiClient.delete(`/containers/${containerId}`)
          if (response.ok) {
            result = containerId
          } else {
            const err = await response.clone().json().catch(() => ({}))
            result = `Error: ${err.error || 'Failed to remove container'}`
          }
        } else {
          result = 'Error: Please specify container ID or name'
        }
      } else if (cmd.startsWith('docker pull ')) {
        const imageName = cmd.split(/\s+/)[2]
        if (imageName) {
          setOutput(prev => [...prev, `Pulling image ${imageName}...`])
          const response = await apiClient.post('/images/pull', { image: imageName })
          if (response.ok) {
            result = `Successfully pulled ${imageName}`
          } else {
            const err = await response.clone().json().catch(() => ({}))
            result = `Error: ${err.error || 'Failed to pull image'}`
          }
        } else {
          result = 'Error: Please specify image name'
        }
      } else if (cmd === 'docker volume ls') {
        const response = await apiClient.get('/volumes')
        if (response.ok) {
          const data = await response.json()
          const volumes = data.volumes || []
          if (volumes.length === 0) {
            result = 'DRIVER   VOLUME NAME\n(no volumes)'
          } else {
            result = 'DRIVER    VOLUME NAME'
            volumes.forEach((vol: any) => {
              result += `\n${(vol.driver || 'local').padEnd(10)}${vol.name}`
            })
          }
        } else {
          result = 'Error: Failed to fetch volumes'
        }
      } else if (cmd === 'docker info' || cmd === 'docker system info') {
        const response = await apiClient.get('/system/info')
        if (response.ok) {
          const data = await response.json()
          result = `Containers: ${data.containers || 0}
 Running: ${data.containers_running || 0}
 Paused: ${data.containers_paused || 0}
 Stopped: ${data.containers_stopped || 0}
Images: ${data.images || 0}
Server Version: ${data.docker_version || 'N/A'}
Operating System: ${data.os || 'N/A'}
Architecture: ${data.architecture || 'N/A'}
CPUs: ${data.cpus || 'N/A'}
Total Memory: ${data.memory_limit ? (data.memory_limit / 1024 / 1024 / 1024).toFixed(1) + 'GB' : 'N/A'}`
        } else {
          result = 'Error: Failed to fetch system info'
        }
      } else {
        result = `Command not found: ${command}\nType 'help' for available commands`
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
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1)
        setHistoryIndex(newIndex)
        setCurrentCommand(commandHistory[newIndex])
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIndex !== -1) {
        if (historyIndex === commandHistory.length - 1) {
          setHistoryIndex(-1)
          setCurrentCommand('')
        } else {
          const newIndex = historyIndex + 1
          setHistoryIndex(newIndex)
          setCurrentCommand(commandHistory[newIndex])
        }
      }
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
            { cmd: 'docker network ls', desc: 'List networks' },
            { cmd: 'help', desc: 'Show help' },
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
