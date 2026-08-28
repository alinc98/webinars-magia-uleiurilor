-- Informații utile, independente de format.
--
-- `venue_notes` există deja, dar ține de un loc fizic: drum, parcare, ce să-ți
-- iei cu tine. La un webinar n-are ce căuta, iar confirmarea rămânea fără
-- blocul „Informații utile" tocmai la evenimentele online, unde e locul firesc
-- pentru „ai nevoie de căști" sau „pregătește-ți un carnețel".
--
-- Coloană separată, nu refolosirea celei vechi: sensurile sunt diferite şi
-- amândouă pot apărea în acelaşi email la un eveniment fizic.

alter table webinars add column useful_info text;

comment on column webinars.useful_info is
  'Text liber care ajunge în emailul de confirmare, la orice format.';
