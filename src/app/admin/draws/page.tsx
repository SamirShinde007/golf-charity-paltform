'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Trophy, Play, CheckCircle, Dice5, Cpu, Plus, Loader2,
  RefreshCw, Users, ChevronDown, ChevronUp
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Draw } from '@/types'
import { format } from 'date-fns'
import {
  MONTH_NAMES,
  generateRandomDrawNumbers,
  generateAlgorithmicDrawNumbers,
  runDrawSimulation,
  countMatches,
  getMatchTier,
} from '@/lib/draw-engine'

export default function AdminDrawsPage() {
  const supabase = createClient()
  const [draws, setDraws] = useState<Draw[]>([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [form, setForm] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    type: 'random',
  })

  useEffect(() => { fetchDraws() }, [])

  const fetchDraws = async () => {
    const { data } = await supabase
      .from('draws')
      .select('*')
      .order('draw_year', { ascending: false })
      .order('draw_month', { ascending: false })
    setDraws(data || [])
    setLoading(false)
  }

  const handleCreateDraw = async () => {
    setCreating(true)
    try {
      const { count } = await supabase
        .from('subscriptions')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active')

      const subsCount = count || 0
      const totalPool = subsCount * 20 * 0.5
      const prevRollover = draws.find(d => d.jackpot_rolled_over && d.status === 'completed')
      const jackpotRollover = prevRollover?.jackpot_amount || 0

      // @ts-ignore
      await supabase.from('draws').insert({
        title: `${MONTH_NAMES[form.month - 1]} ${form.year} Draw`,
        draw_month: form.month,
        draw_year: form.year,
        draw_type: form.type,
        status: 'pending',
        winning_numbers: [],
        total_pool: totalPool,
        jackpot_amount: totalPool * 0.4 + jackpotRollover,
        four_match_pool: totalPool * 0.35,
        three_match_pool: totalPool * 0.25,
        participant_count: subsCount,
      })
      await fetchDraws()
      setShowCreate(false)
    } finally {
      setCreating(false)
    }
  }

  const handleLoadEntries = async (drawId: string) => {
    setRunning(drawId)
    await fetch('/api/draws/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ draw_id: drawId }),
    })
    await fetchDraws()
    setRunning(null)
  }

  const handleRunDraw = async (draw: Draw) => {
    setRunning(draw.id)
    try {
      const { data: entries } = await supabase
        .from('draw_entries')
        .select('*')
        .eq('draw_id', draw.id)

      const allEntries = entries || []
      const winningNumbers =
        draw.draw_type === 'algorithmic'
          ? generateAlgorithmicDrawNumbers(allEntries)
          : generateRandomDrawNumbers()

      const rolloverExtra = draw.jackpot_amount - draw.total_pool * 0.4
      const result = runDrawSimulation(allEntries, winningNumbers, draw.total_pool, Math.max(rolloverExtra, 0))

      // @ts-ignore
      await supabase
        .from('draws')
        .update({ winning_numbers: winningNumbers, status: 'simulation' })
        .eq('id', draw.id)

      // Update match counts on entries
      for (const entry of allEntries) {
        const matches = countMatches(entry.entry_numbers, winningNumbers)
        const tier = getMatchTier(matches)
        // @ts-ignore
        await supabase
          .from('draw_entries')
          .update({ match_count: matches, prize_tier: tier })
          .eq('id', entry.id)
      }

      // Upsert winners (clear previous simulation winners first)
      await supabase.from('winners').delete().eq('draw_id', draw.id)

      const allWinners = [
        ...result.five_match_winners.map(e => ({
          draw_id: draw.id, user_id: e.user_id, draw_entry_id: e.id,
          match_type: 'five_match', prize_amount: e.prize_amount,
        })),
        ...result.four_match_winners.map(e => ({
          draw_id: draw.id, user_id: e.user_id, draw_entry_id: e.id,
          match_type: 'four_match', prize_amount: e.prize_amount,
        })),
        ...result.three_match_winners.map(e => ({
          draw_id: draw.id, user_id: e.user_id, draw_entry_id: e.id,
          match_type: 'three_match', prize_amount: e.prize_amount,
        })),
      ]

      if (allWinners.length > 0) {
        // @ts-ignore
        await supabase.from('winners').insert(allWinners)
      }

      if (result.five_match_winners.length === 0) {
        // @ts-ignore
        await supabase.from('draws').update({ jackpot_rolled_over: true }).eq('id', draw.id)
      }

      await fetchDraws()
    } finally {
      setRunning(null)
    }
  }

  const handleRegenerate = async (draw: Draw) => {
    setRunning(draw.id)
    const winningNumbers =
      draw.draw_type === 'algorithmic'
        ? generateAlgorithmicDrawNumbers([])
        : generateRandomDrawNumbers()
    await supabase.from('winners').delete().eq('draw_id', draw.id)
    // @ts-ignore
    await supabase.from('draws').update({ winning_numbers: winningNumbers }).eq('id', draw.id)
    await fetchDraws()
    setRunning(null)
  }

  const handlePublish = async (drawId: string) => {
    // @ts-ignore
    await supabase
      .from('draws')
      .update({ status: 'published', published_at: new Date().toISOString() })
      .eq('id', drawId)

    // Notify winners
    const { data: winners } = await supabase
      .from('winners')
      .select('user_id, prize_amount')
      .eq('draw_id', drawId)

    if (winners?.length) {
      // @ts-ignore
      await supabase.from('notifications').insert(
        winners.map(w => ({
          user_id: w.user_id,
          title: '🎉 You won a prize!',
          message: `You won €${w.prize_amount.toFixed(2)} in this month's draw! Upload your proof to claim it.`,
          type: 'winner',
        }))
      )
    }
    await fetchDraws()
  }

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Draw Management</h1>
          <p className="text-muted-foreground mt-1">Configure, simulate, and publish monthly draws.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-gold-500/20 hover:bg-gold-500/30 text-gold-400 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" /> New Draw
        </button>
      </div>

      {showCreate && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[hsl(20_14%_7%)] border border-gold-500/25 rounded-2xl p-6"
        >
          <h3 className="font-semibold mb-4">Create New Draw</h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Month</label>
              <select
                value={form.month}
                onChange={e => setForm({ ...form, month: parseInt(e.target.value) })}
                className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50"
              >
                {MONTH_NAMES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Year</label>
              <input
                type="number"
                value={form.year}
                onChange={e => setForm({ ...form, year: parseInt(e.target.value) })}
                className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Draw Type</label>
              <select
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value })}
                className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50"
              >
                <option value="random">Random</option>
                <option value="algorithmic">Algorithmic (weighted)</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleCreateDraw}
              disabled={creating}
              className="flex items-center gap-2 bg-gold-500/20 hover:bg-gold-500/30 text-gold-400 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Create
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="px-5 py-2.5 glass hover:bg-white/10 rounded-xl text-sm transition-all"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      <div className="space-y-3">
        {draws.length === 0 ? (
          <div className="bg-[hsl(20_14%_7%)] border border-border rounded-2xl p-16 text-center text-muted-foreground">
            <Trophy className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No draws yet. Click "New Draw" to get started.</p>
          </div>
        ) : draws.map((draw, i) => (
          <motion.div
            key={draw.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-[hsl(20_14%_7%)] border border-border rounded-2xl overflow-hidden"
          >
            {/* Row header */}
            <button
              onClick={() => setExpanded(expanded === draw.id ? null : draw.id)}
              className="w-full p-5 text-left"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-wrap min-w-0">
                  <span className="font-semibold">{draw.title}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${
                    draw.status === 'published' || draw.status === 'completed' ? 'bg-jade-500/15 text-jade-400' :
                    draw.status === 'simulation' ? 'bg-blue-500/15 text-blue-400' :
                    'bg-muted text-muted-foreground'
                  }`}>{draw.status}</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="w-3 h-3" />{draw.participant_count}
                  </span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="font-display font-bold text-gold-400">€{draw.total_pool.toFixed(0)}</span>
                  {expanded === draw.id
                    ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </div>
            </button>

            {expanded === draw.id && (
              <div className="px-5 pb-5 border-t border-border/50 pt-4 space-y-4">
                {/* Pool breakdown */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Jackpot (5M)', val: draw.jackpot_amount, extra: draw.jackpot_rolled_over ? 'Rolled over' : '', color: 'text-gold-400' },
                    { label: '4 Match', val: draw.four_match_pool, extra: '', color: '' },
                    { label: '3 Match', val: draw.three_match_pool, extra: '', color: '' },
                  ].map(p => (
                    <div key={p.label} className="bg-card rounded-xl p-3 text-center">
                      <div className="text-xs text-muted-foreground mb-1">{p.label}</div>
                      <div className={`font-bold ${p.color}`}>€{p.val.toFixed(0)}</div>
                      {p.extra && <div className="text-[10px] text-gold-400/60 mt-0.5">{p.extra}</div>}
                    </div>
                  ))}
                </div>

                {/* Winning numbers */}
                {draw.winning_numbers.length > 0 && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-2 font-medium">
                      {draw.status === 'simulation' ? '⚠ Simulated — not yet published' : 'Winning Numbers'}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {draw.winning_numbers.map((n, idx) => (
                        <div key={idx}
                          className="w-11 h-11 rounded-full bg-gold-500/15 border-2 border-gold-500/40 flex items-center justify-center text-gold-400 font-bold">
                          {n}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {draw.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleLoadEntries(draw.id)}
                        disabled={running === draw.id}
                        className="flex items-center gap-2 bg-muted hover:bg-muted/80 text-muted-foreground px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        {running === draw.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Users className="w-3.5 h-3.5" />}
                        Load Entries
                      </button>
                      <button
                        onClick={() => handleRunDraw(draw)}
                        disabled={running === draw.id}
                        className="flex items-center gap-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        {running === draw.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                        Run Draw
                      </button>
                    </>
                  )}
                  {draw.status === 'simulation' && (
                    <>
                      <button
                        onClick={() => handleRegenerate(draw)}
                        disabled={running === draw.id}
                        className="flex items-center gap-2 bg-muted hover:bg-muted/80 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        {running === draw.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                        Re-roll
                      </button>
                      <button
                        onClick={() => handlePublish(draw.id)}
                        className="flex items-center gap-2 bg-jade-500/20 hover:bg-jade-500/30 text-jade-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Publish & Notify
                      </button>
                    </>
                  )}
                  {(draw.status === 'published' || draw.status === 'completed') && (
                    <span className="flex items-center gap-2 text-jade-400 text-sm py-1">
                      <CheckCircle className="w-4 h-4" />
                      Published {draw.published_at && format(new Date(draw.published_at), 'dd MMM yyyy')}
                    </span>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
}
