'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart2, TrendingUp, Heart, Trophy, Users, DollarSign } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { MONTH_NAMES } from '@/lib/draw-engine'

export default function AdminReportsPage() {
  const supabase = createClient()
  const [data, setData] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      const [usersRes, subsRes, drawsRes, winnersRes, charityRes, contribRes] = await Promise.all([
        supabase.from('profiles').select('id, created_at, role'),
        supabase.from('subscriptions').select('status, plan_type, amount, charity_percentage'),
        supabase.from('draws').select('total_pool, status, draw_month, draw_year, participant_count'),
        supabase.from('winners').select('prize_amount, payment_status, match_type'),
        supabase.from('charities').select('name, total_raised').order('total_raised', { ascending: false }).limit(5),
        supabase.from('charity_contributions').select('amount, period_month, period_year'),
      ])

      const activeSubs = (subsRes.data || []).filter(s => s.status === 'active')
      const monthlySubs = activeSubs.filter(s => s.plan_type === 'monthly')
      const yearlySubs = activeSubs.filter(s => s.plan_type === 'yearly')
      const monthlyRevenue = monthlySubs.reduce((s, sub) => s + sub.amount, 0)
      const yearlyRevenue = yearlySubs.reduce((s, sub) => s + sub.amount / 12, 0)
      const totalMonthlyRevenue = monthlyRevenue + yearlyRevenue

      const totalPrizePool = (drawsRes.data || []).reduce((s, d) => s + d.total_pool, 0)
      const totalCharityRaised = (contribRes.data || []).reduce((s, c) => s + c.amount, 0)
      const totalPaidOut = (winnersRes.data || []).filter(w => w.payment_status === 'paid').reduce((s, w) => s + w.prize_amount, 0)
      const avgCharityPct = activeSubs.length > 0
        ? activeSubs.reduce((s, sub) => s + sub.charity_percentage, 0) / activeSubs.length
        : 0

      setData({
        totalUsers: (usersRes.data || []).length,
        activeSubs: activeSubs.length,
        monthlySubs: monthlySubs.length,
        yearlySubs: yearlySubs.length,
        totalMonthlyRevenue,
        totalPrizePool,
        totalCharityRaised,
        totalPaidOut,
        avgCharityPct: avgCharityPct.toFixed(1),
        topCharities: charityRes.data || [],
        draws: drawsRes.data || [],
        winnersBreakdown: {
          five: (winnersRes.data || []).filter(w => w.match_type === 'five_match').length,
          four: (winnersRes.data || []).filter(w => w.match_type === 'four_match').length,
          three: (winnersRes.data || []).filter(w => w.match_type === 'three_match').length,
        }
      })
      setLoading(false)
    }
    fetch()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Reports & Analytics</h1>
        <p className="text-muted-foreground mt-1">Platform performance overview.</p>
      </div>

      {/* Revenue section */}
      <div>
        <h2 className="font-semibold mb-4 flex items-center gap-2"><DollarSign className="w-4 h-4 text-gold-400" /> Revenue</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Monthly Subscribers', value: data.monthlySubs, sub: `€${(data.monthlySubs * 20).toFixed(0)}/mo` },
            { label: 'Yearly Subscribers', value: data.yearlySubs, sub: `€${(data.yearlySubs * 200).toFixed(0)}/yr` },
            { label: 'Monthly Revenue', value: `€${data.totalMonthlyRevenue?.toFixed(0)}`, sub: 'Avg per month' },
            { label: 'Active Subscribers', value: data.activeSubs, sub: 'Total active' },
          ].map(s => (
            <div key={s.label} className="bg-[hsl(20_14%_7%)] border border-border rounded-xl p-4">
              <div className="font-display font-bold text-xl text-gold-400">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
              <div className="text-xs text-jade-400 mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Prize pool section */}
      <div>
        <h2 className="font-semibold mb-4 flex items-center gap-2"><Trophy className="w-4 h-4 text-gold-400" /> Draw Statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Prize Pool (All-Time)', value: `€${data.totalPrizePool?.toFixed(0)}` },
            { label: 'Total Paid Out', value: `€${data.totalPaidOut?.toFixed(0)}` },
            { label: '5-Match Winners', value: data.winnersBreakdown?.five },
            { label: '4-Match Winners', value: data.winnersBreakdown?.four },
          ].map(s => (
            <div key={s.label} className="bg-[hsl(20_14%_7%)] border border-border rounded-xl p-4">
              <div className="font-display font-bold text-xl">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Charity section */}
      <div>
        <h2 className="font-semibold mb-4 flex items-center gap-2"><Heart className="w-4 h-4 text-jade-400" /> Charity Impact</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-[hsl(20_14%_7%)] border border-border rounded-2xl p-5">
            <div className="text-sm font-medium mb-4">Summary</div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total charity raised</span>
                <span className="font-bold text-jade-400">€{data.totalCharityRaised?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Avg charity % per subscriber</span>
                <span className="font-bold">{data.avgCharityPct}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Avg monthly charity per sub</span>
                <span className="font-bold">€{(20 * parseFloat(data.avgCharityPct) / 100).toFixed(2)}</span>
              </div>
            </div>
          </div>
          <div className="bg-[hsl(20_14%_7%)] border border-border rounded-2xl p-5">
            <div className="text-sm font-medium mb-4">Top Charities by Raised</div>
            <div className="space-y-2">
              {data.topCharities?.map((c: any, i: number) => (
                <div key={c.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                    <span className="text-sm">{c.name}</span>
                  </div>
                  <span className="text-sm font-bold text-jade-400">€{c.total_raised?.toFixed(0)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Draw history table */}
      <div>
        <h2 className="font-semibold mb-4 flex items-center gap-2"><BarChart2 className="w-4 h-4 text-purple-400" /> Draw History</h2>
        <div className="bg-[hsl(20_14%_7%)] border border-border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-[hsl(20_14%_5%)]">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Draw</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Participants</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">Prize Pool</th>
              </tr>
            </thead>
            <tbody>
              {data.draws?.map((draw: any) => (
                <tr key={draw.id || `${draw.draw_month}-${draw.draw_year}`} className="border-b border-border/50">
                  <td className="px-5 py-3">{MONTH_NAMES[(draw.draw_month || 1) - 1]} {draw.draw_year}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      draw.status === 'published' || draw.status === 'completed' ? 'bg-jade-500/15 text-jade-400' : 'bg-muted text-muted-foreground'
                    }`}>{draw.status}</span>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{draw.participant_count}</td>
                  <td className="px-5 py-3 text-right font-bold text-gold-400">€{draw.total_pool?.toFixed(0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
