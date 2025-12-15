-- =====================================================
-- OUTCOMES TABLE: Sector-level external impact metrics
-- =====================================================
CREATE TABLE IF NOT EXISTS public.temp_quarterly_outcomes_data (
  id SERIAL PRIMARY KEY,
  quarter TEXT NOT NULL,
  
  -- Outcome 1: Macroeconomic Impact
  fdi_actual NUMERIC(10, 2),
  fdi_target NUMERIC(10, 2),
  fdi_baseline NUMERIC(10, 2),
  trade_balance_actual NUMERIC(10, 2),
  trade_balance_target NUMERIC(10, 2),
  trade_balance_baseline NUMERIC(10, 2),
  jobs_created_actual NUMERIC(10, 2),
  jobs_created_target NUMERIC(10, 2),
  jobs_created_baseline NUMERIC(10, 2),
  
  -- Outcome 2: Private Sector Partnerships
  partnerships_actual NUMERIC(10, 2),
  partnerships_target NUMERIC(10, 2),
  partnerships_baseline NUMERIC(10, 2),
  
  -- Outcome 3: Citizen Quality of Life (Water, Energy, Transport)
  water_coverage_actual NUMERIC(10, 2),
  water_coverage_target NUMERIC(10, 2),
  water_coverage_baseline NUMERIC(10, 2),
  water_quality_actual NUMERIC(10, 2),
  water_quality_target NUMERIC(10, 2),
  water_quality_baseline NUMERIC(10, 2),
  
  energy_coverage_actual NUMERIC(10, 2),
  energy_coverage_target NUMERIC(10, 2),
  energy_coverage_baseline NUMERIC(10, 2),
  energy_quality_actual NUMERIC(10, 2),
  energy_quality_target NUMERIC(10, 2),
  energy_quality_baseline NUMERIC(10, 2),
  
  transport_coverage_actual NUMERIC(10, 2),
  transport_coverage_target NUMERIC(10, 2),
  transport_coverage_baseline NUMERIC(10, 2),
  transport_quality_actual NUMERIC(10, 2),
  transport_quality_target NUMERIC(10, 2),
  transport_quality_baseline NUMERIC(10, 2),
  
  -- Outcome 4: Community Engagement
  community_engagement_actual NUMERIC(10, 2),
  community_engagement_target NUMERIC(10, 2),
  community_engagement_baseline NUMERIC(10, 2),
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =====================================================
-- INSIGHTS TABLE: Investment portfolio initiatives
-- =====================================================
CREATE TABLE IF NOT EXISTS public.temp_investment_initiatives (
  id SERIAL PRIMARY KEY,
  quarter TEXT NOT NULL,
  initiative_name TEXT NOT NULL,
  budget NUMERIC(10, 2) NOT NULL,
  risk_score NUMERIC(10, 2) NOT NULL,
  alignment_score NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =====================================================
-- SEED DATA: 5 years (2021-2025) quarterly outcomes
-- =====================================================
INSERT INTO public.temp_quarterly_outcomes_data (
  quarter,
  fdi_actual, fdi_target, fdi_baseline,
  trade_balance_actual, trade_balance_target, trade_balance_baseline,
  jobs_created_actual, jobs_created_target, jobs_created_baseline,
  partnerships_actual, partnerships_target, partnerships_baseline,
  water_coverage_actual, water_coverage_target, water_coverage_baseline,
  water_quality_actual, water_quality_target, water_quality_baseline,
  energy_coverage_actual, energy_coverage_target, energy_coverage_baseline,
  energy_quality_actual, energy_quality_target, energy_quality_baseline,
  transport_coverage_actual, transport_coverage_target, transport_coverage_baseline,
  transport_quality_actual, transport_quality_target, transport_quality_baseline,
  community_engagement_actual, community_engagement_target, community_engagement_baseline
) VALUES
-- 2021
('Q1 2021', 0.8, 1.0, 1.0, -12, -10, -10, 2, 3, 3, 35, 40, 45, 70, 75, 70, 5.5, 6.0, 6.0, 72, 75, 75, 6.0, 6.5, 6.5, 60, 65, 65, 5.0, 5.5, 5.5, 25, 30, 30),
('Q2 2021', 0.9, 1.1, 1.0, -11, -9, -10, 2.5, 3.5, 3, 38, 42, 45, 72, 76, 70, 5.7, 6.2, 6.0, 74, 76, 75, 6.2, 6.7, 6.5, 62, 66, 65, 5.2, 5.7, 5.5, 28, 32, 30),
('Q3 2021', 1.0, 1.2, 1.0, -10, -8, -10, 3, 4, 3, 40, 44, 45, 74, 78, 70, 5.9, 6.4, 6.0, 76, 78, 75, 6.4, 6.9, 6.5, 64, 68, 65, 5.4, 5.9, 5.5, 30, 34, 30),
('Q4 2021', 1.1, 1.3, 1.0, -9, -7, -10, 3.5, 4.5, 3, 42, 46, 45, 76, 80, 70, 6.1, 6.6, 6.0, 78, 80, 75, 6.6, 7.1, 6.5, 66, 70, 65, 5.6, 6.1, 5.5, 32, 36, 30),

-- 2022
('Q1 2022', 1.15, 1.35, 1.0, -8.5, -7, -10, 4, 5, 3, 44, 48, 45, 78, 82, 70, 6.3, 6.8, 6.0, 80, 82, 75, 6.8, 7.3, 6.5, 68, 72, 65, 5.8, 6.3, 5.5, 34, 38, 30),
('Q2 2022', 1.2, 1.4, 1.0, -8, -6.5, -10, 4.5, 5.5, 3, 46, 50, 45, 80, 84, 70, 6.5, 7.0, 6.0, 82, 84, 75, 7.0, 7.5, 6.5, 70, 74, 65, 6.0, 6.5, 5.5, 36, 40, 30),
('Q3 2022', 1.25, 1.45, 1.0, -7.5, -6, -10, 5, 6, 3, 48, 52, 45, 82, 86, 70, 6.7, 7.2, 6.0, 84, 86, 75, 7.2, 7.7, 6.5, 72, 76, 65, 6.2, 6.7, 5.5, 38, 42, 30),
('Q4 2022', 1.3, 1.5, 1.0, -7, -5.5, -10, 5.5, 6.5, 3, 50, 54, 45, 84, 88, 70, 6.9, 7.4, 6.0, 86, 88, 75, 7.4, 7.9, 6.5, 74, 78, 65, 6.4, 6.9, 5.5, 40, 44, 30),

-- 2023
('Q1 2023', 1.2, 1.4, 1.0, -8, -7, -10, 5, 6, 3, 52, 56, 45, 85, 88, 70, 7.0, 7.5, 6.0, 88, 90, 75, 7.5, 8.0, 6.5, 75, 80, 65, 6.5, 7.0, 5.5, 42, 46, 30),
('Q2 2023', 1.3, 1.5, 1.0, -7.5, -6.5, -10, 6, 7, 3, 54, 58, 45, 86, 89, 70, 7.1, 7.6, 6.0, 89, 90, 75, 7.6, 8.1, 6.5, 76, 80, 65, 6.6, 7.1, 5.5, 43, 47, 30),
('Q3 2023', 1.4, 1.6, 1.0, -7, -6, -10, 7, 8, 3, 56, 60, 45, 87, 90, 70, 7.2, 7.7, 6.0, 90, 91, 75, 7.7, 8.2, 6.5, 77, 81, 65, 6.7, 7.2, 5.5, 44, 48, 30),
('Q4 2023', 1.5, 1.8, 1.0, -6, -5, -10, 8, 9, 3, 58, 62, 45, 88, 90, 70, 7.3, 7.8, 6.0, 91, 92, 75, 7.8, 8.3, 6.5, 78, 82, 65, 6.8, 7.3, 5.5, 45, 49, 30),

-- 2024
('Q1 2024', 1.5, 1.8, 1.0, -6, -5, -10, 8, 9, 3, 60, 65, 45, 85, 88, 70, 7.0, 7.5, 6.0, 92, 90, 75, 8.0, 8.5, 6.5, 78, 80, 65, 6.0, 7.0, 5.5, 45, 50, 30),
('Q2 2024', 1.6, 1.9, 1.0, -5.5, -4.5, -10, 9, 10, 3, 62, 66, 45, 86, 89, 70, 7.2, 7.7, 6.0, 93, 91, 75, 8.2, 8.7, 6.5, 79, 81, 65, 6.2, 7.2, 5.5, 46, 51, 30),
('Q3 2024', 1.8, 2.0, 1.0, -5, -4, -10, 11, 11, 3, 64, 67, 45, 87, 90, 70, 7.4, 7.9, 6.0, 94, 92, 75, 8.4, 8.9, 6.5, 80, 82, 65, 6.4, 7.4, 5.5, 47, 52, 30),
('Q4 2024', 2.0, 2.1, 1.0, -4, -3.5, -10, 13, 12, 3, 66, 68, 45, 88, 90, 70, 7.6, 8.0, 6.0, 95, 93, 75, 8.6, 9.0, 6.5, 81, 83, 65, 6.6, 7.6, 5.5, 48, 53, 30),

-- 2025
('Q1 2025', 2.1, 2.0, 1.0, -3, -4, -10, 14, 12, 3, 60, 65, 45, 85, 88, 70, 7.0, 7.5, 6.0, 92, 90, 75, 8.0, 8.5, 6.5, 78, 80, 65, 6.0, 7.0, 5.5, 45, 50, 30),
('Q2 2025', 2.2, 2.1, 1.0, -2.5, -3.5, -10, 15, 13, 3, 62, 66, 45, 86, 89, 70, 7.2, 7.7, 6.0, 93, 91, 75, 8.2, 8.7, 6.5, 79, 81, 65, 6.2, 7.2, 5.5, 46, 51, 30),
('Q3 2025', 2.3, 2.2, 1.0, -2, -3, -10, 16, 14, 3, 64, 67, 45, 87, 90, 70, 7.4, 7.9, 6.0, 94, 92, 75, 8.4, 8.9, 6.5, 80, 82, 65, 6.4, 7.4, 5.5, 47, 52, 30),
('Q4 2025', 2.4, 2.3, 1.0, -1.5, -2.5, -10, 17, 15, 3, 66, 68, 45, 88, 90, 70, 7.6, 8.0, 6.0, 95, 93, 75, 8.6, 9.0, 6.5, 81, 83, 65, 6.6, 7.6, 5.5, 48, 53, 30);

-- =====================================================
-- SEED DATA: Investment initiatives (Q4 2025 snapshot)
-- =====================================================
INSERT INTO public.temp_investment_initiatives (quarter, initiative_name, budget, risk_score, alignment_score) VALUES
('Q4 2025', 'Cloud Migration', 5, 2, 4),
('Q4 2025', 'AI Platform', 8, 4, 5),
('Q4 2025', 'ERP Upgrade', 6, 3, 3),
('Q4 2025', 'Legacy Decommissioning', 3, 1, 2),
('Q4 2025', 'Data Lake', 7, 4, 2),
('Q4 2025', 'Digital Twin Infrastructure', 9, 5, 4),
('Q4 2025', 'Cybersecurity Enhancement', 4, 2, 5);
