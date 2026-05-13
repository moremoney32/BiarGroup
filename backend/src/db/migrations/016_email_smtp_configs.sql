-- Migration 016 : Configurations SMTP par tenant
-- Chaque tenant peut avoir plusieurs configs, une seule is_default = true

CREATE TABLE IF NOT EXISTS email_smtp_configs (
  id            INT           NOT NULL AUTO_INCREMENT,
  tenant_id     INT           NOT NULL,
  name          VARCHAR(100)  NOT NULL,
  provider      ENUM('brevo','sendgrid','custom') NOT NULL DEFAULT 'brevo',
  host          VARCHAR(255)  NOT NULL,
  port          INT           NOT NULL DEFAULT 587,
  secure        TINYINT(1)    NOT NULL DEFAULT 0,
  username      VARCHAR(255)  NOT NULL,
  password_enc  TEXT          NOT NULL,
  from_name     VARCHAR(100)  NOT NULL,
  from_email    VARCHAR(255)  NOT NULL,
  reply_to      VARCHAR(255)  NULL DEFAULT NULL,
  is_default    TINYINT(1)    NOT NULL DEFAULT 0,
  is_verified   TINYINT(1)    NOT NULL DEFAULT 0,
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_smtp_tenant_id  (tenant_id),
  KEY idx_smtp_is_default (is_default),

  CONSTRAINT fk_smtp_configs_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
