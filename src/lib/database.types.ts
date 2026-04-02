// Auto-generated Supabase types
// Regenerate with: npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/database.types.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          handicap: number | null
          phone: string | null
          country: string
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          handicap?: number | null
          phone?: string | null
          country?: string
          role?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          handicap?: number | null
          phone?: string | null
          country?: string
          role?: string
          updated_at?: string
        }
      }
      charities: {
        Row: {
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
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          long_description?: string | null
          logo_url?: string | null
          banner_url?: string | null
          website_url?: string | null
          category?: string | null
          is_featured?: boolean
          is_active?: boolean
          total_raised?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          slug?: string
          description?: string | null
          long_description?: string | null
          logo_url?: string | null
          banner_url?: string | null
          website_url?: string | null
          category?: string | null
          is_featured?: boolean
          is_active?: boolean
          total_raised?: number
          updated_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          stripe_subscription_id: string | null
          stripe_customer_id: string | null
          plan_type: string
          status: string
          amount: number
          currency: string
          current_period_start: string | null
          current_period_end: string | null
          cancel_at_period_end: boolean
          charity_id: string | null
          charity_percentage: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_subscription_id?: string | null
          stripe_customer_id?: string | null
          plan_type: string
          status?: string
          amount: number
          currency?: string
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          charity_id?: string | null
          charity_percentage?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          stripe_subscription_id?: string | null
          stripe_customer_id?: string | null
          plan_type?: string
          status?: string
          amount?: number
          currency?: string
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          charity_id?: string | null
          charity_percentage?: number
          updated_at?: string
        }
      }
      golf_scores: {
        Row: {
          id: string
          user_id: string
          score: number
          played_at: string
          course_name: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          score: number
          played_at: string
          course_name?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          score?: number
          played_at?: string
          course_name?: string | null
          notes?: string | null
          updated_at?: string
        }
      }
      draws: {
        Row: {
          id: string
          title: string
          draw_month: number
          draw_year: number
          status: string
          draw_type: string
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
        Insert: {
          id?: string
          title: string
          draw_month: number
          draw_year: number
          status?: string
          draw_type?: string
          winning_numbers?: number[]
          total_pool?: number
          jackpot_amount?: number
          jackpot_rolled_over?: boolean
          jackpot_rollover_from?: string | null
          four_match_pool?: number
          three_match_pool?: number
          participant_count?: number
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          status?: string
          draw_type?: string
          winning_numbers?: number[]
          total_pool?: number
          jackpot_amount?: number
          jackpot_rolled_over?: boolean
          four_match_pool?: number
          three_match_pool?: number
          participant_count?: number
          published_at?: string | null
          updated_at?: string
        }
      }
      draw_entries: {
        Row: {
          id: string
          draw_id: string
          user_id: string
          entry_numbers: number[]
          match_count: number
          prize_tier: string | null
          prize_amount: number
          created_at: string
        }
        Insert: {
          id?: string
          draw_id: string
          user_id: string
          entry_numbers: number[]
          match_count?: number
          prize_tier?: string | null
          prize_amount?: number
          created_at?: string
        }
        Update: {
          match_count?: number
          prize_tier?: string | null
          prize_amount?: number
        }
      }
      winners: {
        Row: {
          id: string
          draw_id: string
          user_id: string
          draw_entry_id: string
          match_type: string
          prize_amount: number
          verification_status: string
          proof_url: string | null
          proof_submitted_at: string | null
          admin_notes: string | null
          payment_status: string
          payment_date: string | null
          paid_by_admin_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          draw_id: string
          user_id: string
          draw_entry_id: string
          match_type: string
          prize_amount: number
          verification_status?: string
          proof_url?: string | null
          proof_submitted_at?: string | null
          admin_notes?: string | null
          payment_status?: string
          payment_date?: string | null
          paid_by_admin_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          verification_status?: string
          proof_url?: string | null
          proof_submitted_at?: string | null
          admin_notes?: string | null
          payment_status?: string
          payment_date?: string | null
          paid_by_admin_id?: string | null
          updated_at?: string
        }
      }
      charity_contributions: {
        Row: {
          id: string
          user_id: string
          charity_id: string
          subscription_id: string | null
          amount: number
          contribution_type: string
          period_month: number | null
          period_year: number | null
          stripe_payment_intent_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          charity_id: string
          subscription_id?: string | null
          amount: number
          contribution_type?: string
          period_month?: number | null
          period_year?: number | null
          stripe_payment_intent_id?: string | null
          created_at?: string
        }
        Update: {
          amount?: number
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type?: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          is_read?: boolean
        }
      }
      prize_pool_settings: {
        Row: {
          id: string
          monthly_plan_amount: number
          yearly_plan_amount: number
          pool_contribution_percentage: number
          five_match_pool_share: number
          four_match_pool_share: number
          three_match_pool_share: number
          updated_at: string
        }
        Insert: {
          id?: string
          monthly_plan_amount?: number
          yearly_plan_amount?: number
          pool_contribution_percentage?: number
          five_match_pool_share?: number
          four_match_pool_share?: number
          three_match_pool_share?: number
          updated_at?: string
        }
        Update: {
          monthly_plan_amount?: number
          yearly_plan_amount?: number
          pool_contribution_percentage?: number
          five_match_pool_share?: number
          four_match_pool_share?: number
          three_match_pool_share?: number
          updated_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: {
      increment_charity_raised: {
        Args: { p_charity_id: string; p_amount: number }
        Returns: void
      }
    }
    Enums: Record<string, never>
  }
}
