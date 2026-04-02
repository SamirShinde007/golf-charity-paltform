'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Heart, Trophy, TrendingUp, ChevronRight, Star, Users, Award, ArrowRight } from 'lucide-react'
import Navbar from '@/components/layout/navbar'
import Footer from '@/components/layout/footer'
import { SAMPLE_CHARITIES, PRIZE_STATS } from '@/lib/constants'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }
  })
}

export default function HomePage() {
  return (
    <div className="min-h-screen mesh-bg relative overflow-hidden">
      <Navbar />

      {/* ── HERO ── */}
      <section className="relative min-h-[100vh] flex items-center justify-center px-4 pt-20">
        {/* Background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-jade-500/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-gold-500/8 rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <motion.div
            initial="hidden" animate="visible" variants={fadeUp} custom={0}
            className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-8 text-sm text-jade-400"
          >
            <Heart className="w-3.5 h-3.5 fill-current" />
            <span>Where every swing creates change</span>
          </motion.div>

          <motion.h1
            initial="hidden" animate="visible" variants={fadeUp} custom={1}
            className="font-display text-6xl md:text-8xl font-bold leading-[0.95] mb-6"
          >
            <span className="block text-foreground/90">Play.</span>
            <span className="block text-gradient">Give.</span>
            <span className="block text-foreground/90">Win.</span>
          </motion.h1>

          <motion.p
            initial="hidden" animate="visible" variants={fadeUp} custom={2}
            className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            A golf subscription that tracks your game, fuels monthly prize draws,
            and directs real money to causes you believe in — every single month.
          </motion.p>

          <motion.div
            initial="hidden" animate="visible" variants={fadeUp} custom={3}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              href="/auth/signup"
              className="group inline-flex items-center gap-2 bg-jade-500 hover:bg-jade-400 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 glow-jade"
            >
              Start Your Journey
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/charity"
              className="inline-flex items-center gap-2 glass hover:bg-white/5 px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300"
            >
              Explore Charities
              <Heart className="w-5 h-5 text-jade-400" />
            </Link>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial="hidden" animate="visible" variants={fadeUp} custom={4}
            className="grid grid-cols-3 gap-6 mt-20 max-w-xl mx-auto"
          >
            {[
              { value: '€24,800', label: 'Raised for charity' },
              { value: '1,240', label: 'Active members' },
              { value: '€8,400', label: 'In prize pools' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-display text-2xl md:text-3xl font-bold text-jade-400">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground/50"
        >
          <div className="w-px h-12 bg-gradient-to-b from-transparent to-jade-500/50" />
          <span className="text-xs">scroll</span>
        </motion.div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-32 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <span className="text-jade-400 text-sm font-semibold tracking-widest uppercase">How it works</span>
            <h2 className="font-display text-4xl md:text-5xl font-bold mt-3">Three steps to impact</h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: TrendingUp,
                step: '01',
                title: 'Track your game',
                desc: 'Enter your last 5 Stableford scores each month. Your scores become your lottery numbers — the better you play, the more unique your entries.',
                color: 'jade',
              },
              {
                icon: Heart,
                step: '02',
                title: 'Choose your cause',
                desc: 'Pick a charity that matters to you. A minimum of 10% of your subscription goes directly to them — and you can choose to give more.',
                color: 'gold',
              },
              {
                icon: Trophy,
                step: '03',
                title: 'Win every month',
                desc: 'Match 3, 4, or all 5 numbers in our monthly draw and claim your prize. The jackpot rolls over if unclaimed, growing until someone wins.',
                color: 'jade',
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.6, delay: i * 0.15 }}
                className="relative glass rounded-2xl p-8 hover:bg-white/[0.04] transition-all group"
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${
                  item.color === 'jade' ? 'bg-jade-500/15 text-jade-400' : 'bg-gold-500/15 text-gold-400'
                }`}>
                  <item.icon className="w-7 h-7" />
                </div>
                <div className="font-display text-5xl font-bold text-white/5 absolute top-6 right-8">{item.step}</div>
                <h3 className="font-display text-2xl font-semibold mb-3">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRIZE POOL ── */}
      <section className="py-24 px-4 relative">
        <div className="absolute inset-0 bg-jade-500/3" />
        <div className="relative max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="text-gold-400 text-sm font-semibold tracking-widest uppercase">The prize pool</span>
            <h2 className="font-display text-4xl md:text-5xl font-bold mt-3">Real prizes, every month</h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { match: '5 Numbers', share: '40%', label: 'Jackpot — rolls over!', color: 'from-gold-500/20 to-gold-600/5', border: 'border-gold-500/20', badge: 'bg-gold-500/20 text-gold-300' },
              { match: '4 Numbers', share: '35%', label: 'Second prize tier', color: 'from-jade-500/20 to-jade-600/5', border: 'border-jade-500/20', badge: 'bg-jade-500/20 text-jade-300' },
              { match: '3 Numbers', share: '25%', label: 'Third prize tier', color: 'from-white/5 to-white/0', border: 'border-white/10', badge: 'bg-white/10 text-white/60' },
            ].map((tier, i) => (
              <motion.div
                key={tier.match}
                initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`rounded-2xl bg-gradient-to-b ${tier.color} border ${tier.border} p-8 text-center`}
              >
                <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4 ${tier.badge}`}>
                  {tier.label}
                </div>
                <div className="font-display text-6xl font-bold mb-2">{tier.share}</div>
                <div className="text-muted-foreground text-sm">of prize pool</div>
                <div className="mt-4 pt-4 border-t border-white/5 text-lg font-semibold">{tier.match}</div>
              </motion.div>
            ))}
          </div>

          <motion.p
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
            viewport={{ once: true }} transition={{ delay: 0.4 }}
            className="text-center text-muted-foreground mt-8 text-sm"
          >
            Prize pool calculated from active subscriber contributions each month.
            Multiple winners in the same tier share the prize equally.
          </motion.p>
        </div>
      </section>

      {/* ── CHARITY SPOTLIGHT ── */}
      <section className="py-32 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6 }}
            className="flex flex-col md:flex-row items-start md:items-end justify-between mb-16 gap-4"
          >
            <div>
              <span className="text-jade-400 text-sm font-semibold tracking-widest uppercase">Charity impact</span>
              <h2 className="font-display text-4xl md:text-5xl font-bold mt-3">Causes that matter</h2>
            </div>
            <Link href="/charity" className="inline-flex items-center gap-2 text-jade-400 hover:text-jade-300 transition-colors font-medium">
              View all charities <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Irish Heart Foundation', category: 'Health', raised: '€8,240', color: 'bg-red-500/10 text-red-400' },
              { name: 'Pieta House', category: 'Mental Health', raised: '€6,180', color: 'bg-purple-500/10 text-purple-400' },
              { name: 'St. Vincent de Paul', category: 'Social', raised: '€10,380', color: 'bg-blue-500/10 text-blue-400' },
            ].map((charity, i) => (
              <motion.div
                key={charity.name}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}
                className="glass rounded-2xl p-6 hover:bg-white/[0.05] transition-all group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-jade-500/10 flex items-center justify-center mb-4">
                  <Heart className="w-6 h-6 text-jade-400" />
                </div>
                <div className={`inline-block px-2 py-0.5 rounded text-xs font-medium mb-3 ${charity.color}`}>
                  {charity.category}
                </div>
                <h3 className="font-semibold text-lg mb-2">{charity.name}</h3>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">Total raised</span>
                  <span className="font-display font-bold text-jade-400">{charity.raised}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="py-24 px-4 relative" id="pricing">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="text-jade-400 text-sm font-semibold tracking-widest uppercase">Pricing</span>
            <h2 className="font-display text-4xl md:text-5xl font-bold mt-3">Simple, transparent plans</h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                plan: 'Monthly',
                price: '€20',
                period: '/month',
                features: ['Monthly prize draw entry', 'Score tracking (5 scores)', 'Charity contribution from 10%', 'Jackpot rollover eligibility'],
                cta: 'Start Monthly',
                highlight: false,
              },
              {
                plan: 'Yearly',
                price: '€200',
                period: '/year',
                badge: 'Save €40',
                features: ['Everything in Monthly', 'Priority charity matching', 'Draw history & analytics', 'Early access to features'],
                cta: 'Start Yearly',
                highlight: true,
              },
            ].map((plan, i) => (
              <motion.div
                key={plan.plan}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.15 }}
                className={`rounded-2xl p-8 ${
                  plan.highlight
                    ? 'bg-jade-500/10 border border-jade-500/30 glow-jade'
                    : 'glass'
                }`}
              >
                {plan.badge && (
                  <span className="inline-block bg-gold-500/20 text-gold-400 text-xs font-bold px-3 py-1 rounded-full mb-4">
                    {plan.badge}
                  </span>
                )}
                <div className="mb-6">
                  <div className="text-muted-foreground text-sm mb-1">{plan.plan}</div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-display text-5xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-3 text-sm">
                      <div className="w-5 h-5 rounded-full bg-jade-500/20 flex items-center justify-center flex-shrink-0">
                        <ChevronRight className="w-3 h-3 text-jade-400" />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/auth/signup"
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${
                    plan.highlight
                      ? 'bg-jade-500 hover:bg-jade-400 text-white'
                      : 'glass hover:bg-white/10'
                  }`}
                >
                  {plan.cta} <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }} transition={{ duration: 0.6 }}
            className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-jade-900/60 to-jade-800/20 border border-jade-500/20 p-12 text-center"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-jade-500/5 to-gold-500/5" />
            <div className="relative z-10">
              <div className="w-16 h-16 bg-jade-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Award className="w-8 h-8 text-jade-400" />
              </div>
              <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
                Ready to play for good?
              </h2>
              <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
                Join over 1,200 golfers who are tracking their game, winning prizes,
                and making a real difference every month.
              </p>
              <Link
                href="/auth/signup"
                className="inline-flex items-center gap-2 bg-jade-500 hover:bg-jade-400 text-white px-10 py-4 rounded-full font-bold text-lg transition-all glow-jade"
              >
                Subscribe Now <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
