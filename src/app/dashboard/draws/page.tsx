'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Calendar, Users, Clock, CheckCircle2, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Draw, DrawEntry } from '@/types'
import { format } from 'date-fns'
import { MONTH_NAMES } from '@/lib/draw-engine'

export default function DrawsPage() {
  const supabase = createClient()
  const [draws, setDraws] = useState<Draw[]>([])
  const [myEntries, setMyEntries] = useState<DrawEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [drawRes, entryRes] = await Promise.all([
        supabase.from('draws').select('*').order('draw_year', { ascending: false }).order('draw_month', { ascending: false }),
        supabase.from('draw_entries').select('*').eq('user_id', user.id),
      ])
      setDraws(drawRes.data || [])
      setMyEntries(entryRes.data || [])
      setLoading(false)
    }
    fetch()
  }, [])

  const getMyEntry = (drawId: string) => myEntries.find(e => e.draw_id === drawId)

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-jade-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Monthly Draws</h1>
        <p className="text-muted-foreground mt-1">View all draws and your participation history.</p>
      </div>

      {draws.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center text-muted-foreground">
          <Trophy className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="font-medium">No draws yet</p>
          <p className="text-sm mt-1">The first draw will appear here once the admin publishes it.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {draws.map((draw, i) => {
            const myEntry = getMyEntry(draw.id)
            const isPublished = draw.status === 'published' || draw.status === 'completed'
            return (
              <motion.div key={draw.id}
                initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="glass rounded-2xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">{MONTH_NAMES[draw.draw_month - 1]} {draw.draw_year}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        draw.status === 'published' || draw.status === 'completed'
                          ? 'bg-jade-500/15 text-jade-400'
                          : draw.status === 'simulation'
                          ? 'bg-gold-500/15 text-gold-400'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {draw.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" /> {draw.participant_count} participants
                      </span>
                      {draw.published_at && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {format(new Date(draw.published_at), 'dd MMM yyyy')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-display font-bold text-xl text-jade-400">€{draw.total_pool.toFixed(0)}</div>
                    <div className="text-xs text-muted-foreground">Prize pool</div>
                  </div>
                </div>

                {isPublished && draw.winning_numbers.length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs text-muted-foreground mb-2 font-medium">Winning Numbers</div>
                    <div className="flex gap-2 flex-wrap">
                      {draw.winning_numbers.map((n, idx) => (
                        <div key={idx}
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all ${
                            myEntry?.entry_numbers?.includes(n)
                              ? 'bg-gold-500/20 border-gold-500/60 text-gold-400'
                              : 'bg-muted border-border text-muted-foreground'
                          }`}>
                          {n}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-card rounded-xl p-3 text-center">
                    <div className="text-xs text-muted-foreground">Jackpot</div>
                    <div className="font-bold text-gold-400 text-sm">€{draw.jackpot_amount.toFixed(0)}</div>
                    {draw.jackpot_rolled_over && <div className="text-[10px] text-gold-400/60">Rolled over</div>}
                  </div>
                  <div className="bg-card rounded-xl p-3 text-center">
                    <div className="text-xs text-muted-foreground">4 Match</div>
                    <div className="font-bold text-sm">€{draw.four_match_pool.toFixed(0)}</div>
                  </div>
                  <div className="bg-card rounded-xl p-3 text-center">
                    <div className="text-xs text-muted-foreground">3 Match</div>
                    <div className="font-bold text-sm">€{draw.three_match_pool.toFixed(0)}</div>
                  </div>
                </div>

                {/* My entry status */}
                {myEntry ? (
                  <div className={`rounded-xl p-3 flex items-center gap-3 ${
                    myEntry.prize_tier
                      ? 'bg-gold-500/10 border border-gold-500/25'
                      : 'bg-muted/50'
                  }`}>
                    {myEntry.prize_tier ? (
                      <CheckCircle2 className="w-5 h-5 text-gold-400 flex-shrink-0" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
                    )}
                    <div>
                      <div className="text-sm font-medium">
                        {myEntry.prize_tier
                          ? `🎉 Winner! ${myEntry.match_count} matches — €${myEntry.prize_amount.toFixed(2)}`
                          : `Entered — ${myEntry.match_count || 0} matches`}
                      </div>
                      <div className="text-xs text-muted-foreground flex gap-2">
                        {myEntry.entry_numbers?.map((n, idx) => (
                          <span key={idx} className="text-jade-400 font-medium">{n}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-muted/30 rounded-xl p-3 text-center text-sm text-muted-foreground">
                    {draw.status === 'pending' ? (
                      <span className="flex items-center justify-center gap-2">
                        <Clock className="w-3.5 h-3.5" /> Draw pending — enter scores to participate
                      </span>
                    ) : 'You did not participate in this draw'}
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
