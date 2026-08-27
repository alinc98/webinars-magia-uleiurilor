-- Revendicarea rândurilor pentru cron-ul de remindere.
--
-- Cron-ul rulează din 15 în 15 minute din GitHub Actions, care poate întârzia
-- 5–20 de minute la ore de vârf, iar funcțiile serverless se pot reîncerca.
-- Ambele înseamnă că același rând poate fi procesat de două ori.
--
-- Soluția: marcăm *înainte* de a trimite, într-un UPDATE ... WHERE ... IS NULL
-- RETURNING, și trimitem doar rândurile returnate. A doua rulare nu mai găsește
-- nimic de revendicat.
--
-- Compromisul e conștient: dacă trimiterea eșuează după marcare, reminderul se
-- pierde în loc să fie trimis de două ori. Eșecul rămâne vizibil în `email_log`
-- cu status `queued`, de unde se poate retrimite din admin. Un email dublu
-- supără mai mult decât unul întârziat.
--
-- Ferestrele nu au margine superioară strânsă, tocmai ca o întârziere a
-- cron-ului să nu însemne un reminder pierdut.

-- Reminderul scurt e la 1h la online și la 3h la fizic/hibrid: la un eveniment
-- fizic oamenii trebuie să plece de acasă (brief §8).
create function offset_reminder_scurt(p_format webinar_format)
returns interval
language sql
immutable
set search_path = public, pg_temp
as $$
  select case when p_format = 'online' then interval '1 hour' else interval '3 hours' end;
$$;

create function claim_reminders_24h(p_limit integer default 200)
returns table (
  registration_id uuid,
  contact_id uuid,
  webinar_id uuid
)
language sql
security invoker
set search_path = public, pg_temp
as $$
  update registrations r
  set reminder_24h_sent_at = now()
  from webinars w
  where w.id = r.webinar_id
    and r.id in (
      select r2.id
      from registrations r2
      join webinars w2 on w2.id = r2.webinar_id
      where r2.kind = 'live'
        and r2.reminder_24h_sent_at is null
        and w2.status in ('published', 'live')
        and w2.starts_at > now() + offset_reminder_scurt(w2.format)
        and w2.starts_at <= now() + interval '24 hours'
      order by w2.starts_at
      limit p_limit
    )
  returning r.id, r.contact_id, r.webinar_id;
$$;

create function claim_reminders_short(p_limit integer default 200)
returns table (
  registration_id uuid,
  contact_id uuid,
  webinar_id uuid
)
language sql
security invoker
set search_path = public, pg_temp
as $$
  update registrations r
  set reminder_short_sent_at = now()
  from webinars w
  where w.id = r.webinar_id
    and r.id in (
      select r2.id
      from registrations r2
      join webinars w2 on w2.id = r2.webinar_id
      where r2.kind = 'live'
        and r2.reminder_short_sent_at is null
        and w2.status in ('published', 'live')
        and w2.starts_at > now()
        and w2.starts_at <= now() + offset_reminder_scurt(w2.format)
      order by w2.starts_at
      limit p_limit
    )
  returning r.id, r.contact_id, r.webinar_id;
$$;

-- Follow-up-ul pornește abia după ce webinarul e marcat `ended` în admin.
-- Altfel ar pleca înainte ca prezența să fie importată și toți ar primi
-- mesajul de absent.
create function claim_followups(p_limit integer default 200)
returns table (
  registration_id uuid,
  contact_id uuid,
  webinar_id uuid,
  attended boolean
)
language sql
security invoker
set search_path = public, pg_temp
as $$
  update registrations r
  set followup_sent_at = now()
  from webinars w
  where w.id = r.webinar_id
    and r.id in (
      select r2.id
      from registrations r2
      join webinars w2 on w2.id = r2.webinar_id
      join contacts c on c.id = r2.contact_id
      where r2.kind = 'live'
        and r2.followup_sent_at is null
        and w2.status = 'ended'
        and w2.starts_at + make_interval(mins => w2.duration_min) <= now() - interval '2 hours'
        -- Follow-up-ul e marketing, spre deosebire de remindere: respectă
        -- dezabonarea.
        and c.unsubscribed_at is null
      order by w2.starts_at
      limit p_limit
    )
  returning r.id, r.contact_id, r.webinar_id, r.attended;
$$;

grant execute on all routines in schema public to service_role;
revoke all on all routines in schema public from anon, authenticated;
