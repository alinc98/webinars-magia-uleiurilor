-- Evenimente pe mai multe zile.
--
-- Până acum un eveniment ştia un singur lucru: un moment de start şi o durată
-- în minute. Un atelier de trei zile, 10:00–14:00, nu încape acolo: nu e nici
-- „720 de minute", nici „trei zile".
--
-- Varianta cu o coloană `ends_at` lângă `starts_at` ar fi fost greşită — acelaşi
-- atelier ar fi devenit un bloc continuu de la ziua 1 ora 10 la ziua 3 ora 14,
-- adică trei zile blocate în calendarul omului, nopţile incluse. Modelul corect
-- e o listă: fiecare eveniment are una sau mai multe întâlniri, fiecare cu
-- început şi sfârşit. Cazul de până acum e cazul cu o singură sesiune, deci
-- nimic din ce funcţiona nu devine excepţie.
--
-- Vezi PLAN-SESIUNI.md pentru raţionamentul complet.

-- ---------------------------------------------------------------------------
-- Tabelul
-- ---------------------------------------------------------------------------

create table webinar_sessions (
  id         uuid primary key default gen_random_uuid(),
  webinar_id uuid not null references webinars(id) on delete cascade,
  starts_at  timestamptz not null,
  ends_at    timestamptz not null,
  -- „Ziua 1: Fundamentele". Opţional; când lipseşte, pagina scrie „Ziua 1".
  label      text,

  constraint webinar_sessions_interval check (ends_at > starts_at)
);

-- Fără `sort_order`: ordinea unei liste de date e data. Un eveniment în care
-- ziua 2 apare înaintea zilei 1 n-are înţeles.
create unique index webinar_sessions_fara_dubluri
  on webinar_sessions (webinar_id, starts_at);

create index webinar_sessions_webinar_idx
  on webinar_sessions (webinar_id, starts_at);

alter table webinar_sessions enable row level security;

comment on table webinar_sessions is
  'Întâlnirile unui eveniment. Una singură la cele obişnuite, mai multe la '
  'atelierele pe zile. Sursa adevărului pentru program; `webinars.starts_at` '
  'şi `webinars.ends_at` sunt un rezumat ţinut la zi de trigger.';

-- ---------------------------------------------------------------------------
-- Rezumatul de pe părinte
-- ---------------------------------------------------------------------------
--
-- `starts_at` rămâne pe `webinars`, deşi adevărul s-a mutat în sesiuni. E
-- folosit la sortarea hub-ului, la sortarea listei din admin, în indexuri, în
-- cele trei funcţii de revendicare a reamintirilor, în garda din
-- `register_for_webinar` şi în `dashboard_stats`. Sortarea unui tabel după o
-- coloană dintr-un tabel copil nu se exprimă în PostgREST fără să rescriem
-- fiecare interogare — iar toate ar rescrie acelaşi lucru.
--
-- Deci: coloanele rămân, dar devin derivate. Nullable acum, `not null` după
-- backfill.

alter table webinars add column ends_at timestamptz;

create function sincronizeaza_program()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_webinar uuid := coalesce(new.webinar_id, old.webinar_id);
begin
  update webinars w
  set starts_at    = s.prima,
      ends_at      = s.ultima,
      duration_min = s.minute
  from (
    select min(se.starts_at) as prima,
           max(se.ends_at)   as ultima,
           -- `webinars_durata_poz` cere strict pozitiv; `greatest` acoperă
           -- teoreticul interval de sub un minut.
           greatest(
             sum(extract(epoch from (se.ends_at - se.starts_at)) / 60)::int,
             1
           ) as minute
    from webinar_sessions se
    where se.webinar_id = v_webinar
  ) s
  -- Între ştergerea sesiunilor vechi şi inserarea celor noi tabelul e gol o
  -- clipă, iar `starts_at` e `not null`. Atunci nu scriem nimic şi lăsăm
  -- valorile vechi, în loc să cădem. Fereastra nu se vede din afară: scrierea
  -- trece prin `set_webinar_sessions`, într-o singură tranzacţie.
  where w.id = v_webinar and s.prima is not null;

  return null;
