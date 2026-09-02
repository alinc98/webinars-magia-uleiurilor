-- Moneda preţului: lei sau euro.
--
-- Până acum orice sumă era în lei, fiindcă aşa scria în cod, nu în bază. Un
-- eveniment de 150 în euro s-ar fi afişat „150 lei" — nu o eroare de calcul,
-- ci una de citit, adică felul cel mai neplăcut.
--
-- `text` cu constrângere, nu enum. Un enum ar fi mai strâns, dar Postgres nu
-- ştie să scoată o valoare dintr-un enum: scoaterea formatului „hibrid" a cerut
-- redenumirea tipului, unul nou, mutarea coloanei şi refacerea a două
-- constrângeri. Lista monedelor e exact genul care se schimbă, iar o
-- constrângere se rescrie dintr-o linie.

alter table webinars
  add column price_currency text not null default 'RON';

alter table webinars
  add constraint webinars_moneda_stiuta
  check (price_currency in ('RON', 'EUR'));

comment on column webinars.price_currency is
  'Moneda preţului. Rămâne RON la evenimentele gratuite, unde nu înseamnă '
  'nimic — mai bine o valoare implicită decât o coloană care poate lipsi.';

-- `price_bani` ţine de-acum subunitatea monedei alese: bani la lei, cenţi la
-- euro. Numele rămâne — l-am cântărit, iar redenumirea ar fi cerut recrearea
-- view-ului, regenerarea tipurilor şi atingerea a opt fişiere, ca să câştigăm
-- un cuvânt. Comentariul ăsta e locul unde se lămureşte.
comment on column webinars.price_bani is
  'Preţul în subunitatea monedei din `price_currency`: bani la RON, cenţi la '
  'EUR. 150,00 se scrie 15000. NULL înseamnă eveniment gratuit.';

-- ---------------------------------------------------------------------------
-- webinars_public, recreat
-- ---------------------------------------------------------------------------
--
-- A treia oară, din acelaşi motiv: view-ul selectează `w.*`, iar Postgres
-- expandează asta o singură dată, la creare. O coloană adăugată în tabel nu
-- apare de la sine.
--
-- `dashboard_stats()` foloseşte view-ul, dar e `language sql` cu corp-şir, deci
-- se leagă la execuţie şi nu blochează drop-ul. Granturile revin singure, prin
-- `alter default privileges` din migraţia de RLS.

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
