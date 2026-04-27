-- ============================================================
-- Migration 006 : Ajouter colonne category sur email_campaigns
-- ============================================================

ALTER TABLE email_campaigns
  ADD COLUMN category VARCHAR(100) NOT NULL DEFAULT 'Marketing' AFTER name;
