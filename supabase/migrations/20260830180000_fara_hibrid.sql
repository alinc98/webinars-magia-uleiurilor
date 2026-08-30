-- Scoatem formatul hibrid.
--
-- Nu se fac astfel de evenimente, iar ramura lui atingea tot lanţul: pagina
-- publică, formularul de înscriere, confirmarea, reamintirile, plus o coloană
-- pe fiecare înscriere pentru „cum vrei să participi". Un caz care nu apare
-- niciodată e cod pe care nimeni nu-l încearcă vreodată.
--
-- Verificat înainte de scriere: zero evenimente hibride, zero preferinţe
-- salvate. Garda de mai jos o verifică din nou la aplicare, ca migraţia să
-- cadă zgomotos dacă ajunge pe o bază care are.

do $$
begin
  if exists (select 1 from webinars where format = 'hibrid') then
    raise exception 'Există evenimente hibride. Schimbă-le formatul înainte.';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Ordinea contează
-- ---------------------------------------------------------------------------
--
-- View-ul selectează `w.*`, deci ţine coloana `format` şi blochează schimbarea
-- tipului. `offset_reminder_scurt` are tipul în semnătură, deci ţine tipul
-- vechi şi ar bloca ştergerea lui. Amândouă pleacă întâi şi se întorc după.
--
-- `claim_reminders_24h` şi `claim_reminders_short` cheamă
-- `offset_reminder_scurt` din corpuri-şir, deci se leagă la execuţie şi nu
-- trebuie atinse.

drop view webinars_public;

drop function offset_reminder_scurt(webinar_format);

drop function register_for_webinar(
  text, text, text, boolean, text, registration_kind, text, text, text, jsonb
);

alter table registrations drop column attendance_preference;

-- ---------------------------------------------------------------------------
-- Tipul, fără „hibrid"
-- ---------------------------------------------------------------------------
--
-- Postgres nu ştie să scoată o valoare dintr-un enum. Redenumim tipul vechi,
-- construim unul nou şi mutăm coloana pe el.

-- Şi constrângerile: literalii din ele sunt legaţi de tipul vechi, iar la
-- schimbarea coloanei Postgres ar încerca `webinar_format = webinar_format_vechi`
-- şi ar cădea. Se pun la loc după.
alter table webinars drop constraint webinars_online_cere_link;
alter table webinars drop constraint webinars_fizic_cere_locatie;

alter table webinars alter column format drop default;
alter type webinar_format rename to webinar_format_vechi;
create type webinar_format as enum ('online', 'fizic');

alter table webinars
  alter column format type webinar_format using format::text::webinar_format;

alter table webinars alter column format set default 'online';

drop type webinar_format_vechi;

alter table webinars add constraint webinars_online_cere_link check (
  status <> 'published' or format = 'fizic' or join_url is not null
);

alter table webinars add constraint webinars_fizic_cere_locatie check (
  status <> 'published' or format = 'online'
  or (venue_name is not null and address is not null and city is not null)
);

-- ---------------------------------------------------------------------------
-- Înapoi ce am scos
-- ---------------------------------------------------------------------------

create function offset_reminder_scurt(p_format webinar_format)
returns interval
language sql
immutable
set search_path = public, pg_temp
as $$
  select case when p_format = 'online' then interval '1 hour' else interval '3 hours' end;
$$;

create function register_for_webinar(
  p_slug                 text,
  p_name                 text,
  p_email                text,
  p_consent              boolean,
  p_phone                text    default null,
  p_kind                 registration_kind default 'live',
  p_consent_text_version text    default null,
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
    fbclid, referrer, landing_page
  ) values (
    v_contact_id, v_webinar.id, p_kind,
    p_tracking->>'utm_source', p_tracking->>'utm_medium', p_tracking->>'utm_campaign',
    p_tracking->>'utm_content', p_tracking->>'utm_term',
    p_tracking->>'fbclid', p_tracking->>'referrer', p_tracking->>'landing_page'
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
