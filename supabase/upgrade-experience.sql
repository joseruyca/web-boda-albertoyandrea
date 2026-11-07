-- For an already initialized project; fresh projects use schema.sql.
alter table public.wedding_media add column if not exists caption text not null default '';
