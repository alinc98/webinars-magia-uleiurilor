-- View-uri și funcții RPC.
--
-- PostgREST e bun la citiri simple și slab la agregări sau la mai multe scrieri
-- legate. Tot ce intră în a doua categorie trăiește aici, în SQL, în loc să fie
-- împrăștiat prin aplicație. Vezi PLAN.md §1.
--
-- Toate view-urile sunt `security_invoker = true`. Fără asta, un view deținut de
-- `postgres` ar citi tabelele cu drepturile proprietarului și ar ocoli RLS-ul
-- activat în migrația următoare — adică exact gaura pe care încercăm s-o
-- închidem.

-- ---------------------------------------------------------------------------
-- webinars_public — forma de care au nevoie paginile publice, într-un rând
-- ---------------------------------------------------------------------------

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

-- ---------------------------------------------------------------------------
-- contacts_with_stats — tabelul de lead-uri din admin
-- ---------------------------------------------------------------------------

create view contacts_with_stats
with (security_invoker = true)
as
select
  c.*,
  coalesce(r.total, 0)          as registrations_count,
  coalesce(r.live_count, 0)     as live_count,
  coalesce(r.replay_count, 0)   as replay_count,
  coalesce(r.attended_count, 0) as attended_count,
  r.last_registered_at,
  coalesce(r.webinar_ids, '{}'::uuid[]) as webinar_ids,
  (w.contact_id is not null)    as on_waitlist
from contacts c
left join lateral (
  select
    count(*)                                            as total,
    count(*) filter (where kind = 'live')               as live_count,
    count(*) filter (where kind = 'inregistrare')       as replay_count,
    count(*) filter (where attended)                    as attended_count,
    max(registered_at)                                  as last_registered_at,
    array_agg(webinar_id)                               as webinar_ids
  from registrations
  where contact_id = c.id
) r on true
left join lateral (
  select contact_id from waitlist
  where contact_id = c.id and webinar_id is null
  limit 1
) w on true;

comment on view contacts_with_stats is
  'Contacte cu numărul de înscrieri și prezențe. PostgREST filtrează, sortează '
  'și paginează pe view exact ca pe un tabel, deci filtrele din searchParams '
  'merg direct.';

-- ---------------------------------------------------------------------------
-- Rate limiting pe Postgres, ca să nu adăugăm un al patrulea furnizor
-- ---------------------------------------------------------------------------

create function check_rate_limit(
  p_bucket text,
  p_max    integer default 5,
  p_window interval default interval '10 minutes'
)
returns boolean
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_hits integer;
begin
  -- curățenie oportunistă, ca tabelul să nu crească la nesfârșit
  delete from rate_limit_hits where created_at < now() - interval '1 day';

  select count(*) into v_hits
  from rate_limit_hits
  where bucket = p_bucket and created_at > now() - p_window;

  if v_hits >= p_max then
    return false;
  end if;

  insert into rate_limit_hits (bucket) values (p_bucket);
  return true;
end;
$$;

-- ---------------------------------------------------------------------------
-- register_for_webinar — înscrierea, atomică
-- ---------------------------------------------------------------------------
--
-- Patru operațiuni care nu au voie să se execute pe jumătate: verificarea
-- locurilor, upsert-ul contactului, inserarea înscrierii și activitatea.
-- PostgREST nu are tranzacții pe mai multe cereri, deci trăiesc împreună aici.
--
-- Rezultatele de business se întorc ca jsonb, nu ca excepții: `/api/inscriere`
-- trebuie să poată răspunde diferit la „e plin" față de „te-ai înscris deja",
-- iar o excepție ar deveni un 500 nediferențiat.

