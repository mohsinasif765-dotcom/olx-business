-- About Us fields editable from admin Settings.
alter table public.site_settings
  add column if not exists about_tagline text not null default '';
alter table public.site_settings
  add column if not exists about_body text not null default '';
alter table public.site_settings
  add column if not exists about_step1 text not null default '';
alter table public.site_settings
  add column if not exists about_step2 text not null default '';
alter table public.site_settings
  add column if not exists about_step3 text not null default '';
alter table public.site_settings
  add column if not exists about_version text not null default 'Version 1.0';
alter table public.site_settings
  add column if not exists company_name text not null default 'OLX Business Digital Ltd';
alter table public.site_settings
  add column if not exists company_address text not null default 'Office 2208, Bay View Tower, Business Bay, Dubai, United Arab Emirates';
alter table public.site_settings
  add column if not exists company_no text not null default 'OB-2026-8841';
alter table public.site_settings
  add column if not exists company_reg_date text not null default '12 Jan 2026';
alter table public.site_settings
  add column if not exists company_issued text not null default '05 Oct 2026';
