CREATE TABLE IF NOT EXISTS email_flows (
  id             INT          AUTO_INCREMENT PRIMARY KEY,
  tenant_id      INT          NOT NULL,
  created_by     INT          NOT NULL,
  name           VARCHAR(255) NOT NULL,
  description    TEXT,
  status         ENUM('draft','active','paused') NOT NULL DEFAULT 'draft',
  trigger_type   VARCHAR(50)  NOT NULL DEFAULT 'subscribe',
  nodes_json     JSON         NOT NULL,
  edges_json     JSON         NOT NULL,
  total_contacts INT          NOT NULL DEFAULT 0,
  opens          INT          NOT NULL DEFAULT 0,
  clicks         INT          NOT NULL DEFAULT 0,
  created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at     TIMESTAMP    NULL,
  INDEX idx_ef_tenant (tenant_id),
  INDEX idx_ef_status (status, deleted_at)
);

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
