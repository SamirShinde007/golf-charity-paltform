'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Menu, X, Heart } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)

    const checkSession = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
    }
    checkSession()

    return () => window.removeEventListener('scroll', handler)
  }, [])

  const links = [
    { href: '/charity', label: 'Charities' },
    { href: '/#pricing', label: 'Pricing' },
  ]

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'glass border-b border-white/5' : ''
    }`}>
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-display font-bold text-xl">
          <div className="w-8 h-8 bg-jade-500 rounded-lg flex items-center justify-center">
            <Heart className="w-4 h-4 text-white fill-current" />
          </div>
          <span>GreenHeart</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors hover:text-jade-400 ${
                pathname === link.href ? 'text-jade-400' : 'text-muted-foreground'
              }`}
            >
              {link.label}
            </Link>
          ))}
          {user ? (
            <Link
              href="/dashboard"
              className="bg-jade-500 hover:bg-jade-400 text-white px-5 py-2 rounded-full text-sm font-semibold transition-colors"
            >
              My Game / Dashboard
            </Link>
          ) : (
            <div className="flex items-center gap-6">
              <Link href="/auth/login" className="text-sm font-medium transition-colors hover:text-jade-400 text-muted-foreground">
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="bg-jade-500 hover:bg-jade-400 text-white px-5 py-2 rounded-full text-sm font-semibold transition-colors"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-muted-foreground hover:text-foreground"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden glass border-t border-white/5 px-4 py-4 flex flex-col gap-4">
          {links.map(link => (
            <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)}
              className="text-sm font-medium text-muted-foreground hover:text-jade-400 transition-colors">
              {link.label}
            </Link>
          ))}
          {user ? (
            <Link href="/dashboard" onClick={() => setMenuOpen(false)}
              className="bg-jade-500 text-white px-5 py-2 rounded-full text-sm font-semibold text-center mt-2">
              My Game / Dashboard
            </Link>
          ) : (
            <>
              <Link href="/auth/login" onClick={() => setMenuOpen(false)}
                className="text-sm font-medium text-muted-foreground hover:text-jade-400 transition-colors">
                Sign In
              </Link>
              <Link href="/auth/signup" onClick={() => setMenuOpen(false)}
                className="bg-jade-500 text-white px-5 py-2 rounded-full text-sm font-semibold text-center mt-2">
                Get Started
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
