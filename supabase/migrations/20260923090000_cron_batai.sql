-- Bătaia inimii cron-ului.
--
-- Cron-ul de reamintiri a fost verde săptămâni la rând fără să trimită nimic:
-- un plafon gol ajungea `limit 0` în bază, revendicarea întorcea zero rânduri
-- fără nicio eroare, iar rularea raporta succes. Nimic nu verifica dacă ce
-- trebuia trimis chiar a plecat.
--
-- Coloana asta e jumătatea simplă a răspunsului: cron-ul scrie aici la fiecare
-- rulare reuşită, iar verificarea zilnică se uită dacă valoarea s-a mişcat.
-- Dacă programarea se opreşte de tot — indiferent de ce platformă o ţine —
-- tăcerea devine vizibilă în cel mult o zi.
--
-- Cealaltă jumătate nu încape într-o coloană: verificarea se uită şi în urmă,
-- după înscrişi rămaşi fără reamintire la evenimente deja trecute. Aia ar fi
-- prins greşeala de acum trei săptămâni.

alter table settings add column cron_ultima_rulare timestamptz;

comment on column settings.cron_ultima_rulare is
  'Ultima rulare reuşită a cron-ului de reamintiri. Verificarea zilnică dă '
  'alarma dacă rămâne în urmă.';
