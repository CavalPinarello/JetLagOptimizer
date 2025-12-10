-- JetLagOptimizer Initial Schema
-- Creates all tables for user profiles, trips, protocols, and questionnaire data

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PROFILES TABLE (extends Supabase auth.users)
-- ============================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- CIRCADIAN PROFILES TABLE
-- ============================================================================
CREATE TYPE chronotype_category AS ENUM (
  'definite_morning',
  'moderate_morning',
  'intermediate',
  'moderate_evening',
  'definite_evening'
);

CREATE TYPE assessment_method AS ENUM ('MEQ', 'MCTQ', 'BOTH');

CREATE TABLE IF NOT EXISTS circadian_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Questionnaire results
  meq_score INTEGER CHECK (meq_score >= 16 AND meq_score <= 86),
  mctq_msfsc DECIMAL(4,2), -- Hours (e.g., 3.5 = 3:30 AM)
  chronotype_category chronotype_category NOT NULL,

  -- Estimated timing markers (stored as TIME)
  estimated_dlmo TIME NOT NULL,
  estimated_cbtmin TIME NOT NULL,

  -- Habitual sleep window
  habitual_bedtime TIME NOT NULL,
  habitual_wake_time TIME NOT NULL,
  average_sleep_duration INTEGER NOT NULL, -- minutes

  -- Work schedule (for MCTQ)
  workday_bedtime TIME,
  workday_wake_time TIME,
  freeday_bedtime TIME,
  freeday_wake_time TIME,
  uses_alarm_on_freedays BOOLEAN DEFAULT FALSE,

  -- Metadata
  assessment_method assessment_method NOT NULL,
  last_assessment_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- One circadian profile per user
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE circadian_profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own circadian profile"
  ON circadian_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own circadian profile"
  ON circadian_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own circadian profile"
  ON circadian_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own circadian profile"
  ON circadian_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- USER PREFERENCES TABLE
-- ============================================================================
CREATE TYPE exercise_frequency AS ENUM ('never', 'occasionally', 'regularly', 'daily');
CREATE TYPE exercise_time AS ENUM ('morning', 'afternoon', 'evening', 'flexible');
CREATE TYPE time_format AS ENUM ('12h', '24h');

CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Supplement preferences
  uses_melatonin BOOLEAN DEFAULT FALSE,
  melatonin_dose DECIMAL(3,1) DEFAULT 0.5, -- mg
  uses_creatine BOOLEAN DEFAULT FALSE,
  creatine_dose DECIMAL(3,1) DEFAULT 5, -- grams

  -- Caffeine habits
  caffeine_user BOOLEAN DEFAULT TRUE,
  caffeine_cutoff_hours INTEGER DEFAULT 6,

  -- Exercise preferences
  exercise_frequency exercise_frequency DEFAULT 'occasionally',
  preferred_exercise_time exercise_time DEFAULT 'flexible',

  -- Display preferences
  dark_mode BOOLEAN DEFAULT FALSE,
  time_format time_format DEFAULT '24h',
  home_timezone TEXT DEFAULT 'UTC',

  -- Protocol preferences
  aggressive_adjustment BOOLEAN DEFAULT FALSE,
  include_nap_guidance BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Create default preferences for new users
CREATE OR REPLACE FUNCTION public.handle_new_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_profile_created
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile();

-- ============================================================================
-- TRIPS TABLE
-- ============================================================================
CREATE TYPE trip_direction AS ENUM ('eastward', 'westward');
CREATE TYPE trip_status AS ENUM ('upcoming', 'active', 'completed', 'archived');
CREATE TYPE trip_purpose AS ENUM ('business', 'leisure', 'athletic', 'other');

CREATE TABLE IF NOT EXISTS trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,

  -- Origin
  origin_city TEXT NOT NULL,
  origin_airport TEXT,
  origin_timezone TEXT NOT NULL,
  origin_offset_minutes INTEGER NOT NULL,

  -- Destination
  destination_city TEXT NOT NULL,
  destination_airport TEXT,
  destination_timezone TEXT NOT NULL,
  destination_offset_minutes INTEGER NOT NULL,

  -- Timing
  departure_datetime TIMESTAMPTZ NOT NULL,
  arrival_datetime TIMESTAMPTZ NOT NULL,
  flight_duration INTEGER NOT NULL, -- minutes

  -- Calculated
  timezone_shift_hours DECIMAL(4,1) NOT NULL,
  direction trip_direction NOT NULL,

  -- Return trip
  has_return_trip BOOLEAN DEFAULT FALSE,
  return_departure_datetime TIMESTAMPTZ,
  return_arrival_datetime TIMESTAMPTZ,

  -- Metadata
  trip_duration_days INTEGER NOT NULL,
  is_short_trip BOOLEAN DEFAULT FALSE,
  purpose trip_purpose DEFAULT 'leisure',
  notes TEXT,

  -- Protocol reference
  protocol_id UUID,
  protocol_generated_at TIMESTAMPTZ,

  -- Status
  status trip_status DEFAULT 'upcoming',

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for common queries
CREATE INDEX idx_trips_user_id ON trips(user_id);
CREATE INDEX idx_trips_status ON trips(status);
CREATE INDEX idx_trips_departure ON trips(departure_datetime);

