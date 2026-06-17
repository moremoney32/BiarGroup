-- Migration 019 : Sender IDs — colonne approved_at + 3 IDs par défaut
-- BIAR GROUP AFRICA — Actor Hub CPaaS

SET NAMES utf8mb4;

ALTER TABLE sms_sender_ids
  ADD COLUMN approved_at TIMESTAMP NULL DEFAULT NULL AFTER status;

INSERT IGNORE INTO sms_sender_ids (tenant_id, sender_id, status, approved_at, created_by)
SELECT
  t.id        AS tenant_id,
  s.sender_id AS sender_id,
  'approved'  AS status,
  NOW()       AS approved_at,
  NULL        AS created_by
FROM tenants t
CROSS JOIN (
  SELECT 'INFO'   AS sender_id
  UNION ALL
  SELECT 'ALERTE' AS sender_id
  UNION ALL
  SELECT 'PROMO'  AS sender_id
) s
WHERE t.deleted_at IS NULL;
