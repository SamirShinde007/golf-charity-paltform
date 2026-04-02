'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Award, Check, X, ExternalLink, Loader2, CheckCircle2, Clock, DollarSign } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Winner } from '@/types'
import { format } from 'date-fns'

export default function AdminWinnersPage() {
  const supabase = createClient()
  const [winners, setWinners] = useState<Winner[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted' | 'approved'>('all')
  const [adminId, setAdminId] = useState('')

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setAdminId(user.id)
      const { data } = await supabase
        .from('winners')
        .select('*, profile:profiles(full_name, email), draw:draws(title, draw_month, draw_year)')
        .order('created_at', { ascending: false })
      setWinners(data || [])
      setLoading(false)
    }
    fetch()
  }, [])

  const handleVerify = async (winnerId: string, approved: boolean, notes?: string) => {
    setProcessing(winnerId)
    // @ts-ignore
    await supabase.from('winners').update({
      verification_status: approved ? 'approved' : 'rejected',
      admin_notes: notes || null,
    }).eq('id', winnerId)
    setWinners(prev => prev.map(w => w.id === winnerId
      ? { ...w, verification_status: approved ? 'approved' : 'rejected' }
      : w
    ))
    setProcessing(null)
  }

  const handleMarkPaid = async (winnerId: string) => {
    setProcessing(winnerId)
    // @ts-ignore
    await supabase.from('winners').update({
      payment_status: 'paid',
      payment_date: new Date().toISOString(),
      paid_by_admin_id: adminId,
    }).eq('id', winnerId)
    setWinners(prev => prev.map(w => w.id === winnerId ? { ...w, payment_status: 'paid' } : w))
    setProcessing(null)
  }

  const filtered = filter === 'all' ? winners : winners.filter(w => w.verification_status === filter)
  const counts = {
    all: winners.length,
    pending: winners.filter(w => w.verification_status === 'pending').length,
    submitted: winners.filter(w => w.verification_status === 'submitted').length,
    approved: winners.filter(w => w.verification_status === 'approved').length,
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Winners Management</h1>
        <p className="text-muted-foreground mt-1">Verify winner submissions and manage payouts.</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Winners', value: counts.all, color: 'text-foreground' },
          { label: 'Pending Review', value: counts.pending, color: 'text-orange-400' },
          { label: 'Submitted', value: counts.submitted, color: 'text-blue-400' },
          { label: 'Approved', value: counts.approved, color: 'text-jade-400' },
        ].map(s => (
          <div key={s.label} className="bg-[hsl(20_14%_7%)] border border-border rounded-xl p-4 text-center">
            <div className={`font-display font-bold text-2xl ${s.color}`}>{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'pending', 'submitted', 'approved'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${
              filter === f ? 'bg-gold-500/20 text-gold-400' : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}>
            {f} ({counts[f]})
          </button>
        ))}
      </div>

      {/* Winners list */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-[hsl(20_14%_7%)] border border-border rounded-2xl p-12 text-center text-muted-foreground">
            <Award className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No winners in this category.</p>
          </div>
        ) : filtered.map((winner, i) => (
          <motion.div key={winner.id}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="bg-[hsl(20_14%_7%)] border border-border rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="font-semibold">{(winner as any).profile?.full_name || 'Unknown'}</div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    winner.match_type === 'five_match' ? 'bg-gold-500/20 text-gold-400' :
                    winner.match_type === 'four_match' ? 'bg-jade-500/20 text-jade-400' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {winner.match_type.replace('_match', ' Match').replace('five', '5').replace('four', '4').replace('three', '3')}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">{(winner as any).profile?.email}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{(winner as any).draw?.title}</div>
              </div>
              <div className="text-right">
                <div className="font-display font-bold text-xl text-gold-400">€{winner.prize_amount.toFixed(2)}</div>
                <div className="flex gap-2 mt-1 justify-end">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    winner.verification_status === 'approved' ? 'bg-jade-500/15 text-jade-400' :
                    winner.verification_status === 'rejected' ? 'bg-destructive/15 text-destructive' :
                    winner.verification_status === 'submitted' ? 'bg-blue-500/15 text-blue-400' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {winner.verification_status}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    winner.payment_status === 'paid' ? 'bg-jade-500/15 text-jade-400' : 'bg-gold-500/15 text-gold-400'
                  }`}>
                    {winner.payment_status}
                  </span>
                </div>
              </div>
            </div>

            {/* Proof image */}
            {winner.proof_url && (
              <div className="mb-4">
                <div className="text-xs text-muted-foreground mb-2">Submitted Proof</div>
                <a href={winner.proof_url} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-2 text-blue-400 text-sm hover:underline">
                  <ExternalLink className="w-3.5 h-3.5" /> View Proof Screenshot
                </a>
                {winner.proof_submitted_at && (
                  <span className="text-xs text-muted-foreground ml-3">
                    {format(new Date(winner.proof_submitted_at), 'dd MMM yyyy HH:mm')}
                  </span>
                )}
              </div>
            )}

            {winner.admin_notes && (
              <div className="mb-4 text-xs text-muted-foreground bg-muted/40 rounded-lg p-3">
                <strong>Note:</strong> {winner.admin_notes}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              {winner.verification_status === 'submitted' && (
                <>
                  <button onClick={() => handleVerify(winner.id, true)} disabled={processing === winner.id}
                    className="flex items-center gap-2 bg-jade-500/20 hover:bg-jade-500/30 text-jade-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                    {processing === winner.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    Approve
                  </button>
                  <button onClick={() => {
                    const notes = prompt('Rejection reason (optional):')
                    handleVerify(winner.id, false, notes || undefined)
                  }} disabled={processing === winner.id}
                    className="flex items-center gap-2 bg-destructive/10 hover:bg-destructive/20 text-destructive px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                    <X className="w-3.5 h-3.5" /> Reject
                  </button>
                </>
              )}
              {winner.verification_status === 'approved' && winner.payment_status === 'pending' && (
                <button onClick={() => handleMarkPaid(winner.id)} disabled={processing === winner.id}
                  className="flex items-center gap-2 bg-gold-500/20 hover:bg-gold-500/30 text-gold-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  {processing === winner.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <DollarSign className="w-3.5 h-3.5" />}
                  Mark as Paid
                </button>
              )}
              {winner.payment_status === 'paid' && (
                <span className="flex items-center gap-2 text-jade-400 text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  Paid {winner.payment_date && format(new Date(winner.payment_date), 'dd MMM yyyy')}
                </span>
              )}
              {winner.verification_status === 'pending' && !winner.proof_url && (
                <span className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Clock className="w-3.5 h-3.5" /> Awaiting winner's proof upload
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
