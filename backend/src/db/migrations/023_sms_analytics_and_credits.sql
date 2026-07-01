-- ============================================================
-- Migration 023 : Analytics SMS + Crédits + Transactions
-- BIAR GROUP AFRICA — Actor Hub CPaaS
-- Idempotente : INFORMATION_SCHEMA + PREPARE/EXECUTE
-- Compatible MySQL 5.7+ (pas d'ADD COLUMN IF NOT EXISTS, pas de CREATE INDEX IF NOT EXISTS)
-- ============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET foreign_key_checks = 0;

-- ─── operator ────────────────────────────────────────────────
SET @c = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sms_messages' AND COLUMN_NAME = 'operator');
SET @s = IF(@c = 0, 'ALTER TABLE sms_messages ADD COLUMN operator VARCHAR(50) NULL DEFAULT NULL AFTER failure_reason', 'SELECT 1');
PREPARE _p FROM @s;
EXECUTE _p;
DEALLOCATE PREPARE _p;

-- ─── error_code ───────────────────────────────────────────────
SET @c = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sms_messages' AND COLUMN_NAME = 'error_code');
SET @s = IF(@c = 0, 'ALTER TABLE sms_messages ADD COLUMN error_code VARCHAR(20) NULL DEFAULT NULL AFTER operator', 'SELECT 1');
PREPARE _p FROM @s;
EXECUTE _p;
DEALLOCATE PREPARE _p;

-- ─── delivery_time_ms ─────────────────────────────────────────
SET @c = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sms_messages' AND COLUMN_NAME = 'delivery_time_ms');
SET @s = IF(@c = 0, 'ALTER TABLE sms_messages ADD COLUMN delivery_time_ms INT UNSIGNED NULL DEFAULT NULL AFTER error_code', 'SELECT 1');
PREPARE _p FROM @s;
EXECUTE _p;
DEALLOCATE PREPARE _p;

-- ─── cost ─────────────────────────────────────────────────────
SET @c = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sms_messages' AND COLUMN_NAME = 'cost');
SET @s = IF(@c = 0, 'ALTER TABLE sms_messages ADD COLUMN cost DECIMAL(8,4) NULL DEFAULT NULL AFTER delivery_time_ms', 'SELECT 1');
PREPARE _p FROM @s;
EXECUTE _p;
DEALLOCATE PREPARE _p;

-- ─── index idx_sms_msg_operator ───────────────────────────────
SET @i = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sms_messages' AND INDEX_NAME = 'idx_sms_msg_operator');
SET @s = IF(@i = 0, 'CREATE INDEX idx_sms_msg_operator ON sms_messages (operator)', 'SELECT 1');
PREPARE _p FROM @s;
EXECUTE _p;
DEALLOCATE PREPARE _p;

-- ─── index idx_sms_msg_error_code ─────────────────────────────
SET @i = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sms_messages' AND INDEX_NAME = 'idx_sms_msg_error_code');
SET @s = IF(@i = 0, 'CREATE INDEX idx_sms_msg_error_code ON sms_messages (error_code)', 'SELECT 1');
PREPARE _p FROM @s;
EXECUTE _p;
DEALLOCATE PREPARE _p;

-- ─── sms_credits ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sms_credits (
  id         INT           NOT NULL AUTO_INCREMENT,
  tenant_id  INT           NOT NULL,
  balance    DECIMAL(10,4) NOT NULL DEFAULT 0.0000,
  updated_at TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_sms_cred_tenant (tenant_id),
  KEY idx_sms_cred_tenant (tenant_id),

  CONSTRAINT fk_sms_cred_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── sms_transactions ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sms_transactions (
  id          INT            NOT NULL AUTO_INCREMENT,
  tenant_id   INT            NOT NULL,
  campaign_id INT            NULL DEFAULT NULL,
  type        ENUM('debit','credit') NOT NULL DEFAULT 'debit',
  amount      DECIMAL(10,4)  NOT NULL DEFAULT 0.0000,
  sms_count   INT            NOT NULL DEFAULT 0,
  description VARCHAR(255)   NULL DEFAULT NULL,
  created_at  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_sms_tx_tenant    (tenant_id),
  KEY idx_sms_tx_campaign  (campaign_id),
  KEY idx_sms_tx_type      (type),
  KEY idx_sms_tx_created   (created_at),

  CONSTRAINT fk_sms_tx_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET foreign_key_checks = 1;
