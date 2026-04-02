-- ============================================================
-- GOLF CHARITY SUBSCRIPTION PLATFORM — SUPABASE SCHEMA
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  handicap INTEGER,
  phone TEXT,
  country TEXT DEFAULT 'IE',
  role TEXT NOT NULL DEFAULT 'subscriber' CHECK (role IN ('subscriber', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CHARITIES
-- ============================================================
CREATE TABLE public.charities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  long_description TEXT,
  logo_url TEXT,
  banner_url TEXT,
  website_url TEXT,
  category TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  total_raised DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Charity Events
CREATE TABLE public.charity_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  charity_id UUID REFERENCES public.charities(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ,
  location TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
CREATE TABLE public.subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('monthly', 'yearly')),
  status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'cancelled', 'past_due', 'trialing')),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'eur',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  charity_id UUID REFERENCES public.charities(id),
  charity_percentage INTEGER DEFAULT 10 CHECK (charity_percentage BETWEEN 10 AND 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- GOLF SCORES
-- ============================================================
CREATE TABLE public.golf_scores (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score BETWEEN 1 AND 45),
  played_at DATE NOT NULL,
  course_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast score lookups
CREATE INDEX idx_golf_scores_user_played ON public.golf_scores(user_id, played_at DESC);

-- ============================================================
-- DRAWS
-- ============================================================
CREATE TABLE public.draws (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  draw_month INTEGER NOT NULL CHECK (draw_month BETWEEN 1 AND 12),
  draw_year INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'simulation', 'published', 'completed')),
  draw_type TEXT NOT NULL DEFAULT 'random' CHECK (draw_type IN ('random', 'algorithmic')),
  winning_numbers INTEGER[] NOT NULL DEFAULT '{}',
  total_pool DECIMAL(10,2) DEFAULT 0,
  jackpot_amount DECIMAL(10,2) DEFAULT 0,
  jackpot_rolled_over BOOLEAN DEFAULT FALSE,
  jackpot_rollover_from UUID REFERENCES public.draws(id),
  four_match_pool DECIMAL(10,2) DEFAULT 0,
  three_match_pool DECIMAL(10,2) DEFAULT 0,
  participant_count INTEGER DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(draw_month, draw_year)
);

-- ============================================================
-- DRAW ENTRIES (users participating in a draw)
-- ============================================================
CREATE TABLE public.draw_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  draw_id UUID REFERENCES public.draws(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  entry_numbers INTEGER[] NOT NULL,  -- user's 5 scores used as draw numbers
  match_count INTEGER DEFAULT 0,
  prize_tier TEXT CHECK (prize_tier IN ('five_match', 'four_match', 'three_match')),
  prize_amount DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(draw_id, user_id)
);

-- ============================================================
-- WINNERS
-- ============================================================
CREATE TABLE public.winners (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  draw_id UUID REFERENCES public.draws(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  draw_entry_id UUID REFERENCES public.draw_entries(id),
  match_type TEXT NOT NULL CHECK (match_type IN ('five_match', 'four_match', 'three_match')),
  prize_amount DECIMAL(10,2) NOT NULL,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'submitted', 'approved', 'rejected')),
  proof_url TEXT,
  proof_submitted_at TIMESTAMPTZ,
  admin_notes TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid')),
  payment_date TIMESTAMPTZ,
  paid_by_admin_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CHARITY CONTRIBUTIONS
-- ============================================================
CREATE TABLE public.charity_contributions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  charity_id UUID REFERENCES public.charities(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id),
  amount DECIMAL(10,2) NOT NULL,
  contribution_type TEXT DEFAULT 'subscription' CHECK (contribution_type IN ('subscription', 'donation')),
  period_month INTEGER,
  period_year INTEGER,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PRIZE POOL SETTINGS
-- ============================================================
CREATE TABLE public.prize_pool_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  monthly_plan_amount DECIMAL(10,2) DEFAULT 20.00,
  yearly_plan_amount DECIMAL(10,2) DEFAULT 200.00,
  pool_contribution_percentage INTEGER DEFAULT 50,  -- % of sub that goes to prize pool
  five_match_pool_share INTEGER DEFAULT 40,
  four_match_pool_share INTEGER DEFAULT 35,
  three_match_pool_share INTEGER DEFAULT 25,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO public.prize_pool_settings 
  (monthly_plan_amount, yearly_plan_amount, pool_contribution_percentage, 
   five_match_pool_share, four_match_pool_share, three_match_pool_share)
