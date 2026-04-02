'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CreditCard, User, Bell, Shield, ExternalLink, Loader2, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Profile, Subscription } from '@/types'
import { format } from 'date-fns'
import { PLAN_PRICES } from '@/lib/constants'

export default function SettingsPage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [subLoading, setSubLoading] = useState(false)
  const [form, setForm] = useState({ full_name: '', phone: '', handicap: '' })

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [profRes, subRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('subscriptions').select('*').eq('user_id', user.id).single(),
      ])
      setProfile(profRes.data)
      setSubscription(subRes.data)
      setForm({
        full_name: profRes.data?.full_name || '',
        phone: profRes.data?.phone || '',
        handicap: profRes.data?.handicap?.toString() || '',
      })
      setLoading(false)
    }
    fetch()
  }, [])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return
    setSaving(true)
    // @ts-ignore
    await supabase.from('profiles').update({
      full_name: form.full_name,
      phone: form.phone || null,
      handicap: form.handicap ? parseInt(form.handicap) : null,
    }).eq('id', profile.id)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setSaving(false)
  }

  const handleManageBilling = async () => {
    setPortalLoading(true)
    const res = await fetch('/api/subscriptions/portal', { method: 'POST' })
    const { url } = await res.json()
    if (url) window.location.href = url
    setPortalLoading(false)
  }

  const handleSubscribe = async (planType: 'monthly' | 'yearly') => {
    setSubLoading(true)
    const res = await fetch('/api/subscriptions/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planType }),
    })
    const { url } = await res.json()
    if (url) window.location.href = url
    setSubLoading(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-jade-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const isActive = subscription?.status === 'active'

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-display text-3xl font-bold">Settings</h1>

      {/* Subscription card */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <CreditCard className="w-5 h-5 text-jade-400" />
          <h3 className="font-semibold">Subscription</h3>
        </div>

        {isActive ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-jade-500/10 border border-jade-500/25 rounded-xl">
              <div>
                <div className="font-semibold capitalize">{subscription?.plan_type} Plan</div>
                <div className="text-sm text-muted-foreground">
                  €{subscription?.amount}/{ subscription?.plan_type === 'monthly' ? 'month' : 'year'}
                </div>
              </div>
              <span className="text-xs bg-jade-500/20 text-jade-400 px-3 py-1 rounded-full font-medium">Active</span>
            </div>
            {subscription?.current_period_end && (
              <div className="text-sm text-muted-foreground">
                {subscription.cancel_at_period_end
                  ? `Cancels on ${format(new Date(subscription.current_period_end), 'dd MMM yyyy')}`
                  : `Renews on ${format(new Date(subscription.current_period_end), 'dd MMM yyyy')}`}
              </div>
            )}
            <button onClick={handleManageBilling} disabled={portalLoading}
              className="flex items-center gap-2 glass hover:bg-white/10 px-4 py-2 rounded-xl text-sm font-medium transition-all">
              {portalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
              Manage Billing
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">Subscribe to participate in monthly draws and track your scores.</p>
            <div className="grid grid-cols-2 gap-4">
              {(['monthly', 'yearly'] as const).map(plan => (
                <button key={plan} onClick={() => handleSubscribe(plan)} disabled={subLoading}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    plan === 'yearly'
                      ? 'border-jade-500/40 bg-jade-500/10 hover:bg-jade-500/15'
                      : 'border-border glass hover:bg-white/5'
                  }`}>
                  <div className="font-semibold capitalize mb-1">{plan}</div>
                  <div className="font-display font-bold text-xl text-jade-400">
                    {plan === 'monthly' ? '€20/mo' : '€200/yr'}
                  </div>
                  {plan === 'yearly' && (
                    <div className="text-xs text-gold-400 mt-1">Save €40!</div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Profile */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <User className="w-5 h-5 text-jade-400" />
          <h3 className="font-semibold">Profile</h3>
        </div>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Full Name</label>
            <input type="text" value={form.full_name}
              onChange={e => setForm({ ...form, full_name: e.target.value })}
              className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-jade-500/50 transition" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Phone</label>
              <input type="tel" value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                placeholder="+353..."
                className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-jade-500/50 transition" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Handicap</label>
              <input type="number" value={form.handicap} min={0} max={54}
                onChange={e => setForm({ ...form, handicap: e.target.value })}
                placeholder="e.g. 18"
                className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-jade-500/50 transition" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input type="email" value={profile?.email || ''} disabled
              className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm opacity-60 cursor-not-allowed" />
          </div>
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 bg-jade-500 hover:bg-jade-400 disabled:opacity-60 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> :
              saved ? <><Check className="w-4 h-4" /> Saved!</> : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  )
}
