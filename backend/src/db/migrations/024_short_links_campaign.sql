-- Lien court ↔ campagne : permet le taux de clic réel par campagne
-- (le clic passe par notre endpoint /sms/r/:code — aucune dépendance Infobip)
ALTER TABLE sms_short_links
  ADD COLUMN campaign_id INT NULL DEFAULT NULL AFTER created_by,
  ADD INDEX idx_sms_links_campaign (campaign_id);
