-- ============================================================
-- Migration 018 : SMS tables (B-SMSBULK)
-- BIAR GROUP AFRICA — Actor Hub CPaaS
-- ============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET foreign_key_checks = 0;

-- ─── sms_sender_ids ──────────────────────────────────────────
-- Identifiants expéditeur alphanumériques par tenant (max 11 chars)
-- Chaque tenant a ses propres sender IDs enregistrés chez AT

CREATE TABLE IF NOT EXISTS sms_sender_ids (
  id          INT          NOT NULL AUTO_INCREMENT,
  tenant_id   INT          NOT NULL,
  sender_id   VARCHAR(11)  NOT NULL,
  status      ENUM('pending_approval','approved','rejected')
              NOT NULL DEFAULT 'pending_approval',
  created_by  INT          NULL DEFAULT NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_sms_sender_tenant (tenant_id, sender_id),
  KEY idx_sms_sids_tenant (tenant_id),
  KEY idx_sms_sids_status (status),

  CONSTRAINT fk_sms_sids_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── sms_contact_lists ───────────────────────────────────────
-- Listes de contacts SMS (indépendantes du CRM contacts)

CREATE TABLE IF NOT EXISTS sms_contact_lists (
  id          INT          NOT NULL AUTO_INCREMENT,
  tenant_id   INT          NOT NULL,
  name        VARCHAR(100) NOT NULL,
  description TEXT         NULL DEFAULT NULL,
  count       INT          NOT NULL DEFAULT 0,
  created_by  INT          NULL DEFAULT NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at  TIMESTAMP    NULL DEFAULT NULL,

  PRIMARY KEY (id),
  KEY idx_sms_cl_tenant  (tenant_id),
  KEY idx_sms_cl_deleted (deleted_at),

  CONSTRAINT fk_sms_cl_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── sms_list_contacts ───────────────────────────────────────
-- Contacts individuels dans une liste SMS — téléphone toujours E.164

CREATE TABLE IF NOT EXISTS sms_list_contacts (
  id           INT          NOT NULL AUTO_INCREMENT,
  list_id      INT          NOT NULL,
  tenant_id    INT          NOT NULL,
  phone        VARCHAR(20)  NOT NULL,
  first_name   VARCHAR(100) NULL DEFAULT NULL,
  last_name    VARCHAR(100) NULL DEFAULT NULL,
  opted_out    TINYINT(1)   NOT NULL DEFAULT 0,
  opted_out_at TIMESTAMP    NULL DEFAULT NULL,
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_sms_lc_list_phone (list_id, phone),
  KEY idx_sms_lc_list_id   (list_id),
  KEY idx_sms_lc_tenant_id (tenant_id),
  KEY idx_sms_lc_opted_out (opted_out),

  CONSTRAINT fk_sms_lc_list
    FOREIGN KEY (list_id) REFERENCES sms_contact_lists (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── sms_campaigns ───────────────────────────────────────────
-- DISTINCTION CRITIQUE des compteurs :
--   total_sent        = AT a accepté le message (dans leur réseau)
--   total_delivered   = DLR confirm livraison au handset
--   total_failed      = AT a rejeté (numéro invalide, solde, etc.)
--   total_undelivered = DLR dit non livré (hors réseau, expiré, etc.)

CREATE TABLE IF NOT EXISTS sms_campaigns (
  id                INT          NOT NULL AUTO_INCREMENT,
  tenant_id         INT          NOT NULL,
  created_by        INT          NULL DEFAULT NULL,
  name              VARCHAR(200) NOT NULL,
  message           TEXT         NOT NULL,
  sender_id         VARCHAR(11)  NOT NULL,
  status            ENUM('draft','queued','sending','sent','failed','cancelled','scheduled')
                    NOT NULL DEFAULT 'draft',
  scheduled_at      TIMESTAMP    NULL DEFAULT NULL,
  sent_at           TIMESTAMP    NULL DEFAULT NULL,
  total_recipients  INT          NOT NULL DEFAULT 0,
  total_sent        INT          NOT NULL DEFAULT 0,
  total_delivered   INT          NOT NULL DEFAULT 0,
  total_failed      INT          NOT NULL DEFAULT 0,
  total_undelivered INT          NOT NULL DEFAULT 0,
  created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at        TIMESTAMP    NULL DEFAULT NULL,

  PRIMARY KEY (id),
  KEY idx_sms_camp_tenant    (tenant_id),
  KEY idx_sms_camp_status    (status),
  KEY idx_sms_camp_sched     (scheduled_at),
  KEY idx_sms_camp_deleted   (deleted_at),

  CONSTRAINT fk_sms_camp_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── sms_campaign_lists ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS sms_campaign_lists (
  campaign_id INT NOT NULL,
  list_id     INT NOT NULL,

  PRIMARY KEY (campaign_id, list_id),
  KEY idx_sms_campl_list (list_id),

  CONSTRAINT fk_sms_campl_campaign
    FOREIGN KEY (campaign_id) REFERENCES sms_campaigns (id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT fk_sms_campl_list
    FOREIGN KEY (list_id) REFERENCES sms_contact_lists (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── sms_messages ────────────────────────────────────────────
-- 1 ligne = 1 SMS vers 1 destinataire
-- sent_at     = quand AT a accepté (≠ livraison)
-- delivered_at = quand le DLR confirme la livraison au handset

CREATE TABLE IF NOT EXISTS sms_messages (
  id             INT          NOT NULL AUTO_INCREMENT,
  tenant_id      INT          NOT NULL,
  campaign_id    INT          NULL DEFAULT NULL,
  scheduled_id   INT          NULL DEFAULT NULL,
  phone          VARCHAR(20)  NOT NULL,
  sender_id      VARCHAR(11)  NOT NULL,
  body           TEXT         NOT NULL,
  status         ENUM('pending','queued','sent','delivered','undelivered','failed')
                 NOT NULL DEFAULT 'pending',
  at_message_id  VARCHAR(100) NULL DEFAULT NULL,
  at_status_code INT          NULL DEFAULT NULL,
  failure_reason VARCHAR(200) NULL DEFAULT NULL,
  sent_at        TIMESTAMP    NULL DEFAULT NULL,
  delivered_at   TIMESTAMP    NULL DEFAULT NULL,
  segments       TINYINT      NOT NULL DEFAULT 1,
  created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_sms_msg_tenant   (tenant_id),
  KEY idx_sms_msg_campaign (campaign_id),
  KEY idx_sms_msg_status   (status),
  KEY idx_sms_msg_phone    (phone),
  KEY idx_sms_msg_at_id    (at_message_id),

  CONSTRAINT fk_sms_msg_campaign
    FOREIGN KEY (campaign_id) REFERENCES sms_campaigns (id)
    ON DELETE SET NULL ON UPDATE CASCADE,

  CONSTRAINT fk_sms_msg_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── sms_templates ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sms_templates (
  id          INT          NOT NULL AUTO_INCREMENT,
  tenant_id   INT          NOT NULL,
  name        VARCHAR(100) NOT NULL,
  body        TEXT         NOT NULL,
  created_by  INT          NULL DEFAULT NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at  TIMESTAMP    NULL DEFAULT NULL,

  PRIMARY KEY (id),
  KEY idx_sms_tpl_tenant  (tenant_id),
  KEY idx_sms_tpl_deleted (deleted_at),

  CONSTRAINT fk_sms_tpl_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── sms_otp ─────────────────────────────────────────────────
-- code_hash = sha256(code + tenant_id + phone) — jamais le code brut

CREATE TABLE IF NOT EXISTS sms_otp (
  id          INT         NOT NULL AUTO_INCREMENT,
  tenant_id   INT         NOT NULL,
  phone       VARCHAR(20) NOT NULL,
  code_hash   VARCHAR(64) NOT NULL,
  status      ENUM('pending','used','expired') NOT NULL DEFAULT 'pending',
  expires_at  TIMESTAMP   NOT NULL,
  used_at     TIMESTAMP   NULL DEFAULT NULL,
  created_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_sms_otp_lookup  (tenant_id, phone, status),
  KEY idx_sms_otp_expires (expires_at),

  CONSTRAINT fk_sms_otp_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── sms_scheduled ───────────────────────────────────────────
-- Messages Programmés — scheduled_at stocké en UTC

CREATE TABLE IF NOT EXISTS sms_scheduled (
  id               INT          NOT NULL AUTO_INCREMENT,
  tenant_id        INT          NOT NULL,
  created_by       INT          NULL DEFAULT NULL,
  titre            VARCHAR(200) NOT NULL,
  message          TEXT         NOT NULL,
  sender_id        VARCHAR(11)  NOT NULL,
  list_id          INT          NULL DEFAULT NULL,
  recipient_count  INT          NOT NULL DEFAULT 0,
  scheduled_at     TIMESTAMP    NOT NULL,
  timezone         VARCHAR(50)  NOT NULL DEFAULT 'Africa/Kinshasa',
  status           ENUM('pending','processing','dispatched','cancelled','failed')
                   NOT NULL DEFAULT 'pending',
  campaign_id      INT          NULL DEFAULT NULL,
  dispatched_at    TIMESTAMP    NULL DEFAULT NULL,
  created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at       TIMESTAMP    NULL DEFAULT NULL,

  PRIMARY KEY (id),
  KEY idx_sms_sched_tenant  (tenant_id),
  KEY idx_sms_sched_status  (status),
  KEY idx_sms_sched_at      (scheduled_at),
  KEY idx_sms_sched_deleted (deleted_at),

  CONSTRAINT fk_sms_sched_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── sms_short_links ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sms_short_links (
  id           INT          NOT NULL AUTO_INCREMENT,
  tenant_id    INT          NOT NULL,
  code         VARCHAR(10)  NOT NULL,
  original_url TEXT         NOT NULL,
  title        VARCHAR(100) NULL DEFAULT NULL,
  clicks       INT          NOT NULL DEFAULT 0,
  expires_at   TIMESTAMP    NULL DEFAULT NULL,
  created_by   INT          NULL DEFAULT NULL,
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at   TIMESTAMP    NULL DEFAULT NULL,

  PRIMARY KEY (id),
  UNIQUE KEY uq_sms_sl_code   (code),
  KEY idx_sms_sl_tenant  (tenant_id),
  KEY idx_sms_sl_deleted (deleted_at),

  CONSTRAINT fk_sms_sl_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── sms_link_clicks ─────────────────────────────────────────
-- IP hashée pour respecter la vie privée (jamais l'IP brute)

CREATE TABLE IF NOT EXISTS sms_link_clicks (
  id         INT        NOT NULL AUTO_INCREMENT,
  link_id    INT        NOT NULL,
  ip_hash    VARCHAR(64) NULL DEFAULT NULL,
  country    VARCHAR(2)  NULL DEFAULT NULL,
  clicked_at TIMESTAMP  NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_sms_lc_link_id    (link_id),
  KEY idx_sms_lc_clicked_at (clicked_at),

  CONSTRAINT fk_sms_lc_link
    FOREIGN KEY (link_id) REFERENCES sms_short_links (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET foreign_key_checks = 1;
