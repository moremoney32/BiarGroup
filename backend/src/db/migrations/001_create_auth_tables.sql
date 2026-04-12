-- ============================================================
-- Migration 001 : Auth tables
-- BIAR GROUP AFRICA — Actor Hub CPaaS
-- ============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET foreign_key_checks = 0;

-- ─── tenants ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tenants (
  id          INT            NOT NULL AUTO_INCREMENT,
  name        VARCHAR(255)   NOT NULL,
  slug        VARCHAR(100)   NOT NULL,
  plan        ENUM('free','basic','pro','enterprise') NOT NULL DEFAULT 'free',
  is_active   BOOLEAN        NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at  TIMESTAMP      NULL     DEFAULT NULL,

  PRIMARY KEY (id),
  UNIQUE KEY uq_tenants_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── users ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id                        INT          NOT NULL AUTO_INCREMENT,
  tenant_id                 INT          NOT NULL,
  first_name                VARCHAR(100) NOT NULL,
  last_name                 VARCHAR(100) NOT NULL,
  email                     VARCHAR(255) NOT NULL,
  password_hash             VARCHAR(255) NOT NULL,
  phone                     VARCHAR(20)  NULL DEFAULT NULL,
  role                      ENUM('super_admin','admin','client','agent','superviseur') NOT NULL DEFAULT 'client',
  is_active                 BOOLEAN      NOT NULL DEFAULT TRUE,
  is_email_verified         BOOLEAN      NOT NULL DEFAULT FALSE,
  email_verified_at         TIMESTAMP    NULL DEFAULT NULL,
  email_verification_token   VARCHAR(255) NULL DEFAULT NULL,
  email_verification_expires TIMESTAMP    NULL DEFAULT NULL,
  password_reset_token       VARCHAR(255) NULL DEFAULT NULL,
  password_reset_expires    TIMESTAMP    NULL DEFAULT NULL,
  last_login                TIMESTAMP    NULL DEFAULT NULL,
  created_at                TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at                TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at                TIMESTAMP    NULL DEFAULT NULL,

  PRIMARY KEY (id),
  UNIQUE KEY uq_email_per_tenant (email, tenant_id),
  KEY idx_users_email      (email),
  KEY idx_users_tenant_id  (tenant_id),
  KEY idx_users_deleted_at (deleted_at),

  CONSTRAINT fk_users_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── refresh_tokens ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          INT          NOT NULL AUTO_INCREMENT,
  user_id     INT          NOT NULL,
  token_hash  VARCHAR(255) NOT NULL,
  expires_at  TIMESTAMP    NOT NULL,
  is_revoked  BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_refresh_tokens_user_id    (user_id),
  KEY idx_refresh_tokens_token_hash (token_hash),

  CONSTRAINT fk_refresh_tokens_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── audit_logs ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS audit_logs (
  id          INT          NOT NULL AUTO_INCREMENT,
  user_id     INT          NULL DEFAULT NULL,
  tenant_id   INT          NULL DEFAULT NULL,
  action      VARCHAR(100) NOT NULL,
  entity      VARCHAR(100) NULL DEFAULT NULL,
  entity_id   INT          NULL DEFAULT NULL,
  ip_address  VARCHAR(45)  NULL DEFAULT NULL,
  user_agent  TEXT         NULL DEFAULT NULL,
  details     JSON         NULL DEFAULT NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_audit_logs_user_id   (user_id),
  KEY idx_audit_logs_tenant_id (tenant_id),
  KEY idx_audit_logs_action    (action),
  KEY idx_audit_logs_created_at (created_at),

  CONSTRAINT fk_audit_logs_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE,

  CONSTRAINT fk_audit_logs_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET foreign_key_checks = 1;
