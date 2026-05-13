CREATE TABLE IF NOT EXISTS email_flow_contacts (
  id              INT         AUTO_INCREMENT PRIMARY KEY,
  tenant_id       INT         NOT NULL,
  flow_id         INT         NOT NULL,
  contact_id      INT         NOT NULL,
  current_node_id VARCHAR(100),
  status          ENUM('active','completed','unsubscribed','bounced') NOT NULL DEFAULT 'active',
  next_run_at     DATETIME,
  data_json       JSON,
  created_at      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_efc_flow    (flow_id, status),
  INDEX idx_efc_run     (next_run_at, status),
  UNIQUE KEY uq_efc     (flow_id, contact_id)
);
