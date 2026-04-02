'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash2, BarChart2, Info, Loader2, X, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { GolfScore } from '@/types'
import { format } from 'date-fns'

const SCORE_MIN = 1
const SCORE_MAX = 45

export default function ScoresPage() {
  const supabase = createClient()
  const [scores, setScores] = useState<GolfScore[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ score: '', played_at: '', course_name: '', notes: '' })
  const [error, setError] = useState('')
  const [userId, setUserId] = useState<string>('')

  useEffect(() => {
    fetchScores()
  }, [])

  const fetchScores = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)
    const { data } = await supabase
      .from('golf_scores')
      .select('*')
      .eq('user_id', user.id)
      .order('played_at', { ascending: false })
    setScores(data || [])
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const scoreNum = parseInt(form.score)
    if (isNaN(scoreNum) || scoreNum < SCORE_MIN || scoreNum > SCORE_MAX) {
      setError(`Score must be between ${SCORE_MIN} and ${SCORE_MAX}`)
      return
    }
    setSaving(true)
    try {
      if (editingId) {
        // @ts-ignore
        const { error } = await supabase.from('golf_scores').update({
          score: scoreNum,
          played_at: form.played_at,
          course_name: form.course_name || null,
          notes: form.notes || null,
        }).eq('id', editingId)
        if (error) throw error
      } else {
        // @ts-ignore
        const { error } = await supabase.from('golf_scores').insert({
          user_id: userId,
          score: scoreNum,
          played_at: form.played_at,
          course_name: form.course_name || null,
          notes: form.notes || null,
        })
        if (error) throw error
      }
      await fetchScores()
      resetForm()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this score?')) return
    await supabase.from('golf_scores').delete().eq('id', id)
    setScores(prev => prev.filter(s => s.id !== id))
  }

  const handleEdit = (score: GolfScore) => {
    setEditingId(score.id)
    setForm({
      score: score.score.toString(),
      played_at: score.played_at,
      course_name: score.course_name || '',
      notes: score.notes || '',
    })
    setShowForm(true)
  }

  const resetForm = () => {
    setForm({ score: '', played_at: '', course_name: '', notes: '' })
    setEditingId(null)
    setShowForm(false)
    setError('')
  }

  const avgScore = scores.length > 0
    ? (scores.reduce((s, sc) => s + sc.score, 0) / scores.length).toFixed(1)
    : '—'

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-jade-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">My Scores</h1>
          <p className="text-muted-foreground mt-1">Track your last 5 Stableford scores (1–45 pts)</p>
        </div>
        {scores.length < 5 && (
          <button onClick={() => { resetForm(); setShowForm(true) }}
            className="flex items-center gap-2 bg-jade-500 hover:bg-jade-400 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
            <Plus className="w-4 h-4" /> Add Score
          </button>
        )}
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3">
        <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-muted-foreground">
          Only your <strong className="text-foreground">latest 5 scores</strong> are stored. Adding a new score when you have 5
          will automatically replace the oldest one. Your scores become your draw entry numbers.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Scores Entered', value: `${scores.length}/5` },
          { label: 'Average Score', value: avgScore },
          { label: 'Highest Score', value: scores.length ? Math.max(...scores.map(s => s.score)) : '—' },
        ].map(stat => (
          <div key={stat.label} className="glass rounded-xl p-4 text-center">
            <div className="font-display font-bold text-2xl text-jade-400">{stat.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Your draw numbers */}
      {scores.length > 0 && (
        <div className="glass rounded-2xl p-5">
          <div className="text-sm font-semibold mb-3 text-muted-foreground">Your Draw Numbers</div>
          <div className="flex gap-3 flex-wrap">
            {scores.map((s, i) => (
              <motion.div key={s.id}
                initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', delay: i * 0.1 }}
                className="w-12 h-12 rounded-full bg-jade-500/15 border-2 border-jade-500/40 flex items-center justify-center text-jade-400 font-bold text-lg">
                {s.score}
              </motion.div>
            ))}
            {Array.from({ length: 5 - scores.length }).map((_, i) => (
              <div key={i} className="w-12 h-12 rounded-full border-2 border-dashed border-border flex items-center justify-center text-muted-foreground/30 text-xl">?</div>
            ))}
          </div>
        </div>
      )}

      {/* Add / Edit Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold">{editingId ? 'Edit Score' : 'Add New Score'}</h3>
              <button onClick={resetForm} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl px-4 py-3 mb-4">{error}</div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Stableford Score <span className="text-muted-foreground">(1–45)</span></label>
                  <input type="number" required min={1} max={45}
                    value={form.score} onChange={e => setForm({ ...form, score: e.target.value })}
                    placeholder="e.g. 36"
                    className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-jade-500/50 transition" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Date Played</label>
                  <input type="date" required
                    value={form.played_at} onChange={e => setForm({ ...form, played_at: e.target.value })}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-jade-500/50 transition" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Course Name <span className="text-muted-foreground">(optional)</span></label>
                <input type="text"
                  value={form.course_name} onChange={e => setForm({ ...form, course_name: e.target.value })}
                  placeholder="e.g. Royal Dublin Golf Club"
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-jade-500/50 transition" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 bg-jade-500 hover:bg-jade-400 disabled:opacity-60 text-white py-3 rounded-xl font-semibold transition-all">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {editingId ? 'Update Score' : 'Save Score'}
                </button>
                <button type="button" onClick={resetForm}
                  className="px-6 glass hover:bg-white/10 rounded-xl font-semibold transition-all">
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scores list */}
      <div className="space-y-3">
        <AnimatePresence>
          {scores.length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center text-muted-foreground">
              <BarChart2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="font-medium mb-1">No scores yet</p>
              <p className="text-sm">Add your first Stableford score to enter monthly draws.</p>
            </div>
          ) : (
            scores.map((score, i) => (
              <motion.div key={score.id}
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }} transition={{ delay: i * 0.05 }}
                className="glass rounded-xl p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-jade-500/15 border border-jade-500/30 flex items-center justify-center text-jade-400 font-display font-bold text-lg flex-shrink-0">
                  {score.score}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{score.course_name || 'Golf Course'}</div>
                  <div className="text-xs text-muted-foreground">{format(new Date(score.played_at), 'EEEE, dd MMMM yyyy')}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleEdit(score)}
                    className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-jade-400 transition-all">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(score.id)}
                    className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
