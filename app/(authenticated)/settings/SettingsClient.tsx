'use client'

import { useState, useEffect } from 'react'
import { PhoneInput } from '@/components/ui/PhoneInput'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

export default function SettingsClient() {
  const router = useRouter()
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState<'account' | 'password' | 'notifications'>('account')
  const [user, setUser] = useState<User | null>(null)

  // Get user on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUser(user)
      else router.push('/login')
    })
  }, [router, supabase])

  if (!user) {
    return (
      <div className="container-custom py-12">
        <div className="py-12 text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-collector-blue"></div>
          <p className="mt-4 text-slate-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container-custom py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-950">Settings</h2>
          <p className="mt-2 text-slate-600">Manage your account and preferences</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-slate-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('account')}
              className={`border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                activeTab === 'account'
                  ? 'border-collector-blue text-collector-blue'
                  : 'border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-950'
              }`}
            >
              Account
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                activeTab === 'password'
                  ? 'border-collector-blue text-collector-blue'
                  : 'border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-950'
              }`}
            >
              Password
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                activeTab === 'notifications'
                  ? 'border-collector-blue text-collector-blue'
                  : 'border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-950'
              }`}
            >
              Notifications
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          {activeTab === 'account' && <AccountTab user={user} />}
          {activeTab === 'password' && <PasswordTab />}
          {activeTab === 'notifications' && <NotificationsTab user={user} />}
        </div>
    </div>
  )
}

// Account Tab Component
function AccountTab({ user }: { user: User }) {
  const [email, setEmail] = useState(user.email || '')
  const [phoneNumber, setPhoneNumber] = useState((user.user_metadata?.phone_number as string) || '')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    const supabase = createClient()

    try {
      // Build updates object
      const updates: {
        email?: string
        data?: { phone_number: string }
      } = {}

      const currentPhone = user.user_metadata?.phone_number as string | undefined

      if (phoneNumber !== currentPhone) {
        updates.data = { phone_number: phoneNumber }
      }

      if (email !== user.email) {
        updates.email = email
      }

      // Only update if there are changes
      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase.auth.updateUser(updates)

        if (updateError) throw updateError

        if (email !== user.email) {
          setSuccess('Account updated! Check your new email address for a verification link.')
        } else {
          setSuccess('Account updated successfully!')
        }
      } else {
        setSuccess('No changes to save')
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update account'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      setError('Please type DELETE to confirm account deletion')
      return
    }

    setDeleting(true)
    setError(null)

    const supabase = createClient()

    try {
      // Get session token for API call
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        throw new Error('No active session')
      }

      // Call backend API to delete account (requires service role)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to delete account')
      }

      // Sign out and redirect
      await supabase.auth.signOut()
      window.location.href = '/login?deleted=true'
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete account'
      setError(errorMessage)
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-4 text-xl font-semibold text-slate-950">Account Information</h2>

        {success && (
          <div className="mb-4 rounded-md border border-success-green bg-green-50 p-3 text-sm text-success-green">
            {success}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-md border border-error-red bg-red-50 p-3 text-sm text-error-red">
            {error}
          </div>
        )}

        <form onSubmit={handleUpdateAccount} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-950">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-collector-blue focus:outline-none focus:ring-2 focus:ring-collector-blue"
            />
            <p className="mt-1 text-xs text-slate-600">Changing your email requires verification</p>
          </div>

          <div>
            <label htmlFor="phoneNumber" className="mb-2 block text-sm font-medium text-slate-950">
              Phone Number
            </label>
            <PhoneInput value={phoneNumber} onChange={setPhoneNumber} required />
            <p className="mt-1 text-xs text-slate-600">
              Used for SMS alert notifications. Number saved in international format (E.164).
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-950">Account Created</label>
            <p className="text-sm text-slate-600">
              {user.created_at
                ? new Date(user.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : 'Unknown'}
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-collector-blue px-6 py-2 font-semibold text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Account Deletion */}
      <div className="border-t border-slate-200 pt-6">
        <h2 className="mb-2 text-xl font-semibold text-error-red">Danger Zone</h2>
        <p className="mb-4 text-sm text-slate-600">
          Once you delete your account, there is no going back. All your searches and alert history
          will be permanently deleted.
        </p>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="rounded-md border-2 border-error-red px-6 py-2 font-semibold text-error-red transition-colors hover:bg-error-red hover:text-white"
          >
            Delete Account
          </button>
        ) : (
          <div className="rounded-lg border-2 border-error-red bg-red-50 p-4">
            <p className="mb-3 font-semibold text-error-red">Are you absolutely sure?</p>
            <p className="mb-4 text-sm text-slate-700">
              Type <span className="font-mono font-bold">DELETE</span> to confirm account deletion:
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="mb-4 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-error-red focus:outline-none focus:ring-2 focus:ring-error-red"
              placeholder="Type DELETE"
            />
            <div className="flex gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={deleting || deleteConfirmText !== 'DELETE'}
                className="rounded-md bg-error-red px-6 py-2 font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Permanently Delete Account'}
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setDeleteConfirmText('')
                }}
                className="rounded-md border border-slate-300 px-6 py-2 font-semibold text-slate-700 transition-colors hover:bg-slate-100"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Password Tab Component
