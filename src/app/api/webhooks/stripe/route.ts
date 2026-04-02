import { NextRequest, NextResponse } from 'next/server'
import { constructWebhookEvent } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'

// Use service role for webhook (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')!

  let event
  try {
    event = constructWebhookEvent(body, signature)
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any
        const { userId, planType, charityId, charityPercentage } = session.metadata

        // Upsert subscription
        // @ts-ignore
        await supabase.from('subscriptions').upsert({
          user_id: userId,
          stripe_subscription_id: session.subscription,
          stripe_customer_id: session.customer,
          plan_type: planType,
          status: 'active',
          amount: planType === 'monthly' ? 20 : 200,
          currency: 'eur',
          charity_id: charityId || null,
          charity_percentage: parseInt(charityPercentage) || 10,
        }, { onConflict: 'user_id' })

        // Log charity contribution
        if (charityId) {
          const contribution = planType === 'monthly' ? 20 : (200 / 12)
          const charityAmount = (contribution * parseInt(charityPercentage)) / 100
          const now = new Date()
          // @ts-ignore
          await supabase.from('charity_contributions').insert({
            user_id: userId,
            charity_id: charityId,
            amount: charityAmount,
            contribution_type: 'subscription',
            period_month: now.getMonth() + 1,
            period_year: now.getFullYear(),
            stripe_payment_intent_id: session.payment_intent,
          })

          // Update charity total raised
          await supabase.rpc('increment_charity_raised', {
            p_charity_id: charityId,
            p_amount: charityAmount,
          })
        }

        // Send welcome notification
        // @ts-ignore
        await supabase.from('notifications').insert({
          user_id: userId,
          title: 'Welcome to GreenHeart! 🎉',
          message: `Your ${planType} subscription is now active. You're automatically entered into this month's draw!`,
          type: 'subscription',
        })
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as any
        const userId = sub.metadata?.userId

        if (userId) {
          // @ts-ignore
          await supabase.from('subscriptions').update({
            status: sub.status,
            current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            cancel_at_period_end: sub.cancel_at_period_end,
          }).eq('stripe_subscription_id', sub.id)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as any
        // @ts-ignore
        await supabase.from('subscriptions').update({
          status: 'cancelled',
        }).eq('stripe_subscription_id', sub.id)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any
        // Handle recurring subscription payment
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('user_id, charity_id, charity_percentage, plan_type, amount')
          .eq('stripe_subscription_id', invoice.subscription)
          .single()

        if (subscription?.charity_id) {
          const charityAmount = (subscription.amount * subscription.charity_percentage) / 100
          const now = new Date()
          // @ts-ignore
          await supabase.from('charity_contributions').insert({
            user_id: subscription.user_id,
            charity_id: subscription.charity_id,
            amount: charityAmount,
            contribution_type: 'subscription',
            period_month: now.getMonth() + 1,
            period_year: now.getFullYear(),
            stripe_payment_intent_id: invoice.payment_intent,
          })
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any
        // @ts-ignore
        await supabase.from('subscriptions').update({ status: 'past_due' })
          .eq('stripe_subscription_id', invoice.subscription)

        const { data: sub } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', invoice.subscription)
          .single()

        if (sub?.user_id) {
          // @ts-ignore
          await supabase.from('notifications').insert({
            user_id: sub.user_id,
            title: 'Payment Failed',
            message: 'Your subscription payment failed. Please update your payment method to continue.',
            type: 'subscription',
          })
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('Webhook processing error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
