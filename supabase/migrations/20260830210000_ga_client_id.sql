-- Identificatorul de browser al lui GA4, păstrat pe înscriere.
--
-- Measurement Protocol trimite evenimente de pe server, dar are nevoie de
-- `client_id` ca să le lipească de aceeaşi persoană. Pe server nu-l avem — e un
-- cookie pus de gtag în browser — deci îl luăm la înscriere şi îl păstrăm aici.
--
-- Fără el, un eveniment trimis de pe server ar apărea ca un utilizator nou,
-- fără nicio legătură cu vizita din care a venit înscrierea. Adică exact
-- opusul motivului pentru care îl trimitem.
--
-- Rămâne gol pentru cine a refuzat cookie-urile: atunci gtag nu pune nimic, iar
-- noi n-avem ce citi. E corect aşa — fără consimţământ, fără măsurare.

alter table registrations add column ga_client_id text;

comment on column registrations.ga_client_id is
  'client_id al GA4, citit din cookie-ul _ga la înscriere. NULL fără consimţământ.';