end;
$$;

create trigger webinar_sessions_sincronizare
  after insert or update or delete on webinar_sessions
  for each row execute function sincronizeaza_program();

comment on function sincronizeaza_program() is
  'Ţine `webinars.starts_at`, `ends_at` şi `duration_min` egale cu prima '
  'sesiune, ultima sesiune şi suma minutelor.';

-- ---------------------------------------------------------------------------
-- Backfill: fiecare eveniment existent devine un eveniment cu o sesiune
-- ---------------------------------------------------------------------------

insert into webinar_sessions (webinar_id, starts_at, ends_at)
select id, starts_at, starts_at + make_interval(mins => duration_min)
from webinars;

-- Trigger-ul a umplut `ends_at` pe tot ce exista. De acum înainte îl scrie
-- aplicaţia la inserare, iar trigger-ul îl confirmă. `not null` ca un eveniment
-- fără program să cadă zgomotos, nu să dispară în tăcere de pe hub — filtrul de
-- acolo întreabă `ends_at >= now()`, iar un null l-ar fi exclus.
alter table webinars alter column ends_at set not null;

-- ---------------------------------------------------------------------------
-- Scrierea programului, într-o singură tranzacţie
-- ---------------------------------------------------------------------------
--
-- Şterge şi rescrie, nu diff: lista are două-trei rânduri, iar un diff ar cere
-- formularului să poarte identificatori degeaba.

create function set_webinar_sessions(p_webinar_id uuid, p_sessions jsonb)
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if p_sessions is null or jsonb_array_length(p_sessions) = 0 then
    raise exception 'Un eveniment are nevoie de cel puţin o întâlnire.';
  end if;

  delete from webinar_sessions where webinar_id = p_webinar_id;

  insert into webinar_sessions (webinar_id, starts_at, ends_at, label)
  select p_webinar_id,
         (s->>'starts_at')::timestamptz,
         (s->>'ends_at')::timestamptz,
         nullif(btrim(coalesce(s->>'label', '')), '')
  from jsonb_array_elements(p_sessions) s;
end;
$$;

-- ---------------------------------------------------------------------------
-- webinars_public, recreat
-- ---------------------------------------------------------------------------
--
-- View-ul selectează `w.*`, iar Postgres expandează asta o singură dată, la
-- creare. Nici `ends_at` n-ar apărea de la sine — aceeaşi poveste ca la
-- `useful_info` şi la preţ. `create or replace` nu ajută: ar insera coloanele
-- noi înaintea celor calculate, iar schimbarea de ordine e refuzată.
--
-- `dashboard_stats()` foloseşte view-ul, dar e `language sql` cu corp-şir, deci
-- se leagă la execuţie şi nu blochează drop-ul.
--
-- Granturile revin singure: migraţia de RLS a pus `alter default privileges`.

drop view webinars_public;

create view webinars_public
with (security_invoker = true)
as
select
  w.*,
  coalesce(r.inscrisi, 0) as registrations_count,
  case
    when w.capacity is null then null
    else greatest(w.capacity - coalesce(r.inscrisi, 0), 0)
  end as seats_left,
  case
    when w.capacity is null then false
    else coalesce(r.inscrisi, 0) >= w.capacity
  end as is_full,
  coalesce(s.speakers, '[]'::jsonb) as speakers,
  coalesce(ses.sessions, '[]'::jsonb) as sessions
