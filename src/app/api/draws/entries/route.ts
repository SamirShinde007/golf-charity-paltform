import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@/lib/supabase/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET: Fetch entries for a draw
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const drawId = searchParams.get('draw_id')
  if (!drawId) return NextResponse.json({ error: 'draw_id required' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('draw_entries')
    .select('*, profile:profiles(full_name, email)')
    .eq('draw_id', drawId)
    .order('created_at')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// POST: Enter all active subscribers into a draw
export async function POST(req: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Check admin
    const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { draw_id } = await req.json()

    // Get all active subscribers with their scores
    const { data: activeSubscribers } = await supabaseAdmin
      .from('subscriptions')
      .select('user_id')
      .eq('status', 'active')

    if (!activeSubscribers?.length) {
      return NextResponse.json({ message: 'No active subscribers', count: 0 })
    }

    let entriesCreated = 0

    for (const sub of activeSubscribers) {
      // Get user's 5 most recent scores
      const { data: scores } = await supabaseAdmin
        .from('golf_scores')
        .select('score')
        .eq('user_id', sub.user_id)
        .order('played_at', { ascending: false })
        .limit(5)

      if (!scores || scores.length === 0) continue

      const entryNumbers = scores.map(s => s.score)

      // Upsert entry (don't duplicate)
      const { error } = await supabaseAdmin
        .from('draw_entries')
        .upsert({
          draw_id,
          user_id: sub.user_id,
          entry_numbers: entryNumbers,
          match_count: 0,
          prize_amount: 0,
        }, { onConflict: 'draw_id,user_id' })

      if (!error) entriesCreated++
    }

    // Update participant count on draw
    // @ts-ignore
    await supabaseAdmin
      .from('draws')
      .update({ participant_count: entriesCreated })
      .eq('id', draw_id)

    return NextResponse.json({ message: 'Entries created', count: entriesCreated })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
