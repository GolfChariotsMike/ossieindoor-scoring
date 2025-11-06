-- Convert break_duration and results_duration from seconds to minutes
ALTER TABLE timer_settings 
  RENAME COLUMN break_duration_seconds TO break_duration_minutes;

ALTER TABLE timer_settings 
  RENAME COLUMN results_duration_seconds TO results_duration_minutes;

-- Convert existing seconds values to minutes (divide by 60)
UPDATE timer_settings 
SET 
  break_duration_minutes = ROUND(break_duration_minutes::numeric / 60, 2),
  results_duration_minutes = ROUND(results_duration_minutes::numeric / 60, 2);

-- Update column types to numeric to support decimal minutes
ALTER TABLE timer_settings 
  ALTER COLUMN break_duration_minutes TYPE numeric(5,2),
  ALTER COLUMN results_duration_minutes TYPE numeric(5,2);

-- Update default values
ALTER TABLE timer_settings 
  ALTER COLUMN break_duration_minutes SET DEFAULT 1.0,
  ALTER COLUMN results_duration_minutes SET DEFAULT 0.83;