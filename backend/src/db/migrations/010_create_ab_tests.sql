-- ============================================================
-- Migration 010 : A/B Testing email
-- BIAR GROUP AFRICA — Actor Hub CPaaS
-- ============================================================

CREATE TABLE IF NOT EXISTS email_ab_tests (
  id              INT           NOT NULL AUTO_INCREMENT,
  tenant_id       INT           NOT NULL,
  created_by      INT           NOT NULL,
  name            VARCHAR(255)  NOT NULL,

  campaign_a_id   INT           NULL DEFAULT NULL,
  campaign_b_id   INT           NULL DEFAULT NULL,
  winner_id       INT           NULL DEFAULT NULL,
  winner_subject  VARCHAR(500)  NULL DEFAULT NULL,

  expediteur      VARCHAR(255)  NOT NULL,
  blocs_json      JSON          NOT NULL,
  subject_a       VARCHAR(500)  NOT NULL,
  subject_b       VARCHAR(500)  NOT NULL,
  group_ids_json  JSON          NOT NULL,
  split_percent   TINYINT       NOT NULL DEFAULT 10,
  winner_metric   ENUM('open_rate','click_rate') NOT NULL DEFAULT 'open_rate',
  wait_hours      TINYINT       NOT NULL DEFAULT 4,

  rate_a          DECIMAL(5,2)  NULL DEFAULT NULL,
  rate_b          DECIMAL(5,2)  NULL DEFAULT NULL,

  status          ENUM('running','completed','cancelled') NOT NULL DEFAULT 'running',
  scheduled_at    DATETIME      NOT NULL,
  completed_at    DATETIME      NULL DEFAULT NULL,

  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_abt_tenant    (tenant_id),
  KEY idx_abt_status    (status),
  KEY idx_abt_scheduled (scheduled_at),

  CONSTRAINT fk_abt_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT fk_abt_campaign_a
    FOREIGN KEY (campaign_a_id) REFERENCES email_campaigns (id)
    ON DELETE SET NULL ON UPDATE CASCADE,

  CONSTRAINT fk_abt_campaign_b
    FOREIGN KEY (campaign_b_id) REFERENCES email_campaigns (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