-- Enable RLS
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own trips"
  ON trips FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trips"
  ON trips FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trips"
  ON trips FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own trips"
  ON trips FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- PROTOCOLS TABLE
-- ============================================================================
CREATE TYPE protocol_phase AS ENUM ('pre_departure', 'in_flight', 'destination', 'adjusted');

CREATE TABLE IF NOT EXISTS protocols (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Target schedule
  target_bedtime TIME NOT NULL,
  target_wake_time TIME NOT NULL,

  -- Adjustment estimates
  estimated_days_to_adjust INTEGER NOT NULL,
  adjustment_rate_per_day DECIMAL(3,1) NOT NULL,

  -- Direction
  direction trip_direction NOT NULL,

  -- Days stored as JSONB (array of ProtocolDay objects)
  days JSONB NOT NULL,

  -- Metadata
  chronotype_used chronotype_category NOT NULL,
  interventions_enabled TEXT[] NOT NULL, -- Array of intervention types
  version TEXT DEFAULT '1.0',

  generated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  UNIQUE(trip_id)
);

-- Enable RLS
ALTER TABLE protocols ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own protocols"
  ON protocols FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own protocols"
  ON protocols FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own protocols"
  ON protocols FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own protocols"
  ON protocols FOR DELETE
  USING (auth.uid() = user_id);

-- Update trip with protocol reference
CREATE OR REPLACE FUNCTION public.link_protocol_to_trip()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE trips
  SET protocol_id = NEW.id,
      protocol_generated_at = NEW.generated_at
  WHERE id = NEW.trip_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_protocol_created
  AFTER INSERT ON protocols
  FOR EACH ROW EXECUTE FUNCTION public.link_protocol_to_trip();

-- ============================================================================
-- QUESTIONNAIRE RESPONSES TABLE
-- ============================================================================
CREATE TYPE questionnaire_type AS ENUM ('MEQ', 'MCTQ');
CREATE TYPE questionnaire_status AS ENUM ('in_progress', 'completed', 'abandoned');

CREATE TABLE IF NOT EXISTS questionnaire_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type questionnaire_type NOT NULL,

  -- Responses stored as JSONB
  responses JSONB NOT NULL DEFAULT '[]',

  -- Progress
  current_question_index INTEGER DEFAULT 0,
  status questionnaire_status DEFAULT 'in_progress',

  -- Results (populated on completion)
  total_score INTEGER,
  calculated_values JSONB,

  started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMPTZ
);

-- Index for user's responses
CREATE INDEX idx_questionnaire_user ON questionnaire_responses(user_id);
CREATE INDEX idx_questionnaire_status ON questionnaire_responses(status);

-- Enable RLS
ALTER TABLE questionnaire_responses ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own questionnaire responses"
  ON questionnaire_responses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own questionnaire responses"
  ON questionnaire_responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own questionnaire responses"
  ON questionnaire_responses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own questionnaire responses"
  ON questionnaire_responses FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- INTERVENTION COMPLETIONS TABLE (for tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS intervention_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  protocol_id UUID NOT NULL REFERENCES protocols(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  day_number INTEGER NOT NULL,
  intervention_id TEXT NOT NULL,

  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  skipped BOOLEAN DEFAULT FALSE,
  skip_reason TEXT,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  UNIQUE(protocol_id, day_number, intervention_id)
);

-- Index for common queries
CREATE INDEX idx_completions_protocol ON intervention_completions(protocol_id);
CREATE INDEX idx_completions_user ON intervention_completions(user_id);

-- Enable RLS
ALTER TABLE intervention_completions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own completions"
  ON intervention_completions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own completions"
  ON intervention_completions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own completions"
  ON intervention_completions FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_circadian_profiles_updated_at
  BEFORE UPDATE ON circadian_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trips_updated_at
  BEFORE UPDATE ON trips
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_intervention_completions_updated_at
  BEFORE UPDATE ON intervention_completions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
