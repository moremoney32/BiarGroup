-- Ajout du type de campagne SMS (A2P classification)
ALTER TABLE sms_campaigns
  ADD COLUMN campaign_type ENUM('promotional','transactional','otp','notification') NOT NULL DEFAULT 'promotional'
  AFTER sender_id;
