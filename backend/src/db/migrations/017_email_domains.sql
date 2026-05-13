-- Migration 017 : Domaines email par tenant
-- Stocke les domaines d'envoi et leur statut DNS (SPF, DKIM, DMARC)

CREATE TABLE IF NOT EXISTS email_domains (
  id              INT           NOT NULL AUTO_INCREMENT,
  tenant_id       INT           NOT NULL,
  domain          VARCHAR(255)  NOT NULL,
  provider        ENUM('brevo','sendgrid','custom') NOT NULL DEFAULT 'brevo',
  spf_status      ENUM('unknown','ok','fail') NOT NULL DEFAULT 'unknown',
  dkim_status     ENUM('unknown','ok','fail') NOT NULL DEFAULT 'unknown',
  dmarc_status    ENUM('unknown','ok','fail') NOT NULL DEFAULT 'unknown',
  last_checked_at TIMESTAMP     NULL DEFAULT NULL,
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_tenant_domain (tenant_id, domain),
  KEY idx_email_domains_tenant (tenant_id),

  CONSTRAINT fk_email_domains_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
