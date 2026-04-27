-- ============================================================
-- Migration 003 : Email tables
-- BIAR GROUP AFRICA — Actor Hub CPaaS
-- ============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET foreign_key_checks = 0;

-- ─── email_campaigns ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS email_campaigns (
  id            INT           NOT NULL AUTO_INCREMENT,
  tenant_id     INT           NOT NULL,
  created_by    INT           NULL DEFAULT NULL,
  sujet         VARCHAR(500)  NOT NULL,
  preheader     VARCHAR(500)  NULL DEFAULT NULL,
  expediteur    VARCHAR(255)  NOT NULL DEFAULT 'BIAR GROUP AFRICA',
  blocs_json    JSON          NOT NULL,
  status        ENUM('draft','queued','sending','sent','failed','scheduled')
                              NOT NULL DEFAULT 'draft',
  scheduled_at  TIMESTAMP     NULL DEFAULT NULL,
  sent_at       TIMESTAMP     NULL DEFAULT NULL,
  total_recipients  INT       NOT NULL DEFAULT 0,
  total_sent        INT       NOT NULL DEFAULT 0,
  total_failed      INT       NOT NULL DEFAULT 0,
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at    TIMESTAMP     NULL DEFAULT NULL,

  PRIMARY KEY (id),
  KEY idx_email_campaigns_tenant_id  (tenant_id),
  KEY idx_email_campaigns_status     (status),
  KEY idx_email_campaigns_created_by (created_by),
  KEY idx_email_campaigns_deleted_at (deleted_at),

  CONSTRAINT fk_email_campaigns_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT fk_email_campaigns_user
    FOREIGN KEY (created_by) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── email_campaign_groups ────────────────────────────────────
-- liaison campagne ↔ groupe de contacts

CREATE TABLE IF NOT EXISTS email_campaign_groups (
  id           INT NOT NULL AUTO_INCREMENT,
  campaign_id  INT NOT NULL,
  group_id     INT NOT NULL,

  PRIMARY KEY (id),
  UNIQUE KEY uq_campaign_group (campaign_id, group_id),
  KEY idx_ecg_campaign_id (campaign_id),
  KEY idx_ecg_group_id    (group_id),

  CONSTRAINT fk_ecg_campaign
    FOREIGN KEY (campaign_id) REFERENCES email_campaigns (id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT fk_ecg_group
    FOREIGN KEY (group_id) REFERENCES contact_groups (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── email_messages ───────────────────────────────────────────
-- 1 ligne = 1 email envoyé à 1 destinataire

CREATE TABLE IF NOT EXISTS email_messages (
  id             INT           NOT NULL AUTO_INCREMENT,
  campaign_id    INT           NOT NULL,
  contact_id     INT           NULL DEFAULT NULL,
  email_address  VARCHAR(255)  NOT NULL,
  first_name     VARCHAR(100)  NULL DEFAULT NULL,
  last_name      VARCHAR(100)  NULL DEFAULT NULL,
  status         ENUM('pending','sent','failed','bounced','unsubscribed')
                               NOT NULL DEFAULT 'pending',
  error_message  TEXT          NULL DEFAULT NULL,
  sent_at        TIMESTAMP     NULL DEFAULT NULL,
  created_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_email_messages_campaign_id (campaign_id),
  KEY idx_email_messages_contact_id  (contact_id),
  KEY idx_email_messages_status      (status),
  KEY idx_email_messages_email       (email_address),

  CONSTRAINT fk_email_messages_campaign
    FOREIGN KEY (campaign_id) REFERENCES email_campaigns (id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT fk_email_messages_contact
    FOREIGN KEY (contact_id) REFERENCES contacts (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── email_events ─────────────────────────────────────────────
-- tracking ouvertures, clics, bounces, désabonnements

CREATE TABLE IF NOT EXISTS email_events (
  id          INT           NOT NULL AUTO_INCREMENT,
  message_id  INT           NOT NULL,
  type        ENUM('open','click','bounce','unsubscribe') NOT NULL,
  data        JSON          NULL DEFAULT NULL,
  ip_address  VARCHAR(45)   NULL DEFAULT NULL,
  user_agent  TEXT          NULL DEFAULT NULL,
  created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_email_events_message_id (message_id),
  KEY idx_email_events_type       (type),
  KEY idx_email_events_created_at (created_at),

  CONSTRAINT fk_email_events_message
    FOREIGN KEY (message_id) REFERENCES email_messages (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET foreign_key_checks = 1;
