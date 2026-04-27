-- ============================================================
-- Migration 004 : Ajouter colonne name sur email_campaigns
-- ============================================================

ALTER TABLE email_campaigns
  ADD COLUMN name VARCHAR(255) NULL DEFAULT NULL AFTER id;
