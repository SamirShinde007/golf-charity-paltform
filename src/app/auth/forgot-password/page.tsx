'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Heart, ArrowRight, Loader2, Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [email, setEmail] = useState('')

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      })
      if (error) throw error
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Error sending password reset email. Please try again.')
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
          <h1 className="font-display text-3xl font-bold mb-2">Reset Password</h1>
          <p className="text-muted-foreground mb-8">Enter your email to receive a password reset link.</p>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl px-4 py-3 mb-6">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm rounded-xl px-4 py-4 mb-6 flex items-start gap-3">
              <Mail className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Check your email</p>
                <p className="opacity-90 mt-1">We've sent a password reset link to {email}</p>
              </div>
            </div>
          )}

          {!success ? (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input type="email" required value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-jade-500/50 transition"
                />
              </div>
              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-jade-500 hover:bg-jade-400 disabled:opacity-60 text-white py-3 rounded-xl font-semibold transition-all mt-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <><span>Send Reset Link</span><ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>
          ) : (
            <Link href="/auth/login" className="w-full flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/80 text-foreground py-3 rounded-xl font-semibold transition-all mt-2">
              Back to Sign In
            </Link>
          )}

          {!success && (
            <p className="text-center text-sm text-muted-foreground mt-6">
              Remember your password?{' '}
              <Link href="/auth/login" className="text-jade-400 hover:text-jade-300 font-medium transition-colors">
                Sign in
              </Link>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  )
}
