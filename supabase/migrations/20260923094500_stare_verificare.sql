-- Rezultatul ultimei verificări, ca să se vadă şi din panou.
--
-- Verificarea zilnică trimite email doar când găseşte ceva. E corect — dar
-- lasă o gaură: o alarmă tăcută arată identic cu o alarmă stricată. Dacă peste
-- două luni ruta se strică, tăcerea ei va părea în continuare o veste bună.
--
-- Coloanele astea sunt confirmarea pozitivă: când a rulat ultima oară şi ce a
-- găsit. Panoul le arată, deci „merge" devine un lucru care se poate vedea,
-- nu unul dedus din lipsa unui email.

alter table settings add column verificare_ultima_rulare timestamptz;
alter table settings add column verificare_probleme jsonb not null default '[]'::jsonb;

comment on column settings.verificare_ultima_rulare is
  'Când a rulat ultima dată verificarea zilnică, indiferent ce a găsit.';

comment on column settings.verificare_probleme is
  'Titlurile problemelor găsite la ultima rulare. Listă goală = totul în regulă.';
