-- Migration 015 : Associer des groupes de contacts aux flows email
-- group_ids_json stocke les IDs des groupes qui déclenchent l'enrollment

ALTER TABLE email_flows
  ADD COLUMN group_ids_json JSON NULL DEFAULT NULL AFTER trigger_type;
