CREATE TABLE IF NOT EXISTS email_relances (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id     INT         NOT NULL,
  campaign_id   INT         NOT NULL,
  new_subject   VARCHAR(255) NOT NULL,
  delay_days    TINYINT     NOT NULL DEFAULT 5,
  status        ENUM('pending','running','completed','cancelled') NOT NULL DEFAULT 'pending',
  scheduled_at  DATETIME    NOT NULL,
  executed_at   DATETIME    NULL,
  total_sent    INT         NOT NULL DEFAULT 0,
  created_by    INT         NOT NULL,
  created_at    TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_tenant   (tenant_id),
  INDEX idx_campaign (campaign_id),
  INDEX idx_status   (status),
  INDEX idx_scheduled(scheduled_at),

  FOREIGN KEY (campaign_id) REFERENCES email_campaigns(id) ON DELETE CASCADE
);
