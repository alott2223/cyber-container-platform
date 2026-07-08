'use client'

import { useQuery } from 'react-query'
import { Shield, Lock, Terminal, Mountain, AlertTriangle } from 'lucide-react'
import { apiClient } from '@/lib/api'
import type { Container } from '../ContainerList'

interface WorkspaceOPSECProps {
  container: Container
  onRunCommand: (cmd: string) => void
  connected: boolean
}

const OPSEC_SCRIPTS = [
  { id: 'opsec-baseline', label: 'OPSEC Baseline', cmd: '/opsec/scripts/opsec-baseline.sh\r' },
  { id: 'network-lockdown', label: 'Network Lockdown', cmd: '/opsec/scripts/network-lockdown.sh\r' },
  { id: 'dns-hardening', label: 'DNS Hardening', cmd: '/opsec/scripts/dns-hardening.sh\r' },
  { id: 'integrity-check', label: 'Integrity Check', cmd: '/opsec/scripts/integrity-check.sh\r' },
  { id: 'audit-setup', label: 'Audit Setup', cmd: '/opsec/scripts/audit-setup.sh\r' },
  { id: 'secure-wipe', label: 'Secure Wipe', cmd: '/opsec/scripts/secure-wipe.sh\r' },
]

export function WorkspaceOPSEC({ container, onRunCommand, connected }: WorkspaceOPSECProps) {
  const isAlpine = container.image?.toLowerCase().includes('alpine')
  const isOPSEC = container.name?.toLowerCase().includes('opsec') || container.labels?.['opsec.profile']

  const { data: encryption } = useQuery('opsec-encryption', async () => {
    const response = await apiClient.get('/opsec/encryption')
    if (!response.ok) return null
    return response.json()
  })

  const { data: profiles } = useQuery('opsec-profiles', async () => {
    const response = await apiClient.get('/opsec/profiles')
    if (!response.ok) return { profiles: [] }
    return response.json()
  })

  const matchedProfile = profiles?.profiles?.find((p: { image: string }) =>
    container.image?.includes(p.image?.split(':')[0])
  )

  return (
    <div className="flex flex-col h-full p-4 overflow-auto cyber-scrollbar">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-12 h-12 rounded-lg bg-cyber-accent/20 flex items-center justify-center">
          <Shield className="w-6 h-6 text-cyber-accent" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-white">OPSEC Security Panel</h3>
          <p className="text-sm text-gray-400">Container hardening and encryption status</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="cyber-card p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Lock className="w-4 h-4 text-cyber-neon" />
            <h4 className="text-sm font-medium text-white">Encryption Vault</h4>
          </div>
          {encryption ? (
            <div className="space-y-2 text-sm">
              <p className="text-gray-400">
                Algorithm: <span className="text-cyber-accent font-mono">{encryption.algorithm || 'AES-256-GCM'}</span>
              </p>
              <p className="text-gray-400">
                Status: <span className="text-cyber-neon">{encryption.status || 'Active'}</span>
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Loading encryption info...</p>
          )}
        </div>

        <div className="cyber-card p-4">
          <div className="flex items-center space-x-2 mb-3">
            {isAlpine ? <Mountain className="w-4 h-4 text-cyber-accent" /> : <Terminal className="w-4 h-4 text-cyber-accent" />}
            <h4 className="text-sm font-medium text-white">Container Profile</h4>
          </div>
          <div className="space-y-2 text-sm">
            <p className="text-gray-400">
              Image: <span className="text-white font-mono text-xs">{container.image}</span>
            </p>
            {matchedProfile ? (
              <p className="text-gray-400">
                OPSEC Profile: <span className="text-cyber-neon">{matchedProfile.name}</span>
              </p>
            ) : (
              <p className="text-gray-500">No matching OPSEC profile</p>
            )}
            {isOPSEC && (
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-cyber-neon/20 text-cyber-neon text-xs">
                Hardened Container
              </span>
            )}
          </div>
        </div>
      </div>

      {container.state !== 'running' ? (
        <div className="cyber-card p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
          <p className="text-gray-400">Start the container to run OPSEC scripts</p>
        </div>
      ) : (
        <>
          <h4 className="text-sm text-cyber-accent mb-3">Security Scripts</h4>
          <p className="text-xs text-gray-500 mb-4">
            Run scripts in the terminal tab. Switch to Terminal first, or click below to execute directly.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {OPSEC_SCRIPTS.map((script) => (
              <button
                key={script.id}
                onClick={() => onRunCommand(script.cmd)}
                disabled={!connected}
                className="cyber-card p-4 text-left hover:border-cyber-accent/50 transition-colors disabled:opacity-40 group"
              >
                <Shield className="w-4 h-4 text-cyber-accent mb-2 group-hover:text-cyber-neon transition-colors" />
                <p className="text-sm text-white font-medium">{script.label}</p>
                <p className="text-xs text-gray-500 mt-1 font-mono">/opsec/scripts/{script.id}.sh</p>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
