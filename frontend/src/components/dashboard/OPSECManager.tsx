'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from 'react-query'
import {
  Shield, Lock, Terminal, Play, Eye, ChevronDown, ChevronUp,
  FileCode, Key, Network, Server
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { apiClient } from '@/lib/api'

interface OPSECProfile {
  id: string
  name: string
  description: string
  image: string
  security_level: string
  icon: string
  category: string
  scripts: string[]
  read_only_root: boolean
  no_new_privileges: boolean
}

interface OPSECScript {
  id: string
  name: string
  description: string
  category: string
  filename: string
  tags: string[]
  preview?: string
  size_bytes?: number
}

interface EncryptedSecret {
  name: string
  category: string
  created_at: string
}

export function OPSECManager() {
  const [deployName, setDeployName] = useState('')
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null)
  const [expandedScript, setExpandedScript] = useState<string | null>(null)
  const [secretName, setSecretName] = useState('')
  const [secretValue, setSecretValue] = useState('')
  const [isDeploying, setIsDeploying] = useState(false)
  const [isStoringSecret, setIsStoringSecret] = useState(false)
  const queryClient = useQueryClient()

  const { data: profilesData } = useQuery('opsec-profiles', async () => {
    const res = await apiClient.get('/opsec/profiles')
    if (!res.ok) throw new Error('Failed to load profiles')
    return res.json()
  })

  const { data: scriptsData } = useQuery('opsec-scripts', async () => {
    const res = await apiClient.get('/opsec/scripts')
    if (!res.ok) throw new Error('Failed to load scripts')
    return res.json()
  })

  const { data: encryptionInfo } = useQuery('encryption-info', async () => {
    const res = await apiClient.get('/opsec/encryption')
    if (!res.ok) throw new Error('Failed to load encryption info')
    return res.json()
  })

  const { data: secretsData } = useQuery('secrets', async () => {
    const res = await apiClient.get('/secrets')
    if (!res.ok) throw new Error('Failed to load secrets')
    return res.json()
  })

  const profiles: OPSECProfile[] = profilesData?.profiles || []
  const scripts: OPSECScript[] = scriptsData?.scripts || []
  const secrets: EncryptedSecret[] = secretsData?.secrets || []

  const levelColor = (level: string) => {
    switch (level) {
      case 'airgap': return 'bg-purple-500/20 text-purple-300 border-purple-500/40'
      case 'maximum': return 'bg-red-500/20 text-red-300 border-red-500/40'
      case 'hardened': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
      default: return 'bg-green-500/20 text-green-300 border-green-500/40'
    }
  }

  const deployProfile = async (profileId: string) => {
    const name = deployName || `${profileId}-${Date.now()}`
    setIsDeploying(true)
    try {
      const res = await apiClient.post('/opsec/deploy', { profile_id: profileId, name })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Deploy failed')
      }
      const data = await res.json()
      toast.success(`OPSEC container "${name}" deployed (${data.security_level})`)
      setDeployName('')
      setSelectedProfile(null)
      queryClient.invalidateQueries('containers')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Deploy failed')
    } finally {
      setIsDeploying(false)
    }
  }

  const storeSecret = async () => {
    if (!secretName || !secretValue) {
      toast.error('Name and value are required')
      return
    }
    setIsStoringSecret(true)
    try {
      const res = await apiClient.post('/secrets', {
        name: secretName,
        value: secretValue,
        category: 'opsec',
      })
      if (!res.ok) throw new Error('Failed to store secret')
      toast.success('Secret encrypted with AES-256-GCM and stored')
      setSecretName('')
      setSecretValue('')
      queryClient.invalidateQueries('secrets')
    } catch {
      toast.error('Failed to store encrypted secret')
    } finally {
      setIsStoringSecret(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-cyber font-bold text-gradient">OPSEC Command Center</h1>
          <p className="text-gray-400 mt-1">
            Government-grade encryption, hardened Linux containers, and preloaded security scripts
          </p>
        </div>
        <div className="flex items-center space-x-2 px-4 py-2 bg-cyber-surface/50 rounded-lg border border-cyber-accent/30">
          <Lock className="w-5 h-5 text-cyber-accent" />
          <span className="text-sm text-cyber-accent font-mono">AES-256-GCM</span>
        </div>
      </div>

      {/* Encryption Info Banner */}
      {encryptionInfo && (
        <div className="cyber-card p-4 border border-cyber-accent/20">
          <div className="flex items-start space-x-3">
            <Shield className="w-6 h-6 text-cyber-accent mt-0.5" />
            <div>
              <h3 className="text-white font-medium">Encryption: {encryptionInfo.algorithm}</h3>
              <p className="text-sm text-gray-400 mt-1">
                {encryptionInfo.authentication} — Compliance: {(encryptionInfo.compliance as string[])?.join(', ')}
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {(encryptionInfo.features as string[])?.slice(0, 4).map((f) => (
                  <span key={f} className="text-xs px-2 py-1 bg-cyber-accent/10 text-cyber-accent rounded">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OPSEC Profiles */}
      <div>
        <h2 className="text-xl font-cyber text-white mb-4 flex items-center">
          <Server className="w-5 h-5 mr-2 text-cyber-accent" />
          Preloaded Linux OPSEC Containers
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map((profile) => (
            <div key={profile.id} className="cyber-card p-5 hover:border-cyber-accent/40 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{profile.icon}</span>
                  <div>
                    <h3 className="text-white font-medium">{profile.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded border ${levelColor(profile.security_level)}`}>
                      {profile.security_level}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-400 mb-3 line-clamp-2">{profile.description}</p>
              <code className="text-xs text-cyber-accent block mb-3 truncate">{profile.image}</code>
              <div className="flex flex-wrap gap-1 mb-4">
                {profile.scripts?.slice(0, 3).map((s) => (
                  <span key={s} className="text-xs px-1.5 py-0.5 bg-cyber-surface text-gray-400 rounded">
                    {s}
                  </span>
                ))}
                {(profile.scripts?.length || 0) > 3 && (
                  <span className="text-xs text-gray-500">+{profile.scripts.length - 3}</span>
                )}
              </div>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Container name..."
                  className="cyber-input flex-1 text-sm"
                  value={selectedProfile === profile.id ? deployName : ''}
                  onFocus={() => setSelectedProfile(profile.id)}
                  onChange={(e) => { setSelectedProfile(profile.id); setDeployName(e.target.value) }}
                />
                <button
                  onClick={() => deployProfile(profile.id)}
                  disabled={isDeploying}
                  className="cyber-button-primary text-sm px-3 disabled:opacity-50"
                >
                  <Play className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* OPSEC Scripts Library */}
      <div>
        <h2 className="text-xl font-cyber text-white mb-4 flex items-center">
          <FileCode className="w-5 h-5 mr-2 text-cyber-accent" />
          OPSEC Script Library ({scripts.length} scripts)
        </h2>
        <div className="space-y-2">
          {scripts.map((script) => (
            <div key={script.id} className="cyber-card p-4">
              <button
                className="w-full flex items-center justify-between text-left"
                onClick={() => setExpandedScript(expandedScript === script.id ? null : script.id)}
              >
                <div className="flex items-center space-x-3">
                  <Terminal className="w-4 h-4 text-cyber-accent" />
                  <div>
                    <span className="text-white font-medium">{script.name}</span>
                    <span className="text-xs text-gray-500 ml-2">{script.filename}</span>
                  </div>
                  <span className="text-xs px-2 py-0.5 bg-cyber-surface rounded text-gray-400">
                    {script.category}
                  </span>
                </div>
                {expandedScript === script.id ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>
              <p className="text-sm text-gray-400 mt-2 ml-7">{script.description}</p>
              {expandedScript === script.id && script.preview && (
                <pre className="mt-3 p-3 bg-black/50 rounded text-xs text-green-400 font-mono overflow-x-auto ml-7">
                  {script.preview}
                </pre>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Encrypted Secrets Vault */}
      <div>
        <h2 className="text-xl font-cyber text-white mb-4 flex items-center">
          <Key className="w-5 h-5 mr-2 text-cyber-accent" />
          Encrypted Secrets Vault
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="cyber-card p-5">
            <h3 className="text-white font-medium mb-4">Store Encrypted Secret</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Secret name"
                className="cyber-input w-full"
                value={secretName}
                onChange={(e) => setSecretName(e.target.value)}
              />
              <textarea
                placeholder="Secret value (encrypted at rest with AES-256-GCM)"
                className="cyber-input w-full h-24 font-mono text-sm"
                value={secretValue}
                onChange={(e) => setSecretValue(e.target.value)}
              />
              <button
                onClick={storeSecret}
                disabled={isStoringSecret}
                className="cyber-button-primary w-full disabled:opacity-50"
              >
                <Lock className="w-4 h-4 mr-2 inline" />
                {isStoringSecret ? 'Encrypting...' : 'Encrypt & Store'}
              </button>
            </div>
          </div>
          <div className="cyber-card p-5">
            <h3 className="text-white font-medium mb-4">Stored Secrets ({secrets.length})</h3>
            {secrets.length === 0 ? (
              <p className="text-gray-500 text-sm">No secrets stored yet.</p>
            ) : (
              <div className="space-y-2">
                {secrets.map((s) => (
                  <div key={s.name} className="flex items-center justify-between p-3 bg-cyber-surface/50 rounded">
                    <div>
                      <span className="text-cyber-accent font-mono text-sm">{s.name}</span>
                      <span className="text-xs text-gray-500 ml-2">{s.category}</span>
                    </div>
                    <span title="Values encrypted — retrieve via API">
                      <Eye className="w-4 h-4 text-gray-500" />
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Container Security Features */}
      <div className="cyber-card p-5">
        <h2 className="text-xl font-cyber text-white mb-4 flex items-center">
          <Network className="w-5 h-5 mr-2 text-cyber-accent" />
          Container Security Controls
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(encryptionInfo?.container_security as string[] || []).map((feature) => (
            <div key={feature} className="p-3 bg-cyber-surface/30 rounded border border-cyber-border text-center">
              <Shield className="w-5 h-5 text-cyber-accent mx-auto mb-1" />
              <span className="text-xs text-gray-300">{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
