'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Users, Trophy, Heart, Award, TrendingUp, AlertCircle, DollarSign, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Stats {
  total_users: number
  active_subscribers: number
  total_prize_pool: number
  total_charity_raised: number
  pending_winners: number
  total_draws: number
}

export default function AdminPage() {
  const supabase = createClient()
  const [stats, setStats] = useState<Stats>({
    total_users: 0, active_subscribers: 0, total_prize_pool: 0,
    total_charity_raised: 0, pending_winners: 0, total_draws: 0,
  })
  const [recentUsers, setRecentUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      const [usersRes, subsRes, winnersRes, drawsRes, charityRes] = await Promise.all([
        supabase.from('profiles').select('id, full_name, email, created_at, role').order('created_at', { ascending: false }).limit(5),
        supabase.from('subscriptions').select('status, amount').eq('status', 'active'),
        supabase.from('winners').select('id, verification_status').eq('verification_status', 'pending'),
        supabase.from('draws').select('id, total_pool'),
        supabase.from('charity_contributions').select('amount'),
      ])

      const [totalUsersRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
      ])

      const totalPool = (drawsRes.data || []).reduce((s, d) => s + d.total_pool, 0)
      const totalCharity = (charityRes.data || []).reduce((s, c) => s + c.amount, 0)

      setStats({
        total_users: totalUsersRes.count || 0,
        active_subscribers: (subsRes.data || []).length,
        total_prize_pool: totalPool,
        total_charity_raised: totalCharity,
        pending_winners: (winnersRes.data || []).length,
        total_draws: (drawsRes.data || []).length,
      })
      setRecentUsers(usersRes.data || [])
      setLoading(false)
    }
    fetch()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const statCards = [
    { label: 'Total Users', value: stats.total_users, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10', href: '/admin/users' },
    { label: 'Active Subscribers', value: stats.active_subscribers, icon: CheckCircle, color: 'text-jade-400', bg: 'bg-jade-500/10', href: '/admin/users' },
    { label: 'Total Prize Pool', value: `€${stats.total_prize_pool.toFixed(0)}`, icon: Trophy, color: 'text-gold-400', bg: 'bg-gold-500/10', href: '/admin/draws' },
    { label: 'Charity Raised', value: `€${stats.total_charity_raised.toFixed(0)}`, icon: Heart, color: 'text-pink-400', bg: 'bg-pink-500/10', href: '/admin/charities' },
    { label: 'Pending Verification', value: stats.pending_winners, icon: AlertCircle, color: 'text-orange-400', bg: 'bg-orange-500/10', href: '/admin/winners' },
    { label: 'Total Draws', value: stats.total_draws, icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-500/10', href: '/admin/draws' },
  ]

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="font-display text-3xl font-bold">Admin Overview</h1>
        <p className="text-muted-foreground mt-1">Platform health and key metrics at a glance.</p>
      </div>

      {stats.pending_winners > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="bg-orange-500/10 border border-orange-500/25 rounded-2xl p-4 flex items-center gap-4">
          <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0" />
          <div className="flex-1">
            <span className="font-semibold text-orange-300">{stats.pending_winners} winner{stats.pending_winners > 1 ? 's' : ''} awaiting verification</span>
          </div>
          <Link href="/admin/winners" className="text-orange-400 text-sm font-medium hover:underline">Review →</Link>
        </motion.div>
      )}

      {/* Stat grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {statCards.map((s, i) => (
          <motion.div key={s.label}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}>
            <Link href={s.href}
              className="block bg-[hsl(20_14%_7%)] border border-border rounded-2xl p-5 hover:border-white/10 transition-all group">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${s.bg}`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div className="font-display font-bold text-2xl">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Recent users */}
      <div className="bg-[hsl(20_14%_7%)] border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold">Recent Users</h3>
          <Link href="/admin/users" className="text-gold-400 text-sm hover:text-gold-300 transition-colors">View All →</Link>
        </div>
        <div className="space-y-3">
          {recentUsers.map(user => (
            <div key={user.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-jade-500/15 flex items-center justify-center text-jade-400 text-sm font-bold">
                  {user.full_name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-medium">{user.full_name || 'Unnamed'}</div>
                  <div className="text-xs text-muted-foreground">{user.email}</div>
                </div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                user.role === 'admin' ? 'bg-gold-500/15 text-gold-400' : 'bg-muted text-muted-foreground'
              }`}>
                {user.role}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
