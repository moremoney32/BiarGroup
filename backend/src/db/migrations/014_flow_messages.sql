-- Migration 014 : Allow email_messages to be linked to flows (not just campaigns)
-- Makes campaign_id nullable and adds flow_id FK

SET foreign_key_checks = 0;

ALTER TABLE email_messages
  DROP FOREIGN KEY fk_email_messages_campaign;

ALTER TABLE email_messages
  MODIFY COLUMN campaign_id INT NULL DEFAULT NULL;

ALTER TABLE email_messages
  ADD CONSTRAINT fk_email_messages_campaign
    FOREIGN KEY (campaign_id) REFERENCES email_campaigns (id)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE email_messages
  ADD COLUMN flow_id INT NULL DEFAULT NULL AFTER campaign_id,
  ADD KEY idx_email_messages_flow_id (flow_id),
  ADD CONSTRAINT fk_email_messages_flow
    FOREIGN KEY (flow_id) REFERENCES email_flows (id)
    ON DELETE CASCADE ON UPDATE CASCADE;

SET foreign_key_checks = 1;
