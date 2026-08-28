-- Prețul evenimentului, doar afișat.
--
-- O singură coloană, nu un comutator plus o sumă: două ar putea ajunge să se
-- contrazică — „cu plată" fără preț, sau „gratuit" cu 150 în el — şi nimeni
-- n-ar şti cui să-i dea crezare. Gol înseamnă gratuit. Alegerea „Gratuit /
-- Cu plată" din formular e stare de interfaţă, dedusă din coloana asta.
--
-- În bani, întreg, ca `duration_min` în minute: preţurile ţinute în virgulă
-- mobilă adună erori de rotunjire. 150 lei se scrie 15000.

alter table webinars add column price_bani integer;

comment on column webinars.price_bani is
  'Preţul în bani. NULL înseamnă eveniment gratuit.';

alter table webinars
  add constraint webinars_pret_poz check (price_bani is null or price_bani > 0);

-- ---------------------------------------------------------------------------
-- webinars_public trebuie recreat, nu doar completat
-- ---------------------------------------------------------------------------
--
-- View-ul selectează `w.*`, iar Postgres expandează asta o singură dată, la
-- creare. O coloană adăugată în tabel nu apare de la sine în view — de-aia
-- `useful_info`, adăugat mai devreme azi, lipsea şi el. `create or replace` nu
-- ajută: ar insera coloanele noi înaintea celor calculate, iar schimbarea de
-- ordine e refuzată. Deci drop şi recreare.
--
-- `dashboard_stats()` foloseşte view-ul, dar e `language sql` cu corp-şir,
-- deci se leagă la execuţie, nu la creare. Nu blochează drop-ul.
--
-- Granturile revin singure: migraţia de RLS a pus `alter default privileges`
-- şi pentru `grant ... to service_role`, şi pentru `revoke ... from anon`.

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
  coalesce(s.speakers, '[]'::jsonb) as speakers
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
) s on true;

comment on view webinars_public is
  'Webinar cu speakerii agregați, numărul de înscriși și locurile rămase. '
  'Folosit de hub și de paginile individuale.';
