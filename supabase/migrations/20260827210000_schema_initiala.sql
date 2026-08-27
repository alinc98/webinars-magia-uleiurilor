-- Schema inițială: webinarii, speakeri, contacte, înscrieri, activități.
-- Vezi brief §6 și PLAN.md §3 pentru deciziile care au dus la forma asta.

-- ---------------------------------------------------------------------------
-- Tipuri
-- ---------------------------------------------------------------------------

create type webinar_status as enum ('draft', 'published', 'live', 'ended', 'cancelled');
create type webinar_format as enum ('online', 'fizic', 'hibrid');
create type registration_kind as enum ('live', 'inregistrare');
create type speaker_role as enum ('gazda', 'invitat');
create type contact_status as enum ('nou', 'contactat', 'interesat', 'client', 'inactiv');
create type admin_role as enum ('owner', 'editor');

create type email_status as enum (
  'queued', 'sent', 'delivered', 'opened', 'bounced', 'complained'
);

create type activity_type as enum (
  'inscriere', 'cerere_inregistrare', 'lista_asteptare',
  'email_trimis', 'email_deschis', 'prezenta',
  'nota_adaugata', 'tag_adaugat', 'dezabonare', 'export'
);

-- ---------------------------------------------------------------------------
-- Utilitare
-- ---------------------------------------------------------------------------

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- speakers — bibliotecă reutilizabilă, independentă de evenimente
-- ---------------------------------------------------------------------------

create table speakers (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  role_title    text,
  bio_short     text,
  photo_url     text,
  instagram_url text,
  facebook_url  text,
  website_url   text,
  is_default    boolean not null default false,
  -- un speaker folosit la evenimente trecute nu se șterge, se arhivează:
  -- altfel paginile arhivate rămân cu goluri (brief §7.4)
  archived_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint speakers_name_nevid check (btrim(name) <> '')
);

-- un singur speaker preselectat la webinar nou
create unique index speakers_un_singur_default on speakers ((true)) where is_default;

create trigger speakers_set_updated_at
  before update on speakers
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- webinars
-- ---------------------------------------------------------------------------

create table webinars (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique,
  title             text not null,
  subtitle          text,
  description       text,

  learning_points   jsonb not null default '[]'::jsonb,
  for_whom          jsonb not null default '[]'::jsonb,
  faq               jsonb not null default '[]'::jsonb,
  bonus_title       text,
  bonus_description text,

  starts_at         timestamptz not null,
  duration_min      integer not null default 60,
  timezone          text not null default 'Europe/Bucharest',

  format            webinar_format not null default 'online',
  join_url          text,                       -- online / hibrid
  venue_name        text,                       -- fizic / hibrid
  address           text,
  city              text,
  county            text,
  map_url           text,
  venue_notes       text,

  capacity          integer,
  cover_image_url   text,

  status            webinar_status not null default 'draft',
  listed            boolean not null default true,
  is_featured       boolean not null default false,
  sort_order        integer not null default 0,

  recording_url     text,
  replay_public     boolean not null default false,

  seo_title         text,
  seo_description   text,
  meta_pixel_id     text,
  utm_default       text,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint webinars_slug_valid    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint webinars_durata_poz    check (duration_min > 0),
  constraint webinars_capacitate_poz check (capacity is null or capacity > 0),
  constraint webinars_puncte_liste  check (
    jsonb_typeof(learning_points) = 'array'
    and jsonb_typeof(for_whom) = 'array'
    and jsonb_typeof(faq) = 'array'
  ),

  -- Constrângerile de mai jos se aplică doar la publicare: un draft are voie
  -- să fie incomplet, o pagină publică nu.
  constraint webinars_online_cere_link check (
    status <> 'published' or format = 'fizic' or join_url is not null
  ),
  constraint webinars_fizic_cere_locatie check (
    status <> 'published' or format = 'online'
    or (venue_name is not null and address is not null and city is not null)
  ),
  constraint webinars_replay_cere_url check (
    not replay_public or recording_url is not null
  )
);

-- „Un singur webinar poate fi evidențiat la un moment dat" (brief §7.2),
-- garantat de bază, nu de aplicație.
create unique index webinars_un_singur_featured on webinars ((true)) where is_featured;

