'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Save, RefreshCw, Shield, Bell, Palette, Database } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useAuthStore } from '@/stores/authStore'

interface SettingsForm {
  theme: string
  refreshInterval: number
  notifications: boolean
  autoRefresh: boolean
  language: string
  timezone: string
}

interface PasswordForm {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export function Settings() {
  const [isSaving, setIsSaving] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const { changePassword, user } = useAuthStore()
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SettingsForm>({
    defaultValues: {
      theme: 'dark',
      refreshInterval: 5000,
      notifications: true,
      autoRefresh: true,
      language: 'en',
      timezone: 'UTC',
    },
  })

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    watch,
    formState: { errors: passwordErrors },
  } = useForm<PasswordForm>()

  const newPassword = watch('newPassword')

  const onPasswordSubmit = async (data: PasswordForm) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    setIsChangingPassword(true)
    try {
      await changePassword(data.currentPassword, data.newPassword)
      resetPasswordForm()
      toast.success('Password updated successfully')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to change password')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const onSubmit = async (data: SettingsForm) => {
    setIsSaving(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Save to localStorage
      localStorage.setItem('cyber-settings', JSON.stringify(data))
      
      toast.success('Settings saved successfully')
    } catch (error) {
      toast.error('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-cyber font-bold text-gradient">Settings</h1>
          <p className="text-gray-400 mt-1">Configure your Cyber Container Platform</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Appearance */}
        <div className="cyber-card p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Palette className="w-5 h-5 text-cyber-accent" />
            <h3 className="text-lg font-medium text-white">Appearance</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-cyber-accent mb-2">
                Theme
              </label>
              <select {...register('theme')} className="cyber-input w-full">
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="auto">Auto</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-cyber-accent mb-2">
                Language
              </label>
              <select {...register('language')} className="cyber-input w-full">
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </div>
          </div>
        </div>

        {/* Performance */}
        <div className="cyber-card p-6">
          <div className="flex items-center space-x-2 mb-4">
            <RefreshCw className="w-5 h-5 text-cyber-accent" />
            <h3 className="text-lg font-medium text-white">Performance</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-cyber-accent mb-2">
                Refresh Interval (ms)
              </label>
              <input
                {...register('refreshInterval', { 
                  required: 'Refresh interval is required',
                  min: { value: 1000, message: 'Minimum 1000ms' },
                  max: { value: 60000, message: 'Maximum 60000ms' }
                })}
                type="number"
                className="cyber-input w-full"
                min="1000"
                max="60000"
                step="1000"
              />
              {errors.refreshInterval && (
                <p className="text-cyber-error text-sm mt-1">{errors.refreshInterval.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-cyber-accent mb-2">
                Timezone
              </label>
              <select {...register('timezone')} className="cyber-input w-full">
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="Europe/London">London</option>
                <option value="Europe/Paris">Paris</option>
                <option value="Asia/Tokyo">Tokyo</option>
              </select>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <label className="flex items-center space-x-3">
              <input
                {...register('autoRefresh')}
                type="checkbox"
                className="w-4 h-4 text-cyber-accent bg-cyber-surface border-cyber-border rounded focus:ring-cyber-accent focus:ring-2"
              />
              <span className="text-sm text-gray-300">Enable auto-refresh</span>
            </label>
          </div>
        </div>

        {/* Notifications */}
        <div className="cyber-card p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Bell className="w-5 h-5 text-cyber-accent" />
            <h3 className="text-lg font-medium text-white">Notifications</h3>
          </div>
          
          <div className="space-y-3">
            <label className="flex items-center space-x-3">
              <input
                {...register('notifications')}
                type="checkbox"
                className="w-4 h-4 text-cyber-accent bg-cyber-surface border-cyber-border rounded focus:ring-cyber-accent focus:ring-2"
              />
              <span className="text-sm text-gray-300">Enable notifications</span>
            </label>
            
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                className="w-4 h-4 text-cyber-accent bg-cyber-surface border-cyber-border rounded focus:ring-cyber-accent focus:ring-2"
              />
              <span className="text-sm text-gray-300">Container status changes</span>
            </label>
            
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                className="w-4 h-4 text-cyber-accent bg-cyber-surface border-cyber-border rounded focus:ring-cyber-accent focus:ring-2"
              />
              <span className="text-sm text-gray-300">System alerts</span>
            </label>
            
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                className="w-4 h-4 text-cyber-accent bg-cyber-surface border-cyber-border rounded focus:ring-cyber-accent focus:ring-2"
              />
              <span className="text-sm text-gray-300">Performance warnings</span>
            </label>
          </div>
        </div>

        {/* Security */}
        <div className="cyber-card p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Shield className="w-5 h-5 text-cyber-accent" />
            <h3 className="text-lg font-medium text-white">Security</h3>
          </div>

          {user?.mustChangePassword && (
            <div className="mb-4 p-3 rounded-lg border border-yellow-500/40 bg-yellow-500/10 text-yellow-200 text-sm">
              You must change your password before continuing to use the platform in production.
            </div>
          )}

          <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4 mb-6">
            <h4 className="text-sm font-medium text-gray-300">Change Password</h4>
            <div>
              <label className="block text-sm font-medium text-cyber-accent mb-2">
                Current Password
              </label>
              <input
                {...registerPassword('currentPassword', { required: 'Current password is required' })}
                type="password"
                className="cyber-input w-full"
              />
              {passwordErrors.currentPassword && (
                <p className="text-cyber-error text-sm mt-1">{passwordErrors.currentPassword.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-cyber-accent mb-2">
                New Password
              </label>
              <input
                {...registerPassword('newPassword', {
                  required: 'New password is required',
                  minLength: { value: 12, message: 'Password must be at least 12 characters' },
                })}
                type="password"
                className="cyber-input w-full"
              />
              {passwordErrors.newPassword && (
                <p className="text-cyber-error text-sm mt-1">{passwordErrors.newPassword.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-cyber-accent mb-2">
                Confirm New Password
              </label>
              <input
                {...registerPassword('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value) => value === newPassword || 'Passwords do not match',
                })}
                type="password"
                className="cyber-input w-full"
              />
              {passwordErrors.confirmPassword && (
                <p className="text-cyber-error text-sm mt-1">{passwordErrors.confirmPassword.message}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={isChangingPassword}
              className="cyber-button-primary disabled:opacity-50"
            >
              {isChangingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </form>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-cyber-accent mb-2">
                Session Timeout (minutes)
              </label>
              <input
                type="number"
                className="cyber-input w-full"
                defaultValue="60"
                min="5"
                max="1440"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-cyber-accent mb-2">
                API Rate Limit (requests per minute)
              </label>
              <input
                type="number"
                className="cyber-input w-full"
                defaultValue="100"
                min="10"
                max="1000"
              />
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="cyber-card p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Database className="w-5 h-5 text-cyber-accent" />
            <h3 className="text-lg font-medium text-white">Data Management</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-cyber-accent mb-2">
                Log Retention (days)
              </label>
              <input
                type="number"
                className="cyber-input w-full"
                defaultValue="30"
                min="1"
                max="365"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-cyber-accent mb-2">
                Backup Frequency
              </label>
              <select className="cyber-input w-full">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="never">Never</option>
              </select>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            className="cyber-button"
          >
            Reset to Defaults
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="cyber-button-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                Saving...
              </div>
            ) : (
              <div className="flex items-center">
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </div>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
