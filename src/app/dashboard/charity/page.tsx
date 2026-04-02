'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, Search, Check, Loader2, ExternalLink, ChevronUp, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Charity, Subscription } from '@/types'

export default function DashboardCharityPage() {
  const supabase = createClient()
  const [charities, setCharities] = useState<Charity[]>([])
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string>('')
  const [percentage, setPercentage] = useState(10)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [charRes, subRes] = await Promise.all([
        supabase.from('charities').select('*').eq('is_active', true).order('name'),
        supabase.from('subscriptions').select('*, charity:charities(*)').eq('user_id', user.id).single(),
      ])
      setCharities(charRes.data || [])
      setSubscription(subRes.data)
      setSelectedId(subRes.data?.charity_id || '')
      setPercentage(subRes.data?.charity_percentage || 10)
      setLoading(false)
    }
    fetch()
  }, [])

  const handleSave = async () => {
    if (!selectedId || !subscription) return
    setSaving(true)
    // @ts-ignore
    await supabase.from('subscriptions').update({
      charity_id: selectedId,
      charity_percentage: percentage,
    }).eq('id', subscription.id)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    setSaving(false)
  }

  const filtered = charities.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.category?.toLowerCase().includes(search.toLowerCase())
  )

  const selectedCharity = charities.find(c => c.id === selectedId)
  const monthlyAmount = subscription?.amount || 20
  const charityAmount = ((monthlyAmount * percentage) / 100).toFixed(2)

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-jade-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">My Charity</h1>
        <p className="text-muted-foreground mt-1">Choose which charity receives a share of your subscription.</p>
      </div>

      {/* Contribution calculator */}
      <div className="glass rounded-2xl p-6">
        <h3 className="font-semibold mb-4">Your Contribution</h3>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-muted-foreground">Contribution percentage</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPercentage(p => Math.max(10, p - 5))}
              className="w-7 h-7 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors">
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <span className="font-bold text-jade-400 w-10 text-center">{percentage}%</span>
            <button onClick={() => setPercentage(p => Math.min(100, p + 5))}
              className="w-7 h-7 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors">
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <div className="w-full bg-muted rounded-full h-2 mb-4">
          <div className="bg-jade-500 h-2 rounded-full transition-all" style={{ width: `${percentage}%` }} />
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Monthly donation to {selectedCharity?.name || 'your charity'}</span>
          <span className="font-bold text-jade-400">€{charityAmount}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Minimum 10% of your €{monthlyAmount}/month subscription.</p>
      </div>

      {/* Selected charity preview */}
      {selectedCharity && (
        <div className="bg-jade-500/10 border border-jade-500/25 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-jade-500/20 flex items-center justify-center">
            <Heart className="w-6 h-6 text-jade-400 fill-current" />
          </div>
          <div className="flex-1">
            <div className="font-semibold">{selectedCharity.name}</div>
            <div className="text-sm text-muted-foreground">{selectedCharity.description}</div>
          </div>
          <Check className="w-5 h-5 text-jade-400" />
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input type="text" placeholder="Search charities..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full bg-input border border-border rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-jade-500/50 transition" />
      </div>

      {/* Charity list */}
      <div className="space-y-3">
        {filtered.map((charity, i) => (
          <motion.button key={charity.id}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => setSelectedId(charity.id)}
            className={`w-full text-left glass rounded-xl p-4 transition-all border ${
              selectedId === charity.id
                ? 'border-jade-500/50 bg-jade-500/10'
                : 'border-transparent hover:bg-white/[0.03]'
            }`}>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                <Heart className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{charity.name}</div>
                <div className="text-xs text-muted-foreground line-clamp-1">{charity.description}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{charity.category}</span>
                  <span className="text-xs text-jade-400">€{charity.total_raised.toFixed(0)} raised</span>
                </div>
              </div>
              {selectedId === charity.id && (
                <div className="w-6 h-6 rounded-full bg-jade-500 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3.5 h-3.5 text-white" />
                </div>
              )}
            </div>
          </motion.button>
        ))}
      </div>

      {/* Save */}
      <button onClick={handleSave} disabled={saving || !selectedId}
        className="w-full flex items-center justify-center gap-2 bg-jade-500 hover:bg-jade-400 disabled:opacity-60 text-white py-3 rounded-xl font-semibold transition-all">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> :
          saved ? <><Check className="w-4 h-4" /> Saved!</> :
          <><Heart className="w-4 h-4" /> Save Charity Selection</>
        }
      </button>
    </div>
  )
}
