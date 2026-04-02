'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Award, Upload, Check, Clock, X, FileImage, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Winner } from '@/types'
import { format } from 'date-fns'
import { useDropzone } from 'react-dropzone'

export default function WinningsPage() {
  const supabase = createClient()
  const [winners, setWinners] = useState<Winner[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<string | null>(null)
  const [userId, setUserId] = useState('')

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const { data } = await supabase
        .from('winners')
        .select('*, draw:draws(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      setWinners(data || [])
      setLoading(false)
    }
    fetch()
  }, [])

  const handleProofUpload = async (winnerId: string, file: File) => {
    setUploading(winnerId)
    try {
      const ext = file.name.split('.').pop()
      const path = `winner-proofs/${userId}/${winnerId}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('winner-proofs')
        .upload(path, file, { upsert: true })
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('winner-proofs').getPublicUrl(path)
      // @ts-ignore
      await supabase.from('winners').update({
        proof_url: publicUrl,
        verification_status: 'submitted',
        proof_submitted_at: new Date().toISOString(),
      }).eq('id', winnerId)

      setWinners(prev => prev.map(w => w.id === winnerId
        ? { ...w, proof_url: publicUrl, verification_status: 'submitted' }
        : w
      ))
    } catch (err) {
      console.error(err)
    } finally {
      setUploading(null)
    }
  }

  const totalWon = winners.reduce((s, w) => s + w.prize_amount, 0)
  const totalPaid = winners.filter(w => w.payment_status === 'paid').reduce((s, w) => s + w.prize_amount, 0)

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-jade-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">My Winnings</h1>
        <p className="text-muted-foreground mt-1">Track your prize wins and verification status.</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Won', value: `€${totalWon.toFixed(2)}`, color: 'text-gold-400' },
          { label: 'Total Paid', value: `€${totalPaid.toFixed(2)}`, color: 'text-jade-400' },
          { label: 'Prizes Won', value: winners.length, color: 'text-foreground' },
        ].map(stat => (
          <div key={stat.label} className="glass rounded-xl p-4 text-center">
            <div className={`font-display font-bold text-2xl ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {winners.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center text-muted-foreground">
          <Award className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="font-medium">No winnings yet</p>
          <p className="text-sm mt-1">Keep entering scores and participating in draws!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {winners.map((winner, i) => (
            <motion.div key={winner.id}
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="glass rounded-2xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold">{winner.draw?.title || 'Monthly Draw'}</h3>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {format(new Date(winner.created_at), 'dd MMMM yyyy')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display font-bold text-2xl text-gold-400">€{winner.prize_amount.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">
                    {winner.match_type.replace('_match', ' Match').replace('five', '5').replace('four', '4').replace('three', '3')}
                  </div>
                </div>
              </div>

              {/* Status badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  winner.verification_status === 'approved' ? 'bg-jade-500/15 text-jade-400' :
                  winner.verification_status === 'rejected' ? 'bg-destructive/15 text-destructive' :
                  winner.verification_status === 'submitted' ? 'bg-blue-500/15 text-blue-400' :
                  'bg-muted text-muted-foreground'
                }`}>
                  Verification: {winner.verification_status}
                </span>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  winner.payment_status === 'paid'
                    ? 'bg-jade-500/15 text-jade-400'
                    : 'bg-gold-500/15 text-gold-400'
                }`}>
                  Payment: {winner.payment_status}
                </span>
              </div>

              {/* Proof upload section */}
              {winner.verification_status === 'pending' && (
                <ProofUpload
                  winnerId={winner.id}
                  uploading={uploading === winner.id}
                  onUpload={(file) => handleProofUpload(winner.id, file)}
                />
              )}

              {winner.verification_status === 'submitted' && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-sm text-blue-400 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Proof submitted — awaiting admin review
                </div>
              )}

              {winner.verification_status === 'approved' && winner.payment_status === 'pending' && (
                <div className="bg-gold-500/10 border border-gold-500/20 rounded-xl p-3 text-sm text-gold-400 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Verified! Payment processing soon.
                </div>
              )}

              {winner.payment_status === 'paid' && (
                <div className="bg-jade-500/10 border border-jade-500/25 rounded-xl p-3 text-sm text-jade-400 flex items-center gap-2">
                  <Check className="w-4 h-4" /> Paid on {winner.payment_date ? format(new Date(winner.payment_date), 'dd MMM yyyy') : 'N/A'}
                </div>
              )}

              {winner.admin_notes && (
                <div className="mt-3 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                  <strong>Admin note:</strong> {winner.admin_notes}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

function ProofUpload({ winnerId, uploading, onUpload }: {
  winnerId: string
  uploading: boolean
  onUpload: (file: File) => void
}) {
  const onDrop = useCallback((files: File[]) => {
    if (files[0]) onUpload(files[0])
  }, [onUpload])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1,
    disabled: uploading,
  })

  return (
    <div {...getRootProps()}
      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
        isDragActive ? 'border-jade-500/60 bg-jade-500/5' : 'border-border hover:border-jade-500/40'
      }`}>
      <input {...getInputProps()} />
      {uploading ? (
        <Loader2 className="w-6 h-6 mx-auto text-jade-400 animate-spin" />
      ) : (
        <>
          <Upload className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            <span className="text-jade-400 font-medium">Upload proof of scores</span> or drag & drop
          </p>
          <p className="text-xs text-muted-foreground mt-1">PNG, JPG screenshot from your golf platform</p>
        </>
      )}
    </div>
  )
}
