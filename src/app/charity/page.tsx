'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, Search, ExternalLink, Star } from 'lucide-react'
import Navbar from '@/components/layout/navbar'
import Footer from '@/components/layout/footer'
import { createClient } from '@/lib/supabase/client'
import type { Charity } from '@/types'
import Link from 'next/link'

const CATEGORIES = ['All', 'Health', 'Mental Health', 'Social', 'Children', 'Animals', 'Environment', 'Education']

export default function CharityPage() {
  const supabase = createClient()
  const [charities, setCharities] = useState<Charity[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('charities').select('*').eq('is_active', true).order('is_featured', { ascending: false }).order('name')
      setCharities(data || [])
      setLoading(false)
    }
    fetch()
  }, [])

  const filtered = charities.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.description?.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = category === 'All' || c.category === category
    return matchesSearch && matchesCategory
  })

  const featured = charities.filter(c => c.is_featured)
  const totalRaised = charities.reduce((s, c) => s + c.total_raised, 0)

  return (
    <div className="min-h-screen mesh-bg">
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Hero */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
            <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-6 text-sm text-jade-400">
              <Heart className="w-3.5 h-3.5 fill-current" />
              <span>€{totalRaised.toFixed(0)} raised and counting</span>
            </div>
            <h1 className="font-display text-5xl md:text-6xl font-bold mb-4">Causes that matter</h1>
            <p className="text-muted-foreground text-xl max-w-2xl mx-auto">
              Every subscription makes a direct difference. Choose your charity and we'll ensure a portion
              of your subscription reaches them every month.
            </p>
          </motion.div>

          {/* Featured */}
          {featured.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center gap-2 mb-6">
                <Star className="w-4 h-4 text-gold-400 fill-current" />
                <span className="font-semibold">Featured Charities</span>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                {featured.map((charity, i) => (
                  <motion.div key={charity.id}
                    initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="glass rounded-2xl p-6 border border-gold-500/20 hover:border-gold-500/40 transition-all group">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-jade-500/15 flex items-center justify-center">
                        <Heart className="w-6 h-6 text-jade-400" />
                      </div>
                      <Star className="w-4 h-4 text-gold-400 fill-current" />
                    </div>
                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{charity.category}</span>
                    <h3 className="font-display font-semibold text-xl mt-3 mb-2">{charity.name}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-4">{charity.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-jade-400 font-bold">€{charity.total_raised.toFixed(0)} raised</span>
                      {charity.website_url && (
                        <a href={charity.website_url} target="_blank" rel="noreferrer"
                          className="text-muted-foreground hover:text-foreground transition-colors">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Search + filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder="Search charities..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full bg-input border border-border rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-jade-500/50 transition" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setCategory(cat)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    category === cat ? 'bg-jade-500/20 text-jade-400' : 'glass text-muted-foreground hover:text-foreground'
                  }`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-2 border-jade-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((charity, i) => (
                <motion.div key={charity.id}
                  initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                  className="glass rounded-2xl p-5 hover:bg-white/[0.04] transition-all">
                  <div className="w-10 h-10 rounded-xl bg-jade-500/10 flex items-center justify-center mb-4">
                    <Heart className="w-5 h-5 text-jade-400" />
                  </div>
                  <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{charity.category}</span>
                  <h3 className="font-semibold mt-2 mb-1">{charity.name}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-4">{charity.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-jade-400 text-sm font-bold">€{charity.total_raised.toFixed(0)} raised</span>
                    <Link href="/auth/signup"
                      className="text-xs bg-jade-500/15 hover:bg-jade-500/25 text-jade-400 px-3 py-1.5 rounded-lg transition-colors">
                      Support →
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {filtered.length === 0 && !loading && (
            <div className="text-center py-16 text-muted-foreground">
              <Heart className="w-10 h-10 mx-auto mb-4 opacity-30" />
              <p>No charities found matching your search.</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}
