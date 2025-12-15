-- Additional seed data for 2026-2029
-- Add to existing temp_quarterly_outcomes_data table

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
-- 2026
('Q1 2026', 2.5, 2.4, 1.0, -1, -2, -10, 18, 16, 3, 68, 69, 45, 89, 90, 70, 7.8, 8.2, 6.0, 96, 94, 75, 8.8, 9.2, 6.5, 82, 84, 65, 6.8, 7.8, 5.5, 49, 54, 30),
('Q2 2026', 2.6, 2.5, 1.0, -0.5, -1.5, -10, 19, 17, 3, 70, 70, 45, 90, 90, 70, 8.0, 8.4, 6.0, 97, 95, 75, 9.0, 9.4, 6.5, 83, 85, 65, 7.0, 8.0, 5.5, 50, 55, 30),
('Q3 2026', 2.7, 2.6, 1.0, 0, -1, -10, 20, 18, 3, 72, 71, 45, 91, 91, 70, 8.2, 8.6, 6.0, 98, 96, 75, 9.2, 9.6, 6.5, 84, 86, 65, 7.2, 8.2, 5.5, 51, 56, 30),
('Q4 2026', 2.8, 2.7, 1.0, 0.5, -0.5, -10, 21, 19, 3, 74, 72, 45, 92, 92, 70, 8.4, 8.8, 6.0, 99, 97, 75, 9.4, 9.8, 6.5, 85, 87, 65, 7.4, 8.4, 5.5, 52, 57, 30),

-- 2027
('Q1 2027', 2.9, 2.8, 1.0, 1, 0, -10, 22, 20, 3, 76, 73, 45, 93, 93, 70, 8.6, 9.0, 6.0, 100, 98, 75, 9.6, 10.0, 6.5, 86, 88, 65, 7.6, 8.6, 5.5, 53, 58, 30),
('Q2 2027', 3.0, 2.9, 1.0, 1.5, 0.5, -10, 23, 21, 3, 78, 74, 45, 94, 94, 70, 8.8, 9.2, 6.0, 101, 99, 75, 9.8, 10.2, 6.5, 87, 89, 65, 7.8, 8.8, 5.5, 54, 59, 30),
('Q3 2027', 3.1, 3.0, 1.0, 2, 1, -10, 24, 22, 3, 80, 75, 45, 95, 95, 70, 9.0, 9.4, 6.0, 102, 100, 75, 10.0, 10.4, 6.5, 88, 90, 65, 8.0, 9.0, 5.5, 55, 60, 30),
('Q4 2027', 3.2, 3.1, 1.0, 2.5, 1.5, -10, 25, 23, 3, 82, 76, 45, 96, 96, 70, 9.2, 9.6, 6.0, 103, 101, 75, 10.2, 10.6, 6.5, 89, 91, 65, 8.2, 9.2, 5.5, 56, 61, 30),

-- 2028
('Q1 2028', 3.3, 3.2, 1.0, 3, 2, -10, 26, 24, 3, 84, 77, 45, 97, 97, 70, 9.4, 9.8, 6.0, 104, 102, 75, 10.4, 10.8, 6.5, 90, 92, 65, 8.4, 9.4, 5.5, 57, 62, 30),
('Q2 2028', 3.4, 3.3, 1.0, 3.5, 2.5, -10, 27, 25, 3, 86, 78, 45, 98, 98, 70, 9.6, 10.0, 6.0, 105, 103, 75, 10.6, 11.0, 6.5, 91, 93, 65, 8.6, 9.6, 5.5, 58, 63, 30),
('Q3 2028', 3.5, 3.4, 1.0, 4, 3, -10, 28, 26, 3, 88, 79, 45, 99, 99, 70, 9.8, 10.2, 6.0, 106, 104, 75, 10.8, 11.2, 6.5, 92, 94, 65, 8.8, 9.8, 5.5, 59, 64, 30),
('Q4 2028', 3.6, 3.5, 1.0, 4.5, 3.5, -10, 29, 27, 3, 90, 80, 45, 100, 100, 70, 10.0, 10.4, 6.0, 107, 105, 75, 11.0, 11.4, 6.5, 93, 95, 65, 9.0, 10.0, 5.5, 60, 65, 30),

