import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createCheckoutSession } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { planType, charityId, charityPercentage } = await req.json()

    // Get or create subscription record in pending state
    const { data: profile } = await supabase.from('profiles').select('email').eq('id', user.id).single()

    const session = await createCheckoutSession({
      userId: user.id,
      email: profile?.email || user.email || '',
      planType,
      charityId: charityId || '',
      charityPercentage: charityPercentage || 10,
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?success=true`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?cancelled=true`,
    })

    return NextResponse.json({ url: session.url, sessionId: session.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
