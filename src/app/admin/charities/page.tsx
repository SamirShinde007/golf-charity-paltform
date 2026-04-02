'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, Plus, Edit2, Trash2, Star, X, Check, Loader2, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Charity } from '@/types'

const emptyForm = { name: '', slug: '', description: '', long_description: '', category: '', website_url: '', is_featured: false, is_active: true }

export default function AdminCharitiesPage() {
  const supabase = createClient()
  const [charities, setCharities] = useState<Charity[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm)

  useEffect(() => { fetchCharities() }, [])

  const fetchCharities = async () => {
    const { data } = await supabase.from('charities').select('*').order('name')
    setCharities(data || [])
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const slug = form.slug || form.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      if (editingId) {
        // @ts-ignore
        await supabase.from('charities').update({ ...form, slug }).eq('id', editingId)
      } else {
        // @ts-ignore
        await supabase.from('charities').insert({ ...form, slug })
      }
      await fetchCharities()
      resetForm()
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (charity: Charity) => {
    setEditingId(charity.id)
    setForm({
      name: charity.name, slug: charity.slug,
      description: charity.description || '', long_description: charity.long_description || '',
      category: charity.category || '', website_url: charity.website_url || '',
      is_featured: charity.is_featured, is_active: charity.is_active,
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this charity? This will remove it from all subscriptions.')) return
    await supabase.from('charities').delete().eq('id', id)
    setCharities(prev => prev.filter(c => c.id !== id))
  }

  const toggleFeatured = async (id: string, featured: boolean) => {
    // @ts-ignore
    await supabase.from('charities').update({ is_featured: !featured }).eq('id', id)
    setCharities(prev => prev.map(c => c.id === id ? { ...c, is_featured: !featured } : c))
  }

  const toggleActive = async (id: string, active: boolean) => {
    // @ts-ignore
    await supabase.from('charities').update({ is_active: !active }).eq('id', id)
    setCharities(prev => prev.map(c => c.id === id ? { ...c, is_active: !active } : c))
  }

  const resetForm = () => { setForm(emptyForm); setEditingId(null); setShowForm(false) }

  const CATEGORIES = ['Health', 'Mental Health', 'Social', 'Children', 'Animals', 'Environment', 'Education', 'Sport', 'Other']

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Charities</h1>
          <p className="text-muted-foreground mt-1">{charities.length} charities registered</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true) }}
          className="flex items-center gap-2 bg-jade-500/20 hover:bg-jade-500/30 text-jade-400 px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" /> Add Charity
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-[hsl(20_14%_7%)] border border-jade-500/25 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold">{editingId ? 'Edit Charity' : 'Add New Charity'}</h3>
            <button onClick={resetForm}><X className="w-4 h-4 text-muted-foreground hover:text-foreground" /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Charity Name *</label>
                <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-jade-500/50" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-jade-500/50">
                  <option value="">Select category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Short Description</label>
              <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="One-line description..."
                className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-jade-500/50" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Full Description</label>
              <textarea rows={3} value={form.long_description} onChange={e => setForm({ ...form, long_description: e.target.value })}
                className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-jade-500/50 resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Website URL</label>
              <input type="url" value={form.website_url} onChange={e => setForm({ ...form, website_url: e.target.value })}
                placeholder="https://..."
                className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-jade-500/50" />
            </div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.is_featured} onChange={e => setForm({ ...form, is_featured: e.target.checked })} className="rounded" />
                Featured charity
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="rounded" />
                Active (visible to users)
              </label>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 bg-jade-500/20 hover:bg-jade-500/30 text-jade-400 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {editingId ? 'Update' : 'Create'} Charity
              </button>
              <button type="button" onClick={resetForm}
                className="px-5 glass hover:bg-white/10 rounded-xl text-sm transition-all">Cancel</button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Charities grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {charities.map((charity, i) => (
          <motion.div key={charity.id}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className={`bg-[hsl(20_14%_7%)] border rounded-2xl p-5 transition-all ${
              charity.is_active ? 'border-border' : 'border-border/40 opacity-60'
            }`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-jade-500/10 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-jade-400" />
                </div>
                <div>
                  <div className="font-semibold text-sm">{charity.name}</div>
                  <div className="text-xs text-muted-foreground">{charity.category}</div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {charity.is_featured && <Star className="w-3.5 h-3.5 text-gold-400 fill-current" />}
                <span className={`text-xs px-2 py-0.5 rounded-full ${charity.is_active ? 'bg-jade-500/10 text-jade-400' : 'bg-muted text-muted-foreground'}`}>
                  {charity.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{charity.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-jade-400 font-medium">€{charity.total_raised.toFixed(0)} raised</span>
              <div className="flex gap-1">
                <button onClick={() => toggleFeatured(charity.id, charity.is_featured)}
                  className={`p-1.5 rounded-lg transition-all text-xs ${charity.is_featured ? 'text-gold-400 bg-gold-500/10' : 'text-muted-foreground hover:text-gold-400 hover:bg-gold-500/10'}`}
                  title={charity.is_featured ? 'Remove from featured' : 'Mark as featured'}>
                  <Star className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => toggleActive(charity.id, charity.is_active)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
                  title={charity.is_active ? 'Deactivate' : 'Activate'}>
                  {charity.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
                <button onClick={() => handleEdit(charity)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-gold-400 hover:bg-gold-500/10 transition-all">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(charity.id)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
