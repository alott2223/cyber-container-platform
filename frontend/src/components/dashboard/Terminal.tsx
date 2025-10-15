'use client'

import { useEffect, useRef, useState } from 'react'

export function Terminal() {
  const terminalRef = useRef<HTMLDivElement>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [currentCommand, setCurrentCommand] = useState('')
  const [output, setOutput] = useState<string[]>([])

  useEffect(() => {
    // Initialize terminal
    setIsConnected(true)
    setOutput([
      'Cyber Container Platform Terminal',
      'Connected to Docker Engine',
      '',
      'Available commands:',
      '  docker ps          - List containers',
      '  docker images       - List images',
      '  docker logs <id>    - View container logs',
      '  docker exec <id>    - Execute command in container',
      '  clear              - Clear terminal',
      '  help               - Show help',
      '',
      'cyber@terminal:~$'
    ])
  }, [])

  const executeCommand = (command: string) => {
    if (!command.trim()) return

    // Add command to output
    setOutput(prev => [...prev, `cyber@terminal:~$ ${command}`])

    // Simulate command execution
    setTimeout(() => {
      let result = ''
      switch (command.trim()) {
        case 'docker ps':
          result = `CONTAINER ID   IMAGE     COMMAND                  CREATED        STATUS        PORTS     NAMES
93b3b478f5a4   nginx     "/docker-entrypoint.…"   2 hours ago   Up 2 hours   80/tcp    nginx-web
19f0473b2e9a   redis     "docker-entrypoint.s…"   1 hour ago    Up 1 hour    6379/tcp  redis-cache`
          break
        case 'docker images':
          result = `REPOSITORY   TAG       IMAGE ID       CREATED        SIZE
nginx        latest    f6987c8d6ed5   2 weeks ago    142MB
redis        alpine    59b6e6946534   3 weeks ago    32.4MB`
          break
        case 'docker stats':
          result = `CONTAINER ID   NAME        CPU %     MEM USAGE / LIMIT     MEM %     NET I/O     BLOCK I/O     PIDS
93b3b478f5a4   nginx-web   0.00%     2.5MiB / 1GiB       0.25%     0B / 0B      0B / 0B        2
19f0473b2e9a   redis-cache 0.01%     1.2MiB / 1GiB       0.12%     0B / 0B      0B / 0B        1`
          break
        case 'docker network ls':
          result = `NETWORK ID     NAME           DRIVER    SCOPE
1fd71c12db2e   bridge         bridge    local
1ae36847afda   host           host      local
1eb867ed7ca4   none           null      local
5c391cb732d5   test-network   bridge    local
d8f24e0f30e9   web-network    bridge    local`
          break
        case 'clear':
          setOutput(['cyber@terminal:~$'])
          return
        case 'help':
          result = `Available commands:
  docker ps          - List containers
  docker images       - List images
  docker stats        - Container stats
  docker network ls   - List networks
  clear              - Clear terminal
  help               - Show this help`
          break
        default:
          result = `Command not found: ${command}`
      }
      
      setOutput(prev => [...prev, result, ''])
    }, 300)
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
              placeholder="Enter command..."
              autoFocus
            />
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
