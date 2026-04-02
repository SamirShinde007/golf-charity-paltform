// ============================================================
// GOLF CHARITY PLATFORM — SHARED TYPES
// ============================================================

export type UserRole = 'subscriber' | 'admin'
export type SubscriptionStatus = 'active' | 'inactive' | 'cancelled' | 'past_due' | 'trialing'
export type PlanType = 'monthly' | 'yearly'
export type DrawStatus = 'pending' | 'simulation' | 'published' | 'completed'
export type DrawType = 'random' | 'algorithmic'
export type MatchType = 'five_match' | 'four_match' | 'three_match'
export type VerificationStatus = 'pending' | 'submitted' | 'approved' | 'rejected'
export type PaymentStatus = 'pending' | 'paid'
export type ContributionType = 'subscription' | 'donation'
export type NotificationType = 'info' | 'success' | 'warning' | 'draw_result' | 'winner' | 'subscription'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  handicap: number | null
  phone: string | null
  country: string
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Charity {
  id: string
  name: string
  slug: string
  description: string | null
  long_description: string | null
  logo_url: string | null
  banner_url: string | null
  website_url: string | null
  category: string | null
  is_featured: boolean
  is_active: boolean
  total_raised: number
  created_at: string
  updated_at: string
  events?: CharityEvent[]
}

export interface CharityEvent {
  id: string
  charity_id: string
  title: string
  description: string | null
  event_date: string | null
  location: string | null
  image_url: string | null
  created_at: string
}

export interface Subscription {
  id: string
  user_id: string
  stripe_subscription_id: string | null
  stripe_customer_id: string | null
  plan_type: PlanType
  status: SubscriptionStatus
  amount: number
  currency: string
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  charity_id: string | null
  charity_percentage: number
  created_at: string
  updated_at: string
  charity?: Charity
}

export interface GolfScore {
  id: string
  user_id: string
  score: number
  played_at: string
  course_name: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Draw {
  id: string
  title: string
  draw_month: number
  draw_year: number
  status: DrawStatus
  draw_type: DrawType
  winning_numbers: number[]
  total_pool: number
  jackpot_amount: number
  jackpot_rolled_over: boolean
  jackpot_rollover_from: string | null
  four_match_pool: number
  three_match_pool: number
  participant_count: number
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface DrawEntry {
  id: string
  draw_id: string
  user_id: string
  entry_numbers: number[]
  match_count: number
  prize_tier: MatchType | null
  prize_amount: number
  created_at: string
  draw?: Draw
  profile?: Profile
}

export interface Winner {
  id: string
  draw_id: string
  user_id: string
  draw_entry_id: string
  match_type: MatchType
  prize_amount: number
  verification_status: VerificationStatus
  proof_url: string | null
  proof_submitted_at: string | null
  admin_notes: string | null
  payment_status: PaymentStatus
  payment_date: string | null
  paid_by_admin_id: string | null
  created_at: string
  updated_at: string
  profile?: Profile
  draw?: Draw
}

export interface CharityContribution {
  id: string
  user_id: string
  charity_id: string
  subscription_id: string | null
  amount: number
  contribution_type: ContributionType
  period_month: number | null
  period_year: number | null
  stripe_payment_intent_id: string | null
  created_at: string
  charity?: Charity
}

export interface PrizePoolSettings {
  id: string
  monthly_plan_amount: number
  yearly_plan_amount: number
  pool_contribution_percentage: number
  five_match_pool_share: number
  four_match_pool_share: number
  three_match_pool_share: number
  updated_at: string
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: NotificationType
  is_read: boolean
  created_at: string
}

// Draw Engine Types
export interface DrawSimulationResult {
  winning_numbers: number[]
  five_match_winners: DrawEntry[]
  four_match_winners: DrawEntry[]
  three_match_winners: DrawEntry[]
  jackpot_amount: number
  four_match_prize: number
  three_match_prize: number
  total_pool: number
}

export interface PrizePoolCalculation {
  total_pool: number
  jackpot_pool: number
  four_match_pool: number
  three_match_pool: number
  charity_total: number
  active_subscribers: number
}

// API Response Types
export interface ApiResponse<T> {
  data: T | null
  error: string | null
  success: boolean
}

// Stripe Types
export interface StripeCheckoutSession {
  sessionId: string
  url: string
}

export interface AdminStats {
  total_users: number
  active_subscribers: number
  total_prize_pool: number
  total_charity_raised: number
  pending_winners: number
  draws_this_month: number
}
