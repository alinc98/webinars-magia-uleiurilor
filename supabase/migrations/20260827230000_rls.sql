-- Row Level Security pe toate tabelele, fără nicio politică.
--
-- Zero politici = zero rânduri pentru `anon` și `authenticated`. `service_role`
-- trece pe deasupra RLS, iar toate interogările aplicației folosesc clientul cu
-- `service_role`, pe server (lib/supabase/admin.ts).
--
-- Brieful (§5) propunea o excepție pentru citirea webinariilor publicate. Nu e
-- necesară: paginile publice sunt Server Components care citesc tot prin
-- `service_role`. O politică de citire publică ar fi doar o a doua ușă de
-- păzit, fără nimic în plus.
--
-- Vezi PLAN.md §1 pentru raționamentul complet.

alter table webinars         enable row level security;
alter table speakers         enable row level security;
alter table webinar_speakers enable row level security;
alter table contacts         enable row level security;
alter table registrations    enable row level security;
alter table waitlist         enable row level security;
alter table activities       enable row level security;
alter table email_log        enable row level security;
alter table admin_users      enable row level security;
alter table rate_limit_hits  enable row level security;

-- RLS blochează rândurile, dar nu ascunde forma tabelelor și nu oprește
-- apelarea funcțiilor. Retragem și grant-urile, ca `anon` să nu poată nici
-- măcar să încerce.
--
-- Fără asta, oricine are cheia publishable din browser ar putea apela
-- `register_for_webinar` direct, ocolind validarea Zod, honeypot-ul și rate
-- limiting-ul din /api/inscriere.

-- Întâi drepturile lui `service_role`, explicit.
--
-- Nu ne bazăm pe default privileges: Supabase și le atașează rolului
-- `supabase_admin`, dar migrațiile rulează ca `postgres`, ale cărui valori
-- implicite dau lui `service_role` doar REFERENCES/TRIGGER/TRUNCATE — fără
-- SELECT sau INSERT. Verificat pe local: fără blocul ăsta, aplicația însăși
-- primește „permission denied for table contacts".
--
-- Grant-urile explicite stau în repo, se aplică identic pe dev și pe prod și se
-- văd la code review.

grant usage on schema public to service_role;
grant all     on all tables    in schema public to service_role;
grant all     on all sequences in schema public to service_role;
grant execute on all routines  in schema public to service_role;

alter default privileges in schema public grant all     on tables    to service_role;
alter default privileges in schema public grant all     on sequences to service_role;
alter default privileges in schema public grant execute on routines  to service_role;

-- Apoi retragem tot de la rolurile vizibile în browser.
revoke all on all tables    in schema public from anon, authenticated;
revoke all on all routines  in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

-- Și pentru ce se creează de acum înainte.
alter default privileges in schema public
  revoke all on tables    from anon, authenticated;
alter default privileges in schema public
  revoke all on routines  from anon, authenticated;
alter default privileges in schema public
  revoke all on sequences from anon, authenticated;
