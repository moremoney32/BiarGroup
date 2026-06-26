-- Index created_at sur sms_messages (critique : table peut avoir des millions de lignes)
-- Sans cet index, ORDER BY created_at DESC = full table scan en production
ALTER TABLE sms_messages
  ADD INDEX idx_sms_msg_created (created_at),
  ADD INDEX idx_sms_msg_tenant_created (tenant_id, created_at),
  ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL AFTER updated_at,
  ADD INDEX idx_sms_msg_deleted (deleted_at);

-- Soft delete sur sms_sender_ids (piste d'audit : un sender ID approuvé ne doit pas disparaître)
ALTER TABLE sms_sender_ids
  ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL AFTER updated_at,
  ADD INDEX idx_sms_sids_deleted (deleted_at);

-- DLR rate limit : index sur at_message_id pour les lookups DLR rapides (déjà présent en 018, vérification)
-- INDEX idx_sms_msg_at_id (at_message_id) -- déjà créé dans 018
