CREATE TABLE IF NOT EXISTS contact_segments (
  id            INT          AUTO_INCREMENT PRIMARY KEY,
  tenant_id     INT          NOT NULL,
  created_by    INT          NOT NULL,
  name          VARCHAR(255) NOT NULL,
  description   TEXT,
  type          ENUM('dynamique','statique') NOT NULL DEFAULT 'dynamique',
  criteria_json JSON,
  contact_count INT          NOT NULL DEFAULT 0,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at    TIMESTAMP    NULL,
  INDEX idx_cs_tenant (tenant_id, deleted_at)
);

CREATE TABLE IF NOT EXISTS contact_segment_members (
  segment_id  INT NOT NULL,
  contact_id  INT NOT NULL,
  added_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (segment_id, contact_id),
  INDEX idx_csm_contact (contact_id)
);
