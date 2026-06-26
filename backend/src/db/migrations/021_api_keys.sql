-- API Keys pour accès externe à l'API BIAR SMS
-- Clés générées côté backend, hashées en SHA-256 pour stockage sécurisé
CREATE TABLE IF NOT EXISTS api_keys (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tenant_id    INT UNSIGNED NOT NULL,
  created_by   INT UNSIGNED NULL,
  name         VARCHAR(100) NOT NULL,
  -- Hash SHA-256 de la clé complète — la clé brute n'est jamais stockée
  key_hash     VARCHAR(64) NOT NULL,
  -- Preview masquée : "bsk_****...****abcd" (affiché dans l'UI)
  key_preview  VARCHAR(40) NOT NULL,
  module       ENUM('sms','email','whatsapp','all') NOT NULL DEFAULT 'sms',
  is_active    TINYINT(1) NOT NULL DEFAULT 1,
  requests_count INT UNSIGNED NOT NULL DEFAULT 0,
  last_used_at TIMESTAMP NULL,
  expires_at   TIMESTAMP NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at   TIMESTAMP NULL,
  INDEX idx_tenant   (tenant_id),
  INDEX idx_key_hash (key_hash)
);
