-- ============================================================
-- Migration 005 : Table email_templates
-- ============================================================

CREATE TABLE IF NOT EXISTS email_templates (
  id          INT           NOT NULL AUTO_INCREMENT,
  tenant_id   INT           NOT NULL,
  created_by  INT           NULL DEFAULT NULL,
  name        VARCHAR(255)  NOT NULL,
  category    VARCHAR(100)  NOT NULL DEFAULT 'Général',
  sujet       VARCHAR(500)  NULL DEFAULT NULL,
  blocs_json  JSON          NOT NULL,
  created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at  TIMESTAMP     NULL DEFAULT NULL,

  PRIMARY KEY (id),
  KEY idx_email_templates_tenant_id  (tenant_id),
  KEY idx_email_templates_deleted_at (deleted_at),

  CONSTRAINT fk_email_templates_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
