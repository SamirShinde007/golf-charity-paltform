'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, Trophy, Heart, Award,
  BarChart2, Settings, LogOut, Menu, X, Heart as HeartIcon, Shield
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/draws', label: 'Draw Management', icon: Trophy },
  { href: '/admin/charities', label: 'Charities', icon: Heart },
  { href: '/admin/winners', label: 'Winners', icon: Award },
  { href: '/admin/reports', label: 'Reports', icon: BarChart2 },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (data?.role !== 'admin') router.push('/dashboard')
    }
    checkAdmin()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-[hsl(20_14%_3%)] flex">
      {/* Admin Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-[hsl(20_14%_5%)] border-r border-border flex flex-col
        transition-transform duration-300 md:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-16 flex items-center gap-2 px-6 border-b border-border">
          <div className="w-8 h-8 bg-jade-500 rounded-lg flex items-center justify-center">
            <HeartIcon className="w-4 h-4 text-white fill-current" />
          </div>
          <div>
            <span className="font-display font-bold text-sm">GreenHeart</span>
            <div className="flex items-center gap-1">
              <Shield className="w-2.5 h-2.5 text-gold-400" />
              <span className="text-[10px] text-gold-400 font-medium uppercase tracking-wide">Admin</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1">
          {navItems.map(item => {
            const active = pathname === item.href
            return (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active ? 'bg-gold-500/15 text-gold-400' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                }`}>
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <Link href="/dashboard"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all mb-2">
            <HeartIcon className="w-3.5 h-3.5" /> Play Game / Dashboard
          </Link>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <header className="h-16 bg-[hsl(20_14%_5%)] border-b border-border flex items-center justify-between px-4 md:px-8 sticky top-0 z-30">
          <button className="md:hidden text-muted-foreground hover:text-foreground" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="hidden md:flex items-center gap-2">
            <Shield className="w-4 h-4 text-gold-400" />
            <span className="text-sm font-medium text-gold-400">Admin Panel</span>
            <span className="text-muted-foreground mx-2">·</span>
            <span className="text-sm text-muted-foreground">{navItems.find(n => n.href === pathname)?.label}</span>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
