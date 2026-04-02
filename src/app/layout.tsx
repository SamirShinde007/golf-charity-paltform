import type { Metadata } from 'next'
import { Playfair_Display, DM_Sans } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'GreenHeart Golf | Play. Give. Win.',
  description: 'A subscription golf platform combining performance tracking, monthly prize draws, and charitable giving. Play for good.',
  keywords: 'golf, charity, subscription, prize draw, stableford, fundraising',
  openGraph: {
    title: 'GreenHeart Golf | Play. Give. Win.',
    description: 'A subscription golf platform combining performance tracking, monthly prize draws, and charitable giving.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable}`}>
      <body className="font-body bg-background text-foreground antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
