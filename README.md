# GreenHeart Golf — Full Stack Platform

A subscription-based golf platform combining performance tracking, monthly prize draws, and charitable giving.

## 🚀 Quick Deploy Guide

### Prerequisites

- Node.js 18+
- A new Supabase account & project
- A new Vercel account
- Stripe account with test keys

---

## Step 1: Supabase Setup

1. Create a new project at https://supabase.com
2. Go to **SQL Editor** and run the entire contents of `supabase/schema.sql`
3. Go to **Storage** → Create bucket named `winner-proofs` (set to public)
4. Add this SQL function for charity totals:

```sql
CREATE OR REPLACE FUNCTION public.increment_charity_raised(p_charity_id UUID, p_amount DECIMAL)
RETURNS VOID AS $$
BEGIN
  UPDATE public.charities SET total_raised = total_raised + p_amount WHERE id = p_charity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

5. Grab your project URL, anon key, and service role key from **Settings → API**

---

## Step 2: Stripe Setup

1. Go to https://stripe.com → Dashboard
2. Create two products/prices:
   - **Monthly**: €20/month recurring → copy the Price ID
   - **Yearly**: €200/year recurring → copy the Price ID
3. Enable **Customer Portal** in Stripe Dashboard → Billing → Customer portal
4. Set up webhook:
   - Endpoint: `https://your-domain.vercel.app/api/webhooks/stripe`
   - Events to listen:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`

---

## Step 3: Local Development

```bash
# Install dependencies
npm install

# Copy env file
cp .env.example .env.local

# Fill in all values in .env.local

# Run development server
npm run dev
```

---

## Step 4: Deploy to Vercel

1. Push code to GitHub
2. Create new project on Vercel (new account as per requirements)
3. Import repository
4. Add all environment variables from `.env.example`
5. Deploy!

---

## Step 5: Create Admin User

After deploying and signing up:

1. Go to Supabase → Table Editor → profiles
2. Find your user and change `role` from `subscriber` to `admin`
3. Log back in — you'll be redirected to `/admin`

---

## Test Credentials (set these up yourself)

| Role  | Email          | Password  |
| ----- | -------------- | --------- |
| Admin | admin@test.com | Admin123! |
| User  | user@test.com  | User123!  |

Use Stripe test card: `4242 4242 4242 4242` (any future date, any CVC)

---

## 🏗️ Architecture

```
src/
├── app/
│   ├── (public)     Homepage, charity directory
│   ├── auth/        Login, signup
│   ├── dashboard/   User panel (scores, charity, draws, winnings, settings)
│   ├── admin/       Admin panel (users, draws, charities, winners, reports)
│   └── api/         Stripe checkout, portal, webhooks
├── components/
│   └── layout/      Navbar, footer
├── lib/
│   ├── supabase.ts  DB client
│   ├── stripe.ts    Payment utils
│   ├── draw-engine.ts  Core draw algorithm
│   └── constants.ts
└── types/           Full TypeScript types
```

## Database Schema

| Table                 | Purpose                               |
| --------------------- | ------------------------------------- |
| profiles              | User accounts (extends Supabase auth) |
| subscriptions         | Stripe subscription state             |
| golf_scores           | Rolling 5-score system                |
| draws                 | Monthly draw records                  |
| draw_entries          | User participation in draws           |
| winners               | Winner records + verification state   |
| charities             | Charity directory                     |
| charity_events        | Events per charity                    |
| charity_contributions | Tracked donations                     |
| prize_pool_settings   | Configurable pool percentages         |
| notifications         | In-app notifications                  |

---

## Key Features

- **Rolling Score System**: DB trigger auto-removes oldest score when 6th is added
- **Draw Engine**: Random OR algorithmic (frequency-weighted) draw number generation
- **Prize Pool**: Auto-calculated 40/35/25% split from active subscriber count
- **Jackpot Rollover**: If no 5-match winner, jackpot carries to next month
- **Charity Contribution**: Configurable %, auto-logged on every subscription payment
- **Winner Verification**: Upload proof → Admin review → Mark paid workflow
- **Stripe Webhooks**: Full subscription lifecycle handling

---

Built by a candidate for Digital Heroes Full Stack Trainee selection process.
