-- Add results_duration_seconds to timer_settings table
ALTER TABLE timer_settings
ADD COLUMN results_duration_seconds integer NOT NULL DEFAULT 50;