-- 2029
('Q1 2029', 3.7, 3.6, 1.0, 5, 4, -10, 30, 28, 3, 92, 81, 45, 101, 101, 70, 10.2, 10.6, 6.0, 108, 106, 75, 11.2, 11.6, 6.5, 94, 96, 65, 9.2, 10.2, 5.5, 61, 66, 30),
('Q2 2029', 3.8, 3.7, 1.0, 5.5, 4.5, -10, 31, 29, 3, 94, 82, 45, 102, 102, 70, 10.4, 10.8, 6.0, 109, 107, 75, 11.4, 11.8, 6.5, 95, 97, 65, 9.4, 10.4, 5.5, 62, 67, 30),
('Q3 2029', 3.9, 3.8, 1.0, 6, 5, -10, 32, 30, 3, 96, 83, 45, 103, 103, 70, 10.6, 11.0, 6.0, 110, 108, 75, 11.6, 12.0, 6.5, 96, 98, 65, 9.6, 10.6, 5.5, 63, 68, 30),
('Q4 2029', 4.0, 3.9, 1.0, 6.5, 5.5, -10, 33, 31, 3, 98, 84, 45, 104, 104, 70, 10.8, 11.2, 6.0, 111, 109, 75, 11.8, 12.2, 6.5, 97, 99, 65, 9.8, 10.8, 5.5, 64, 69, 30);

-- Investment initiatives for 2026-2029
INSERT INTO public.temp_investment_initiatives (quarter, initiative_name, budget, risk_score, alignment_score) VALUES
-- 2026
('Q4 2026', 'Cloud Migration', 5.5, 2, 4),
('Q4 2026', 'AI Platform', 9, 4, 5),
('Q4 2026', 'ERP Upgrade', 6.5, 3, 3),
('Q4 2026', 'Legacy Decommissioning', 3.5, 1, 2),
('Q4 2026', 'Data Lake', 7.5, 4, 2),
('Q4 2026', 'Digital Twin Infrastructure', 10, 5, 4),
('Q4 2026', 'Cybersecurity Enhancement', 4.5, 2, 5),

-- 2027
('Q4 2027', 'Cloud Migration', 6, 2, 4),
('Q4 2027', 'AI Platform', 10, 4, 5),
('Q4 2027', 'ERP Upgrade', 7, 3, 3),
('Q4 2027', 'Legacy Decommissioning', 4, 1, 2),
('Q4 2027', 'Data Lake', 8, 4, 2),
('Q4 2027', 'Digital Twin Infrastructure', 11, 5, 4),
('Q4 2027', 'Cybersecurity Enhancement', 5, 2, 5),

-- 2028
('Q4 2028', 'Cloud Migration', 6.5, 2, 4),
('Q4 2028', 'AI Platform', 11, 4, 5),
('Q4 2028', 'ERP Upgrade', 7.5, 3, 3),
('Q4 2028', 'Legacy Decommissioning', 4.5, 1, 2),
('Q4 2028', 'Data Lake', 8.5, 4, 2),
('Q4 2028', 'Digital Twin Infrastructure', 12, 5, 4),
('Q4 2028', 'Cybersecurity Enhancement', 5.5, 2, 5),

-- 2029
('Q4 2029', 'Cloud Migration', 7, 2, 4),
('Q4 2029', 'AI Platform', 12, 4, 5),
('Q4 2029', 'ERP Upgrade', 8, 3, 3),
('Q4 2029', 'Legacy Decommissioning', 5, 1, 2),
('Q4 2029', 'Data Lake', 9, 4, 2),
('Q4 2029', 'Digital Twin Infrastructure', 13, 5, 4),
('Q4 2029', 'Cybersecurity Enhancement', 6, 2, 5);
