-- Migration 008 : Ajouter brevo_message_id pour le webhook tracking
ALTER TABLE email_messages
  ADD COLUMN brevo_message_id VARCHAR(255) NULL DEFAULT NULL AFTER status,
  ADD KEY idx_email_messages_brevo_id (brevo_message_id);
