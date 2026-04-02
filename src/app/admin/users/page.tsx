'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Users, Search, Shield, User, CheckCircle, XCircle, Edit2, Loader2, X, Check, Trash2, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'

export default function AdminUsersPage() {
  const supabase = createClient()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editingUser, setEditingUser] = useState<any>(null)
  const [deletingUser, setDeletingUser] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => { fetchUsers() }, [])

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*, subscription:subscriptions(status, plan_type, amount, current_period_end)')
      .order('created_at', { ascending: false })
    setUsers(data || [])
    setLoading(false)
  }

  const handleSaveUser = async () => {
    if (!editingUser) return
    setSaving(true)
    // @ts-ignore
    await supabase.from('profiles').update({
      full_name: editingUser.full_name,
      role: editingUser.role,
      phone: editingUser.phone,
    }).eq('id', editingUser.id)
    await fetchUsers()
    setEditingUser(null)
    setSaving(false)
  }

  const handleDeleteUser = async () => {
    if (!deletingUser) return
    setDeleting(true)
    try {
      const response = await fetch('/api/admin/users/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: deletingUser.id })
      })
      const data = await response.json()
      if (data.error) throw new Error(data.error)
      await fetchUsers()
      setDeletingUser(null)
    } catch (error: any) {
      alert(error.message || 'Failed to delete user')
    } finally {
      setDeleting(false)
    }
  }

  const filtered = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground mt-1">{users.length} total users</p>
        </div>
      </div>

      {/* Edit modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-[hsl(20_14%_7%)] border border-border rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold">Edit User</h3>
              <button onClick={() => setEditingUser(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <input type="text" value={editingUser.full_name || ''}
                  onChange={e => setEditingUser({ ...editingUser, full_name: e.target.value })}
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Role</label>
                <select value={editingUser.role}
                  onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50">
                  <option value="subscriber">Subscriber</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email (read-only)</label>
                <input type="email" value={editingUser.email} disabled
                  className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm opacity-60 cursor-not-allowed" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={handleSaveUser} disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-gold-500/20 hover:bg-gold-500/30 text-gold-400 py-2.5 rounded-xl text-sm font-semibold transition-colors">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Save Changes
              </button>
              <button onClick={() => setEditingUser(null)}
                className="px-5 glass hover:bg-white/10 rounded-xl text-sm transition-all">Cancel</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-[hsl(20_14%_7%)] border border-border rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10 text-destructive mb-4 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-center mb-2">Delete User?</h3>
            <p className="text-center text-muted-foreground mb-6">
              Are you sure you want to delete <span className="text-foreground font-semibold">{deletingUser.full_name || deletingUser.email}</span>?
              This action is permanent and cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeletingUser(null)} disabled={deleting}
                className="flex-1 px-5 py-2.5 glass hover:bg-white/10 rounded-xl text-sm font-medium transition-all">
                Cancel
              </button>
              <button onClick={handleDeleteUser} disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 bg-destructive hover:bg-destructive/90 text-white py-2.5 rounded-xl text-sm font-semibold transition-all">
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete User
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input type="text" placeholder="Search by name or email..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full bg-input border border-border rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50 transition" />
      </div>

      {/* Table */}
      <div className="bg-[hsl(20_14%_7%)] border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-[hsl(20_14%_5%)]">
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">User</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Role</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Subscription</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Joined</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user, i) => {
                const sub = Array.isArray(user.subscription) ? user.subscription[0] : user.subscription
                return (
                  <tr key={user.id} className="border-b border-border/50 hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-jade-500/15 flex items-center justify-center text-jade-400 font-bold text-xs flex-shrink-0">
                          {user.full_name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium">{user.full_name || 'Unnamed'}</div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        user.role === 'admin' ? 'bg-gold-500/15 text-gold-400' : 'bg-muted text-muted-foreground'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {sub ? (
                        <div>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            sub.status === 'active' ? 'bg-jade-500/15 text-jade-400' : 'bg-muted text-muted-foreground'
                          }`}>
                            {sub.status}
                          </span>
                          {sub.status === 'active' && (
                            <div className="text-xs text-muted-foreground mt-0.5 capitalize">{sub.plan_type} · €{sub.amount}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">No subscription</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs text-muted-foreground">
                      {format(new Date(user.created_at), 'dd MMM yyyy')}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setEditingUser(user)}
                          className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-gold-400 transition-all"
                          title="Edit User">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeletingUser(user)}
                          className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-destructive transition-all"
                          title="Delete User">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
