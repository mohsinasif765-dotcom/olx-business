-- Home WhatsApp card link (admin Settings → Brand). Run once in Zuvo SQL.
alter table public.site_settings
  add column if not exists whatsapp text not null default '';

-- Optional: set your number here (country code, no +). Then Save still works from admin.
-- update public.site_settings set whatsapp = 'https://wa.me/923001234567' where id = 1;