VALUES (20.00, 200.00, 50, 40, 35, 25);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'draw_result', 'winner', 'subscription')),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (public.is_admin());

-- Golf Scores
ALTER TABLE public.golf_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own scores" ON public.golf_scores FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all scores" ON public.golf_scores FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own subscription" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all subscriptions" ON public.subscriptions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Draws (public read for published)
ALTER TABLE public.draws ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view published draws" ON public.draws FOR SELECT USING (status = 'published' OR status = 'completed');
CREATE POLICY "Admins can manage draws" ON public.draws FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Draw Entries
ALTER TABLE public.draw_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own entries" ON public.draw_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all entries" ON public.draw_entries FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Winners
ALTER TABLE public.winners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own wins" ON public.winners FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can submit proof" ON public.winners FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all winners" ON public.winners FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Charities (public read)
ALTER TABLE public.charities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active charities" ON public.charities FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Admins can manage charities" ON public.charities FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Charity Events (public read)
ALTER TABLE public.charity_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view events" ON public.charity_events FOR SELECT USING (TRUE);
CREATE POLICY "Admins can manage events" ON public.charity_events FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Charity Contributions
ALTER TABLE public.charity_contributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own contributions" ON public.charity_contributions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all contributions" ON public.charity_contributions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id);

-- Prize Pool Settings (public read)
ALTER TABLE public.prize_pool_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view settings" ON public.prize_pool_settings FOR SELECT USING (TRUE);
CREATE POLICY "Admins can update settings" ON public.prize_pool_settings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enforce max 5 scores per user (rolling window)
CREATE OR REPLACE FUNCTION public.enforce_score_limit()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete oldest scores beyond 5
  DELETE FROM public.golf_scores
  WHERE id IN (
    SELECT id FROM public.golf_scores
    WHERE user_id = NEW.user_id
    ORDER BY played_at DESC, created_at DESC
    OFFSET 4
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER after_score_insert
  AFTER INSERT ON public.golf_scores
  FOR EACH ROW EXECUTE FUNCTION public.enforce_score_limit();

-- Update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_scores_updated_at BEFORE UPDATE ON public.golf_scores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_draws_updated_at BEFORE UPDATE ON public.draws FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_winners_updated_at BEFORE UPDATE ON public.winners FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_charities_updated_at BEFORE UPDATE ON public.charities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- SEED DATA — Sample Charities
-- ============================================================
INSERT INTO public.charities (name, slug, description, long_description, category, is_featured, is_active) VALUES
('Irish Heart Foundation', 'irish-heart-foundation', 'Fighting heart disease and stroke across Ireland', 'The Irish Heart Foundation is Irelands leading charity fighting heart disease and stroke. We provide support, information and advocacy for people affected by heart disease and stroke.', 'Health', TRUE, TRUE),
('St. Vincent de Paul', 'st-vincent-de-paul', 'Supporting people in poverty across Ireland', 'The Society of St. Vincent de Paul is one of Irelands largest voluntary charitable organisations, providing practical support to people experiencing poverty.', 'Social', TRUE, TRUE),
('ISPCC Childline', 'ispcc-childline', 'Protecting children and young people in Ireland', 'ISPCC Childline provides a free, confidential helpline service for children and young people in Ireland who need to talk to someone about any issues they are facing.', 'Children', FALSE, TRUE),
('Dogs Trust Ireland', 'dogs-trust-ireland', 'Caring for dogs across Ireland', 'Dogs Trust Ireland is the largest dog welfare charity in Ireland, rescuing and rehoming thousands of dogs each year.', 'Animals', FALSE, TRUE),
('Pieta House', 'pieta-house', 'Providing hope to those in suicidal crisis', 'Pieta House provides a free, therapeutic service to people who are in suicidal distress and those who have engaged in self-harm.', 'Mental Health', TRUE, TRUE);
