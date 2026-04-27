-- ============================================================
-- Migration 002 : Contacts tables (partagé entre modules)
-- BIAR GROUP AFRICA — Actor Hub CPaaS
-- ============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET foreign_key_checks = 0;

-- ─── contacts ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS contacts (
  id            INT           NOT NULL AUTO_INCREMENT,
  tenant_id     INT           NOT NULL,
  first_name    VARCHAR(100)  NOT NULL,
  last_name     VARCHAR(100)  NOT NULL DEFAULT '',
  email         VARCHAR(255)  NULL DEFAULT NULL,
  phone         VARCHAR(30)   NULL DEFAULT NULL,
  whatsapp      VARCHAR(30)   NULL DEFAULT NULL,
  company       VARCHAR(255)  NULL DEFAULT NULL,
  tags          JSON          NULL DEFAULT NULL,
  custom_fields JSON          NULL DEFAULT NULL,
  is_opted_out  BOOLEAN       NOT NULL DEFAULT FALSE,
  opted_out_at  TIMESTAMP     NULL DEFAULT NULL,
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at    TIMESTAMP     NULL DEFAULT NULL,

  PRIMARY KEY (id),
  KEY idx_contacts_tenant_id  (tenant_id),
  KEY idx_contacts_email      (email),
  KEY idx_contacts_phone      (phone),
  KEY idx_contacts_deleted_at (deleted_at),

  CONSTRAINT fk_contacts_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── contact_groups ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS contact_groups (
  id          INT           NOT NULL AUTO_INCREMENT,
  tenant_id   INT           NOT NULL,
  name        VARCHAR(255)  NOT NULL,
  description TEXT          NULL DEFAULT NULL,
  created_by  INT           NULL DEFAULT NULL,
  created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at  TIMESTAMP     NULL DEFAULT NULL,

  PRIMARY KEY (id),
  KEY idx_contact_groups_tenant_id  (tenant_id),
  KEY idx_contact_groups_deleted_at (deleted_at),

  CONSTRAINT fk_contact_groups_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT fk_contact_groups_created_by
    FOREIGN KEY (created_by) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── contact_group_members ───────────────────────────────────

CREATE TABLE IF NOT EXISTS contact_group_members (
  id          INT       NOT NULL AUTO_INCREMENT,
  group_id    INT       NOT NULL,
  contact_id  INT       NOT NULL,
  added_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_group_contact (group_id, contact_id),
  KEY idx_cgm_group_id   (group_id),
  KEY idx_cgm_contact_id (contact_id),

  CONSTRAINT fk_cgm_group
    FOREIGN KEY (group_id) REFERENCES contact_groups (id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT fk_cgm_contact
    FOREIGN KEY (contact_id) REFERENCES contacts (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET foreign_key_checks = 1;
