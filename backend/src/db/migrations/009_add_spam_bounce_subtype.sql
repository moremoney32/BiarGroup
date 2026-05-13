-- ============================================================
-- Migration 009 : spam event + bounce subtype tracking
-- BIAR GROUP AFRICA — Actor Hub CPaaS
-- ============================================================

-- Ajoute 'spam' à l'enum des types d'événements email
ALTER TABLE email_events
  MODIFY COLUMN type ENUM('open','click','bounce','unsubscribe','spam') NOT NULL;
