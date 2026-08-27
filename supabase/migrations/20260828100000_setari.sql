-- Setări editabile din admin, plus versionarea textului de consimțământ.
--
-- Brieful (§10) cere ca textul acceptat să fie salvat versionat: dacă se
-- schimbă, trebuie să știi cine ce a acceptat. `contacts.consent_text_version`
-- ține versiunea; aici ține textul în sine, cu istoric.

create table consent_texts (
  version    text primary key,
  body       text not null,
  is_current boolean not null default false,
  created_at timestamptz not null default now(),

  constraint consent_texts_body_nevid check (btrim(body) <> '')
);

-- O singură versiune curentă, garantat de bază.
create unique index consent_texts_o_singura_curenta on consent_texts ((true)) where is_current;

insert into consent_texts (version, body, is_current) values (
  '2026-08-v1',
  'Sunt de acord cu prelucrarea datelor mele personale (nume, email, telefon) '
  || 'pentru a primi informații despre acest eveniment și despre următoarele '
  || 'întâlniri organizate de Magia Uleiurilor Esențiale. Mă pot dezabona '
  || 'oricând, dintr-un link aflat în fiecare mesaj.',
  true
);

-- Setări generale, un singur rând.
create table settings (
  id                 boolean primary key default true,
  hub_title          text not null default 'Întâlniri despre uleiuri esențiale',
  hub_intro          text not null default 'Ritualuri simple pentru tine și casa ta, explicate pe înțelesul oricui.',
  hub_empty_text     text not null default 'Nu e nimic programat în momentul ăsta. Lasă-ți adresa și afli primul când se anunță următoarea întâlnire.',
  -- Contactele fără activitate de atâtea luni se anonimizează (brief §10).
  retentie_luni      integer not null default 24,
  updated_at         timestamptz not null default now(),

  constraint settings_rand_unic check (id),
  constraint settings_retentie check (retentie_luni between 1 and 120)
);

insert into settings (id) values (true);

create trigger settings_set_updated_at
  before update on settings
  for each row execute function set_updated_at();

alter table consent_texts enable row level security;
alter table settings      enable row level security;

grant all on all tables in schema public to service_role;
revoke all on all tables in schema public from anon, authenticated;
