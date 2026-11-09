-- Migration 002: Add Before/After Resolution Proof Photo Support

ALTER TABLE reports ADD COLUMN IF NOT EXISTS resolved_image_url TEXT;
ALTER TABLE report_images ADD COLUMN IF NOT EXISTS is_resolution BOOLEAN NOT NULL DEFAULT false;

