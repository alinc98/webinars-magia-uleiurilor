-- Date de test pentru dezvoltare. Nume și subiecte plauzibile în română, nu
-- Lorem ipsum (brief §17).

insert into speakers (name, role_title, bio_short, is_default) values
  ('Andreea Gligor', 'Aromaterapeut, 8 ani experiență',
   'Lucrez de opt ani cu uleiuri esențiale și am ghidat peste 2000 de familii spre ritualuri simple de îngrijire naturală.',
   true),
  ('Ioana Marinescu', 'Nutriționist', 'Însoțesc familiile spre obiceiuri alimentare echilibrate, fără diete restrictive.', false);

insert into webinars
  (slug, title, subtitle, description, starts_at, duration_min, status, format, join_url,
   venue_name, address, city, county, venue_notes, capacity, listed, is_featured)
values
  ('uleiuri-pentru-incepatori',
   'Cum folosești uleiurile esențiale în viața de zi cu zi',
   'O oră despre cele cinci uleiuri de la care merită să pornești și ce faci concret cu ele.',
   'Fără termeni complicați și fără să presupun că știi ceva dinainte.',
   now() + interval '9 day', 60, 'published', 'online', 'https://zoom.us/j/123456789',
   null, null, null, null, null, 100, true, true),
  ('ritualuri-de-seara',
   'Ritualuri de seară pentru toată familia',
   'Rutine scurte pentru seri mai liniștite acasă.',
   null,
   now() + interval '24 day', 60, 'published', 'online', 'https://zoom.us/j/987654321',
   null, null, null, null, null, null, true, false),
  ('atelier-cluj',
   'Atelier practic la Cluj',
   'Ne vedem pe viu și amestecăm primele tale trei blenduri.',
   null,
   now() + interval '31 day', 120, 'published', 'fizic', null,
   'Casa Tranquila', 'Str. Memorandumului 12', 'Cluj-Napoca', 'Cluj',
   'Parcare în curte, intrarea din spate.', 12, true, false);

insert into webinar_speakers (webinar_id, speaker_id, role_label, sort_order)
select w.id, s.id, 'gazda', 1 from webinars w, speakers s where s.name = 'Andreea Gligor';

insert into webinar_speakers (webinar_id, speaker_id, role_label, sort_order)
select w.id, s.id, 'invitat', 2
from webinars w, speakers s
where w.slug = 'ritualuri-de-seara' and s.name = 'Ioana Marinescu';