create index webinars_starts_at_idx on webinars (starts_at desc);
create index webinars_status_idx    on webinars (status);
-- pentru grila din hub: publicate, listate, în ordinea afișării
create index webinars_hub_idx on webinars (sort_order, starts_at)
  where status = 'published' and listed;

create trigger webinars_set_updated_at
  before update on webinars
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- webinar_speakers
-- ---------------------------------------------------------------------------

create table webinar_speakers (
  webinar_id uuid not null references webinars (id) on delete cascade,
  -- restrict, nu cascade: un speaker folosit la un eveniment nu poate fi șters
  speaker_id uuid not null references speakers (id) on delete restrict,
  role_label speaker_role not null default 'invitat',
  sort_order integer not null default 0,

  primary key (webinar_id, speaker_id)
);

create index webinar_speakers_speaker_idx on webinar_speakers (speaker_id);

-- Maximum trei speakeri per eveniment (brief §7.2). Nu se poate exprima ca
-- CHECK, fiindcă e o constrângere între rânduri.
create or replace function webinar_speakers_max_trei()
returns trigger
language plpgsql
as $$
begin
  if (select count(*) from webinar_speakers where webinar_id = new.webinar_id) > 3 then
    raise exception 'Un webinar poate avea cel mult 3 speakeri';
  end if;
  return null;
end;
$$;

create constraint trigger webinar_speakers_max_trei_trg
  after insert or update on webinar_speakers
  deferrable initially deferred
  for each row execute function webinar_speakers_max_trei();

-- ---------------------------------------------------------------------------
-- contacts — inima CRM-ului, un rând per persoană
-- ---------------------------------------------------------------------------

create table contacts (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  email               text not null,
  phone               text,

  status              contact_status not null default 'nou',
  tags                text[] not null default '{}',

  consent_marketing   boolean not null default false,
  consent_at          timestamptz,
  consent_text_version text,

  unsubscribed_at     timestamptz,
  unsubscribe_token   uuid not null default gen_random_uuid(),

  first_source        text,
  first_utm_source    text,
  first_utm_medium    text,
  first_utm_campaign  text,
  first_utm_content   text,
  first_utm_term      text,
  first_fbclid        text,

  country             text,
  city                text,
  notes               text,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint contacts_email_valid check (position('@' in email) > 1),
  constraint contacts_name_nevid  check (btrim(name) <> '')
);

-- Emailul se normalizează înainte de scriere, pe orice cale de intrare.
-- Fără asta, Ana@x.ro și ana@x.ro devin doi contacți și CRM-ul se strică
-- exact așa cum avertizează brieful §6 că nu trebuie.
create or replace function contacts_normalizeaza_email()
returns trigger
language plpgsql
as $$
begin
  new.email = lower(btrim(new.email));
  new.name  = btrim(new.name);
  return new;
end;
$$;

create trigger contacts_normalizeaza_email_trg
  before insert or update of email, name on contacts
  for each row execute function contacts_normalizeaza_email();

create unique index contacts_email_key       on contacts (email);
create unique index contacts_unsub_token_key on contacts (unsubscribe_token);
create index contacts_status_idx  on contacts (status);
create index contacts_tags_idx    on contacts using gin (tags);
create index contacts_created_idx on contacts (created_at desc);

create trigger contacts_set_updated_at
  before update on contacts
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- registrations — relația persoană ↔ webinar
-- ---------------------------------------------------------------------------

create table registrations (
  id           uuid primary key default gen_random_uuid(),
  contact_id   uuid not null references contacts (id) on delete cascade,
  webinar_id   uuid not null references webinars (id) on delete cascade,
  kind         registration_kind not null default 'live',

  registered_at timestamptz not null default now(),

  utm_source   text,
  utm_medium   text,
  utm_campaign text,
  utm_content  text,
  utm_term     text,
  fbclid       text,
  referrer     text,
  landing_page text,

  -- doar la evenimentele hibride: „Cum vrei să participi?" (brief §12.8)
  attendance_preference text,

  attended         boolean not null default false,
  attended_minutes integer,

  reminder_24h_sent_at   timestamptz,
  -- 1h la online, 3h la fizic/hibrid — oamenii trebuie să plece de acasă.
  -- Vezi PLAN.md §3.1: în brief coloana se numea reminder_1h_sent_at.
  reminder_short_sent_at timestamptz,
  followup_sent_at       timestamptz,

  unique (contact_id, webinar_id, kind),

  constraint registrations_preferinta_valida check (
    attendance_preference is null
    or attendance_preference in ('fizic', 'online')
  ),
  constraint registrations_minute_poz check (
    attended_minutes is null or attended_minutes >= 0
  )
);