function PasswordTab() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      setLoading(false)
      return
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters')
      setLoading(false)
      return
    }

    const supabase = createClient()

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (updateError) throw updateError

      setSuccess('Password changed successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to change password'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold text-slate-950">Change Password</h2>

      {success && (
        <div className="mb-4 rounded-md border border-success-green bg-green-50 p-3 text-sm text-success-green">
          {success}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-md border border-error-red bg-red-50 p-3 text-sm text-error-red">
          {error}
        </div>
      )}

      <form onSubmit={handleChangePassword} className="space-y-4">
        <div>
          <label
            htmlFor="currentPassword"
            className="mb-2 block text-sm font-medium text-slate-950"
          >
            Current Password
          </label>
          <div className="relative">
            <input
              id="currentPassword"
              type={showCurrentPassword ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 pr-10 focus:border-collector-blue focus:outline-none focus:ring-2 focus:ring-collector-blue"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 focus:outline-none"
              aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
            >
              {showCurrentPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="newPassword" className="mb-2 block text-sm font-medium text-slate-950">
            New Password
          </label>
          <div className="relative">
            <input
              id="newPassword"
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              className="w-full rounded-md border border-slate-300 px-3 py-2 pr-10 focus:border-collector-blue focus:outline-none focus:ring-2 focus:ring-collector-blue"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 focus:outline-none"
              aria-label={showNewPassword ? 'Hide password' : 'Show password'}
            >
              {showNewPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          <p className="mt-1 text-xs text-slate-600">Min 8 characters</p>
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="mb-2 block text-sm font-medium text-slate-950"
          >
            Confirm New Password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              className="w-full rounded-md border border-slate-300 px-3 py-2 pr-10 focus:border-collector-blue focus:outline-none focus:ring-2 focus:ring-collector-blue"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 focus:outline-none"
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-collector-blue px-6 py-2 font-semibold text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Changing...' : 'Change Password'}
        </button>
      </form>
    </div>
  )
}

// Notifications Tab Component
function NotificationsTab({ user: _user }: { user: User }) {
  const [enableSMS, setEnableSMS] = useState(true)
  const [enableNearMiss, setEnableNearMiss] = useState(true)
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false)
  const [quietHoursStart, setQuietHoursStart] = useState('22:00')
  const [quietHoursEnd, setQuietHoursEnd] = useState('08:00')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSaveNotifications = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    const supabase = createClient()

    try {
      // Store in user metadata for now (until backend supports notification preferences)
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          sms_enabled: enableSMS,
          near_miss_enabled: enableNearMiss,
          quiet_hours_enabled: quietHoursEnabled,
          quiet_hours_start: quietHoursStart,
          quiet_hours_end: quietHoursEnd,
        },
      })

      if (updateError) throw updateError

      setSuccess('Notification preferences saved!')
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to save notification preferences'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold text-slate-950">Notification Preferences</h2>

      {success && (
        <div className="mb-4 rounded-md border border-success-green bg-green-50 p-3 text-sm text-success-green">
          {success}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-md border border-error-red bg-red-50 p-3 text-sm text-error-red">
          {error}
        </div>
      )}

      <form onSubmit={handleSaveNotifications} className="space-y-6">
        {/* SMS Notifications */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-950">SMS Notifications</h3>
            <p className="text-sm text-slate-600">Receive text messages when grails are found</p>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={enableSMS}
              onChange={(e) => setEnableSMS(e.target.checked)}
              className="peer sr-only"
            />
            <div className="peer h-6 w-11 rounded-full bg-slate-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-collector-blue peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300"></div>
          </label>
        </div>

        {/* Near Miss Notifications */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-950">Near Miss Alerts</h3>
            <p className="text-sm text-slate-600">
              Get notified when books are within 15% of your price threshold
            </p>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={enableNearMiss}
              onChange={(e) => setEnableNearMiss(e.target.checked)}
              className="peer sr-only"
            />
            <div className="peer h-6 w-11 rounded-full bg-slate-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-collector-blue peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300"></div>
          </label>
        </div>

        {/* Quiet Hours */}
        <div>
          <div className="mb-3 flex items-start justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-950">Quiet Hours</h3>
              <p className="text-sm text-slate-600">Pause notifications during specific hours</p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={quietHoursEnabled}
                onChange={(e) => setQuietHoursEnabled(e.target.checked)}
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-slate-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-collector-blue peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300"></div>
            </label>
          </div>

          {quietHoursEnabled && (
            <div className="ml-4 grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-950">Start Time</label>
                <input
                  type="time"
                  value={quietHoursStart}
                  onChange={(e) => setQuietHoursStart(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-collector-blue focus:outline-none focus:ring-2 focus:ring-collector-blue"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-950">End Time</label>
                <input
                  type="time"
                  value={quietHoursEnd}
                  onChange={(e) => setQuietHoursEnd(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-collector-blue focus:outline-none focus:ring-2 focus:ring-collector-blue"
                />
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-collector-blue px-6 py-2 font-semibold text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Preferences'}
        </button>
      </form>
    </div>
  )
}
