'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Trophy, Heart, BarChart2, Award, AlertCircle, ArrowRight, CheckCircle, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Profile, Subscription, GolfScore, Winner, Draw } from '@/types'
import { format } from 'date-fns'

export default function DashboardPage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [scores, setScores] = useState<GolfScore[]>([])
  const [winners, setWinners] = useState<Winner[]>([])
  const [latestDraw, setLatestDraw] = useState<Draw | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [profileRes, subRes, scoresRes, winnersRes, drawRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('subscriptions').select('*, charity:charities(*)').eq('user_id', user.id).single(),
        supabase.from('golf_scores').select('*').eq('user_id', user.id).order('played_at', { ascending: false }).limit(5),
        supabase.from('winners').select('*, draw:draws(*)').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('draws').select('*').in('status', ['published', 'completed']).order('draw_year', { ascending: false }).order('draw_month', { ascending: false }).limit(1).single(),
      ])

      setProfile(profileRes.data)
      setSubscription(subRes.data)
      setScores(scoresRes.data || [])
      setWinners(winnersRes.data || [])
      setLatestDraw(drawRes.data)
      setLoading(false)
    }
    fetchAll()
  }, [])

  const totalWon = winners.reduce((sum, w) => sum + w.prize_amount, 0)
  const isActive = subscription?.status === 'active'

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-jade-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Welcome */}
      <div>
        <h1 className="font-display text-3xl font-bold">
          Welcome back, {profile?.full_name?.split(' ')[0] || 'Golfer'} 👋
        </h1>
        <p className="text-muted-foreground mt-1">Here's your overview for this month.</p>
      </div>

      {/* Subscription banner */}
      {!isActive && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gold-500/10 border border-gold-500/30 rounded-2xl p-5 flex items-start gap-4">
          <AlertCircle className="w-5 h-5 text-gold-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <div className="font-semibold text-gold-300 mb-1">No active subscription</div>
            <p className="text-sm text-muted-foreground">Subscribe to enter monthly draws and track your scores.</p>
          </div>
          <Link href="/dashboard/settings" className="bg-gold-500/20 hover:bg-gold-500/30 text-gold-300 px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex-shrink-0">
            Subscribe
          </Link>
        </motion.div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Subscription',
            value: isActive ? 'Active' : 'Inactive',
            sub: isActive && subscription?.current_period_end
              ? `Renews ${format(new Date(subscription.current_period_end), 'dd MMM')}`
              : 'Not subscribed',
            icon: CheckCircle,
            color: isActive ? 'text-jade-400' : 'text-muted-foreground',
            bg: isActive ? 'bg-jade-500/10' : 'bg-muted/50',
          },
          {
            label: 'Scores Entered',
            value: `${scores.length}/5`,
            sub: scores.length > 0 ? `Latest: ${scores[0]?.score} pts` : 'No scores yet',
            icon: BarChart2,
            color: 'text-blue-400',
            bg: 'bg-blue-500/10',
          },
          {
            label: 'Your Charity',
            value: subscription?.charity?.name?.split(' ')[0] || 'Not selected',
            sub: subscription?.charity_percentage ? `${subscription.charity_percentage}% contribution` : 'Select a charity',
            icon: Heart,
            color: 'text-pink-400',
            bg: 'bg-pink-500/10',
          },
          {
            label: 'Total Won',
            value: `€${totalWon.toFixed(0)}`,
            sub: `${winners.length} prize${winners.length !== 1 ? 's' : ''} won`,
            icon: Award,
            color: 'text-gold-400',
            bg: 'bg-gold-500/10',
          },
        ].map((stat, i) => (
          <motion.div key={stat.label}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass rounded-2xl p-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${stat.bg}`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div className="font-display font-bold text-xl">{stat.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
            <div className="text-xs text-muted-foreground/60 mt-0.5">{stat.sub}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Scores */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold">Recent Scores</h3>
            <Link href="/dashboard/scores" className="text-jade-400 text-sm hover:text-jade-300 flex items-center gap-1 transition-colors">
              Manage <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {scores.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BarChart2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No scores entered yet</p>
              <Link href="/dashboard/scores" className="text-jade-400 text-sm mt-2 inline-block hover:underline">Add your first score →</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {scores.map((score, i) => (
                <div key={score.id} className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-jade-500/15 flex items-center justify-center text-jade-400 text-xs font-bold">
                      {score.score}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{score.course_name || 'Golf Course'}</div>
                      <div className="text-xs text-muted-foreground">{format(new Date(score.played_at), 'dd MMM yyyy')}</div>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-jade-400">{score.score} pts</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Latest Draw */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold">Latest Draw</h3>
            <Link href="/dashboard/draws" className="text-jade-400 text-sm hover:text-jade-300 flex items-center gap-1 transition-colors">
              All Draws <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {!latestDraw ? (
            <div className="text-center py-8 text-muted-foreground">
              <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No draws published yet</p>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="font-semibold">{latestDraw.title}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" />
                    {latestDraw.published_at ? format(new Date(latestDraw.published_at), 'dd MMM yyyy') : 'Pending'}
                  </div>
                </div>
                <span className="text-xs bg-jade-500/15 text-jade-400 px-2 py-1 rounded-full">
                  {latestDraw.status}
                </span>
              </div>
              <div className="mb-4">
                <div className="text-xs text-muted-foreground mb-2">Winning Numbers</div>
                <div className="flex gap-2 flex-wrap">
                  {latestDraw.winning_numbers.map((n, i) => (
                    <div key={i} className="w-9 h-9 rounded-full bg-gold-500/15 border border-gold-500/30 flex items-center justify-center text-gold-400 font-bold text-sm">
                      {n}
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-card rounded-xl p-3">
                  <div className="text-xs text-muted-foreground">Prize Pool</div>
                  <div className="font-bold text-jade-400">€{latestDraw.total_pool.toFixed(0)}</div>
                </div>
                <div className="bg-card rounded-xl p-3">
                  <div className="text-xs text-muted-foreground">Participants</div>
                  <div className="font-bold">{latestDraw.participant_count}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent winnings */}
      {winners.length > 0 && (
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold">Recent Winnings</h3>
            <Link href="/dashboard/winnings" className="text-jade-400 text-sm hover:text-jade-300 flex items-center gap-1 transition-colors">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {winners.slice(0, 3).map(winner => (
              <div key={winner.id} className="flex items-center justify-between p-3 bg-gold-500/5 border border-gold-500/15 rounded-xl">
                <div>
                  <div className="font-semibold text-sm">{winner.match_type.replace('_', ' ').replace('match', 'Match')}</div>
                  <div className="text-xs text-muted-foreground">{winner.draw?.title}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gold-400">€{winner.prize_amount.toFixed(2)}</div>
                  <div className={`text-xs px-2 py-0.5 rounded-full ${
                    winner.payment_status === 'paid'
                      ? 'bg-jade-500/15 text-jade-400'
                      : 'bg-gold-500/15 text-gold-400'
                  }`}>
                    {winner.payment_status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
