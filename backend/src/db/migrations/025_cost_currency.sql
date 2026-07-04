-- Devise réelle facturée par Infobip (price.currency du DLR) — plus de "$" hardcodé
ALTER TABLE sms_messages
  ADD COLUMN cost_currency VARCHAR(8) NULL DEFAULT NULL AFTER cost;

ALTER TABLE sms_transactions
  ADD COLUMN currency VARCHAR(8) NULL DEFAULT NULL AFTER amount;