create index registrations_webinar_idx on registrations (webinar_id, registered_at desc);
create index registrations_contact_idx on registrations (contact_id);
-- coada cron-ului de remindere
create index registrations_remindere_idx on registrations (webinar_id)
  where kind = 'live' and (reminder_24h_sent_at is null or reminder_short_sent_at is null);

-- ---------------------------------------------------------------------------
-- waitlist
-- ---------------------------------------------------------------------------

-- Două feluri de așteptare, în același tabel:
--   webinar_id null → lista generală din starea goală a hub-ului (brief §11)
--   webinar_id set  → „anunță-mă dacă se eliberează un loc" la un eveniment
--                     fizic plin (brief §18). Brieful cerea UNIQUE(contact_id),
--                     ceea ce ar fi făcut al doilea caz imposibil.
create table waitlist (
  id          uuid primary key default gen_random_uuid(),
  contact_id  uuid not null references contacts (id) on delete cascade,
  webinar_id  uuid references webinars (id) on delete cascade,
  interest    text,
  notified_at timestamptz,
  created_at  timestamptz not null default now(),

  constraint waitlist_interes_valid check (
    interest is null or interest in ('online', 'fizic', 'ambele')
  ),

  unique nulls not distinct (contact_id, webinar_id)
);

create index waitlist_neanuntati_idx on waitlist (created_at) where notified_at is null;

-- ---------------------------------------------------------------------------
-- activities — timeline-ul contactului
-- ---------------------------------------------------------------------------

create table activities (
  id         uuid primary key default gen_random_uuid(),
  contact_id uuid not null references contacts (id) on delete cascade,
  type       activity_type not null,
  payload    jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index activities_contact_idx on activities (contact_id, created_at desc);

-- ---------------------------------------------------------------------------
-- email_log
-- ---------------------------------------------------------------------------

create table email_log (
  id          uuid primary key default gen_random_uuid(),
  contact_id  uuid not null references contacts (id) on delete cascade,
  webinar_id  uuid references webinars (id) on delete set null,
  template    text not null,
  subject     text,
  provider_id text,
  status      email_status not null default 'queued',
  sent_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index email_log_contact_idx  on email_log (contact_id, created_at desc);
create index email_log_provider_idx on email_log (provider_id) where provider_id is not null;

-- ---------------------------------------------------------------------------
-- admin_users — listă albă de adrese, verificată în proxy.ts
-- ---------------------------------------------------------------------------

create table admin_users (
  id            uuid primary key default gen_random_uuid(),
  email         text not null,
  name          text,
  role          admin_role not null default 'editor',
  last_login_at timestamptz,
  created_at    timestamptz not null default now()
);

create or replace function admin_users_normalizeaza_email()
returns trigger
language plpgsql
as $$
begin
  new.email = lower(btrim(new.email));
  return new;
end;
$$;

create trigger admin_users_normalizeaza_email_trg
  before insert or update of email on admin_users
  for each row execute function admin_users_normalizeaza_email();

create unique index admin_users_email_key on admin_users (email);

-- ---------------------------------------------------------------------------
-- rate_limit_hits — rate limiting pe Postgres, fără al patrulea furnizor
-- (PLAN.md §1, decizia 3)
-- ---------------------------------------------------------------------------

create table rate_limit_hits (
  id         bigint generated always as identity primary key,
  bucket     text not null,          -- ex. 'inscriere:198.51.100.4'
  created_at timestamptz not null default now()
);

create index rate_limit_hits_bucket_idx on rate_limit_hits (bucket, created_at desc);