from webinars w
left join lateral (
  select count(*) as inscrisi
  from registrations
  where webinar_id = w.id and kind = 'live'
) r on true
left join lateral (
  select jsonb_agg(
           jsonb_build_object(
             'id', sp.id,
             'name', sp.name,
             'role_title', sp.role_title,
             'bio_short', sp.bio_short,
             'photo_url', sp.photo_url,
             'instagram_url', sp.instagram_url,
             'facebook_url', sp.facebook_url,
             'website_url', sp.website_url,
             'role_label', ws.role_label,
             'sort_order', ws.sort_order
           )
           order by ws.sort_order, sp.name
         ) as speakers
  from webinar_speakers ws
  join speakers sp on sp.id = ws.speaker_id
  where ws.webinar_id = w.id
) s on true
left join lateral (
  select jsonb_agg(
           jsonb_build_object(
             'starts_at', se.starts_at,
             'ends_at',   se.ends_at,
             'label',     se.label
           )
           order by se.starts_at
         ) as sessions
  from webinar_sessions se
  where se.webinar_id = w.id
) ses on true;

comment on view webinars_public is
  'Webinar cu speakerii agregaţi, programul pe întâlniri, numărul de înscrişi '
  'şi locurile rămase. Folosit de hub şi de paginile individuale.';

-- ---------------------------------------------------------------------------
-- Un eveniment în desfăşurare nu e un eveniment trecut
-- ---------------------------------------------------------------------------
--
-- `starts_at >= now()` era acelaşi lucru cu „încă n-a trecut" cât timp fiecare
-- eveniment ţinea o singură seară. La unul de trei zile e fals din prima seară:
-- ar fi dispărut de pe panou fix în timp ce se desfăşoară. Acelaşi filtru se
-- schimbă şi în `lib/webinars/queries.ts`.
--
-- Garda din `register_for_webinar` rămâne însă pe `starts_at`: înscrierile se
-- închid când începe prima întâlnire. Cine s-ar înscrie în ziua a treia n-ar
-- avea ce recupera.

create or replace function dashboard_stats()
returns jsonb
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'leads_today',      (select count(*) from contacts where created_at >= current_date),
    'leads_7d',         (select count(*) from contacts where created_at >= current_date - 6),
    'leads_30d',        (select count(*) from contacts where created_at >= current_date - 29),
    'leads_prev_7d',    (select count(*) from contacts
                          where created_at >= current_date - 13
                            and created_at <  current_date - 6),
    'leads_prev_30d',   (select count(*) from contacts
                          where created_at >= current_date - 59
                            and created_at <  current_date - 29),
    'waitlist_pending', (select count(*) from waitlist
                          where notified_at is null and webinar_id is null),
    'next_webinar',     (
      select jsonb_build_object(
               'id', w.id, 'slug', w.slug, 'title', w.title,
               'starts_at', w.starts_at, 'format', w.format,
               'registrations_count', w.registrations_count,
               'seats_left', w.seats_left)
      from webinars_public w
      where w.status in ('published', 'live') and w.ends_at >= now()
      order by w.starts_at
      limit 1
    ),
    'last_webinar',     (
      select jsonb_build_object(
               'id', w.id, 'slug', w.slug, 'title', w.title,
               'starts_at', w.starts_at,
               'registered', r.total, 'attended', r.attended,
               'show_up_rate', case when r.total = 0 then null
                                    else round(r.attended::numeric * 100 / r.total, 1) end)
      from webinars w
      join lateral (
        select count(*) as total, count(*) filter (where attended) as attended
        from registrations where webinar_id = w.id and kind = 'live'
      ) r on true
      where w.status = 'ended'
      order by w.starts_at desc
      limit 1
    )
  );
$$;

-- ---------------------------------------------------------------------------
-- Drepturi
-- ---------------------------------------------------------------------------
--
-- `alter default privileges` din migraţia de RLS le-ar pune oricum, dar le
-- scriem explicit ca migraţia să se poată citi singură.

grant all     on webinar_sessions to service_role;
grant execute on all routines in schema public to service_role;
revoke all    on webinar_sessions from anon, authenticated;
revoke all    on all routines in schema public from anon, authenticated;
