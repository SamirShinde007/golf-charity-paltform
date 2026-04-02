import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
})

export const STRIPE_PLANS = {
  monthly: {
    priceId: process.env.STRIPE_MONTHLY_PRICE_ID!,
    amount: 2000, // €20.00 in cents
    name: 'Monthly Plan',
    interval: 'month' as const,
  },
  yearly: {
    priceId: process.env.STRIPE_YEARLY_PRICE_ID!,
    amount: 20000, // €200.00 in cents
    name: 'Yearly Plan',
    interval: 'year' as const,
  },
}

export async function createCheckoutSession({
  userId,
  email,
  planType,
  charityId,
  charityPercentage,
  successUrl,
  cancelUrl,
}: {
  userId: string
  email: string
  planType: 'monthly' | 'yearly'
  charityId: string
  charityPercentage: number
  successUrl: string
  cancelUrl: string
}) {
  const plan = STRIPE_PLANS[planType]

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: email,
    line_items: [{ price: plan.priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId,
      planType,
      charityId,
      charityPercentage: charityPercentage.toString(),
    },
    subscription_data: {
      metadata: {
        userId,
        planType,
        charityId,
        charityPercentage: charityPercentage.toString(),
      },
    },
  })

  return session
}

export async function createCustomerPortalSession({
  customerId,
  returnUrl,
}: {
  customerId: string
  returnUrl: string
}) {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
}

export async function cancelSubscription(subscriptionId: string) {
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  })
}

export function constructWebhookEvent(payload: string, signature: string) {
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  )
}
