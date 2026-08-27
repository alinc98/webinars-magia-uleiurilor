-- Anonimizarea automată după perioada de retenție (brief §10).
--
-- Nu ștergem rândurile: `registrations` are ON DELETE CASCADE, deci o ștergere
-- reală ar scădea numărul de participanți la evenimentele trecute. Anonimizăm,
-- ca statistica să rămână corectă și persoana să dispară.

create function anonimizeaza_contacte_vechi()
returns integer
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_luni integer;
  v_numar integer;
begin
  select retentie_luni into v_luni from settings limit 1;
  v_luni := coalesce(v_luni, 24);

  with candidati as (
    select c.id
    from contacts c
    where c.email not like '%@anonim.invalid'
      and greatest(
            c.updated_at,
            coalesce((select max(registered_at) from registrations r where r.contact_id = c.id), c.created_at),
            coalesce((select max(created_at) from activities a where a.contact_id = c.id), c.created_at)
          ) < now() - make_interval(months => v_luni)
  ),
  sterse as (
    delete from activities where contact_id in (select id from candidati)
  ),
  sterse_email as (
    delete from email_log where contact_id in (select id from candidati)
  ),
  sterse_wl as (
    delete from waitlist where contact_id in (select id from candidati)
  )
  update contacts set
    name = 'Contact anonimizat',
    email = 'anonim-' || id || '@anonim.invalid',
    phone = null,
    notes = null,
    tags = '{}',
    status = 'inactiv',
    consent_marketing = false,
    unsubscribed_at = coalesce(unsubscribed_at, now()),
    first_utm_source = null, first_utm_medium = null, first_utm_campaign = null,
    first_utm_content = null, first_utm_term = null, first_fbclid = null,
    city = null, country = null
  where id in (select id from candidati);

  get diagnostics v_numar = row_count;
  return v_numar;
end;
$$;

grant execute on all routines in schema public to service_role;
revoke all on all routines in schema public from anon, authenticated;