create function register_for_webinar(
  p_slug                 text,
  p_name                 text,
  p_email                text,
  p_consent              boolean,
  p_phone                text    default null,
  p_kind                 registration_kind default 'live',
  p_consent_text_version text    default null,
  p_attendance_preference text   default null,
  p_source               text    default null,
  p_tracking             jsonb   default '{}'::jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_webinar    webinars%rowtype;
  v_contact_id uuid;
  v_reg_id     uuid;
  v_email      text := lower(btrim(p_email));
  v_inscrisi   integer;
  v_nou        boolean := false;
begin
  if not p_consent then
    return jsonb_build_object('ok', false, 'reason', 'consent_required');
  end if;

  -- FOR UPDATE: fără el, două formulare trimise simultan pe ultimul loc trec
  -- amândouă (PLAN.md §3.4).
  select * into v_webinar from webinars where slug = p_slug for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'webinar_not_found');
  end if;

  if p_kind = 'live' then
    if v_webinar.status not in ('published', 'live') then
      return jsonb_build_object('ok', false, 'reason', 'webinar_not_open');
    end if;
    if v_webinar.status = 'published' and v_webinar.starts_at < now() then
      return jsonb_build_object('ok', false, 'reason', 'webinar_past');
    end if;
  else
    if not v_webinar.replay_public or v_webinar.recording_url is null then
      return jsonb_build_object('ok', false, 'reason', 'replay_unavailable');
    end if;
  end if;

  if p_kind = 'live' and v_webinar.capacity is not null then
    select count(*) into v_inscrisi
    from registrations
    where webinar_id = v_webinar.id and kind = 'live';

    if v_inscrisi >= v_webinar.capacity then
      return jsonb_build_object('ok', false, 'reason', 'full',
                                'webinar_id', v_webinar.id);
    end if;
  end if;

  -- Contactul: prima atingere nu se rescrie niciodată. UTM-urile de pe contact
  -- spun de unde a venit omul prima dată; cele de pe înscriere spun de unde a
  -- venit de data asta (brief §9).
  select id into v_contact_id from contacts where email = v_email;

  if v_contact_id is null then
    insert into contacts (
      name, email, phone,
      consent_marketing, consent_at, consent_text_version,
      first_source,
      first_utm_source, first_utm_medium, first_utm_campaign,
      first_utm_content, first_utm_term, first_fbclid
    ) values (
      p_name, v_email, nullif(btrim(coalesce(p_phone, '')), ''),
      true, now(), p_consent_text_version,
      p_source,
      p_tracking->>'utm_source', p_tracking->>'utm_medium', p_tracking->>'utm_campaign',
      p_tracking->>'utm_content', p_tracking->>'utm_term', p_tracking->>'fbclid'
    )
    returning id into v_contact_id;
    v_nou := true;
  else
    update contacts set
      -- completăm doar golurile; nu suprascriem ce a editat cineva în admin
      phone = coalesce(phone, nullif(btrim(coalesce(p_phone, '')), '')),
      consent_marketing = true,
      consent_at = coalesce(consent_at, now()),
      consent_text_version = coalesce(p_consent_text_version, consent_text_version)
    where id = v_contact_id;
    -- unsubscribed_at rămâne neatins intenționat: dezabonarea oprește
    -- marketingul, dar emailurile operaționale ale unui eveniment la care
    -- tocmai s-a înscris tot trebuie să ajungă.
  end if;

  insert into registrations (
    contact_id, webinar_id, kind,
    utm_source, utm_medium, utm_campaign, utm_content, utm_term,
    fbclid, referrer, landing_page,
    attendance_preference
  ) values (
    v_contact_id, v_webinar.id, p_kind,
    p_tracking->>'utm_source', p_tracking->>'utm_medium', p_tracking->>'utm_campaign',
    p_tracking->>'utm_content', p_tracking->>'utm_term',
    p_tracking->>'fbclid', p_tracking->>'referrer', p_tracking->>'landing_page',
    case when v_webinar.format = 'hibrid' then p_attendance_preference end
  )
  on conflict (contact_id, webinar_id, kind) do nothing
  returning id into v_reg_id;

  if v_reg_id is null then
    return jsonb_build_object(
      'ok', false, 'reason', 'already_registered',
      'contact_id', v_contact_id, 'webinar_id', v_webinar.id
    );
  end if;

  insert into activities (contact_id, type, payload) values (
    v_contact_id,
    case when p_kind = 'live' then 'inscriere' else 'cerere_inregistrare' end::activity_type,
    jsonb_build_object(
      'webinar_id', v_webinar.id,
      'webinar_slug', v_webinar.slug,
      'webinar_title', v_webinar.title,
      'registration_id', v_reg_id,
      'landing_page', p_tracking->>'landing_page'
    )
  );

  return jsonb_build_object(
    'ok', true,
    'status', case when v_nou then 'contact_created' else 'contact_existing' end,
    'contact_id', v_contact_id,
    'registration_id', v_reg_id,
    'webinar_id', v_webinar.id,
    'webinar_slug', v_webinar.slug
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- join_waitlist — starea goală a hub-ului și „anunță-mă dacă se eliberează un loc"
-- ---------------------------------------------------------------------------

create function join_waitlist(
  p_name                 text,
  p_email                text,
  p_consent              boolean,
  p_interest             text  default null,
  p_webinar_slug         text  default null,
  p_consent_text_version text  default null,
  p_source               text  default null,
  p_tracking             jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_contact_id uuid;
  v_webinar_id uuid;
  v_email      text := lower(btrim(p_email));
  v_wid        uuid;
begin
  if not p_consent then
    return jsonb_build_object('ok', false, 'reason', 'consent_required');
  end if;

  if p_webinar_slug is not null then
    select id into v_webinar_id from webinars where slug = p_webinar_slug;
    if v_webinar_id is null then
      return jsonb_build_object('ok', false, 'reason', 'webinar_not_found');
    end if;
  end if;

  select id into v_contact_id from contacts where email = v_email;

  if v_contact_id is null then
    insert into contacts (
      name, email, tags,
      consent_marketing, consent_at, consent_text_version,
      first_source,
      first_utm_source, first_utm_medium, first_utm_campaign,
      first_utm_content, first_utm_term, first_fbclid
    ) values (
      p_name, v_email, array['lista-asteptare'],
      true, now(), p_consent_text_version,
      p_source,
      p_tracking->>'utm_source', p_tracking->>'utm_medium', p_tracking->>'utm_campaign',
      p_tracking->>'utm_content', p_tracking->>'utm_term', p_tracking->>'fbclid'
    )
    returning id into v_contact_id;
  else
    update contacts set
      -- array_append, nu `||`: cu `||` Postgres încearcă să interpreteze
      -- textul ca literal de array și eșuează.
      tags = case when 'lista-asteptare' = any(tags) then tags
                  else array_append(tags, 'lista-asteptare') end,
      consent_marketing = true,
      consent_at = coalesce(consent_at, now()),
      consent_text_version = coalesce(p_consent_text_version, consent_text_version)
    where id = v_contact_id;
  end if;

  insert into waitlist (contact_id, webinar_id, interest)
  values (v_contact_id, v_webinar_id, p_interest)
  on conflict (contact_id, webinar_id) do nothing
  returning id into v_wid;

  if v_wid is null then
    return jsonb_build_object('ok', false, 'reason', 'already_on_waitlist',
                              'contact_id', v_contact_id);
  end if;

  insert into activities (contact_id, type, payload) values (
    v_contact_id, 'lista_asteptare',
    jsonb_build_object('webinar_id', v_webinar_id, 'interest', p_interest)
  );

  return jsonb_build_object('ok', true, 'contact_id', v_contact_id,
                            'waitlist_id', v_wid);
end;
$$;

-- ---------------------------------------------------------------------------
-- Dezabonare cu token
-- ---------------------------------------------------------------------------

create function unsubscribe_by_token(p_token uuid)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_contact_id uuid;
begin
  update contacts
  set unsubscribed_at = coalesce(unsubscribed_at, now()),
      consent_marketing = false
  where unsubscribe_token = p_token
  returning id into v_contact_id;

  if v_contact_id is null then
    return jsonb_build_object('ok', false, 'reason', 'token_invalid');
  end if;

  insert into activities (contact_id, type, payload)
  values (v_contact_id, 'dezabonare', '{}'::jsonb);

  return jsonb_build_object('ok', true, 'contact_id', v_contact_id);
end;
$$;

-- ---------------------------------------------------------------------------
-- Cifrele de pe dashboard
-- ---------------------------------------------------------------------------

create function dashboard_stats()
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
      where w.status in ('published', 'live') and w.starts_at >= now()
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

create function leads_per_day(p_days integer default 30)
returns table (zi date, leads bigint)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select d::date as zi,
         count(c.id) as leads
  from generate_series(current_date - (p_days - 1), current_date, interval '1 day') d
  left join contacts c on c.created_at >= d and c.created_at < d + interval '1 day'
  group by d
  order by d;
$$;
