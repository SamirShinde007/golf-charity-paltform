'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Heart, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [password, setPassword] = useState('')

  useEffect(() => {
    // Listen for the recovery session from the URL hash
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        // Recovery session established!
        setError('')
      } else if (!session && event === 'SIGNED_OUT') {
        setError('Your session has expired or the link is invalid. Please request a new password reset link.')
      }
    })

    // Immediate check
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session && !window.location.hash.includes('access_token')) {
        setError('No active session found. Please ensure you clicked the link in your email.')
      }
    }
    checkSession()

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })
      if (error) throw error
      setSuccess(true)
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Error updating password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen mesh-bg flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Link href="/" className="flex items-center gap-2 justify-center mb-8 font-display font-bold text-xl">
          <div className="w-8 h-8 bg-jade-500 rounded-lg flex items-center justify-center">
            <Heart className="w-4 h-4 text-white fill-current" />
          </div>
          GreenHeart
        </Link>

        <div className="glass rounded-2xl p-8">
          <h1 className="font-display text-3xl font-bold mb-2">Update Password</h1>
          <p className="text-muted-foreground mb-8">Enter your new secure password below.</p>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl px-4 py-3 mb-6">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm rounded-xl px-4 py-4 mb-6 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Password updated!</p>
                <p className="opacity-90 mt-1">Redirecting you to dashboard...</p>
              </div>
            </div>
          )}

          {!success && (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">New Password</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} required minLength={6}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full bg-input border border-border rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-jade-500/50 transition"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Password must be at least 6 characters.</p>
              </div>
              
              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-jade-500 hover:bg-jade-400 disabled:opacity-60 text-white py-3 rounded-xl font-semibold transition-all mt-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <><span>Update Password</span><ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  )
}
