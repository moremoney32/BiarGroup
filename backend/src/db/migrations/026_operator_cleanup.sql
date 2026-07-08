-- L'ancien code écrivait "Opérateur (null)" quand le DLR arrivait sans mccMnc,
-- et 62402 était mappé Vodafone au lieu d'Orange Cameroun.
-- On remet à NULL : le job d'enrichissement (/sms/1/logs) re-remplit quand c'est encore possible.
UPDATE sms_messages SET operator = NULL WHERE operator LIKE 'Opérateur (%';
UPDATE sms_messages SET operator = NULL WHERE operator = 'Vodafone';
