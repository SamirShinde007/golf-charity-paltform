import Link from 'next/link'
import { Heart } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-border/50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 font-display font-bold text-xl mb-4">
              <div className="w-8 h-8 bg-jade-500 rounded-lg flex items-center justify-center">
                <Heart className="w-4 h-4 text-white fill-current" />
              </div>
              GreenHeart
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed">
              A golf platform where every round creates real charitable impact.
            </p>
          </div>
          <div>
            <div className="font-semibold text-sm mb-4">Platform</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/#pricing" className="hover:text-jade-400 transition-colors">Pricing</Link></li>
              <li><Link href="/charity" className="hover:text-jade-400 transition-colors">Charities</Link></li>
              <li><Link href="/auth/signup" className="hover:text-jade-400 transition-colors">Sign Up</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-semibold text-sm mb-4">Account</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/auth/login" className="hover:text-jade-400 transition-colors">Sign In</Link></li>
              <li><Link href="/dashboard" className="hover:text-jade-400 transition-colors">Dashboard</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-semibold text-sm mb-4">Legal</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/privacy" className="hover:text-jade-400 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-jade-400 transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border/50 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-sm">© 2025 GreenHeart Golf. All rights reserved.</p>
          <p className="text-muted-foreground text-xs flex items-center gap-1">
            Made with <Heart className="w-3 h-3 text-jade-400 fill-current" /> for golfers who care
          </p>
        </div>
      </div>
    </footer>
  )
}
