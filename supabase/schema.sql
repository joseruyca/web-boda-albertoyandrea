-- Backend tables are deliberately inaccessible to browser roles.
-- The authenticated wedding Edge Function owns all authorization checks.
create table public.invitations (
 id uuid primary key default gen_random_uuid(),
 token_hash text not null unique check (length(token_hash)=64),
 token_ciphertext text not null,
 label text not null check (length(label) between 1 and 120),
 guests jsonb not null check (jsonb_typeof(guests)='array' and jsonb_array_length(guests) between 1 and 15),
 phone text not null default '', response jsonb,
 table_no integer, revoked boolean not null default false,
 sent_at timestamptz, opened_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.wedding_settings (key text primary key,value jsonb not null);
create table public.wedding_media (
 id uuid primary key default gen_random_uuid(),
 invitation_id uuid references public.invitations(id) on delete set null,
 upload_owner text not null,
 object_key text not null unique,
 name text not null, mime text not null,
 size bigint not null check (size between 1 and 52428800),
 author text not null, caption text not null default '',
 approved boolean not null default false,
 status text not null default 'reserved' check (status in ('reserved','ready','failed','deleted')),
 created_at timestamptz not null default now()
);
create index media_invitation on public.wedding_media(invitation_id,created_at desc);
create index media_upload_owner on public.wedding_media(upload_owner,status);
create index media_gallery on public.wedding_media(status,approved,created_at desc);
alter table public.invitations enable row level security;
alter table public.wedding_settings enable row level security;
alter table public.wedding_media enable row level security;
revoke all on public.invitations,public.wedding_settings,public.wedding_media from anon,authenticated;
grant select,insert,update,delete on public.invitations,public.wedding_settings,public.wedding_media to service_role;
-- Private storage: only signed, scoped upload URLs and short lived download URLs.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('wedding-memories','wedding-memories',false,52428800,
 array['image/jpeg','image/png','image/webp','image/gif','image/avif','image/heic','image/heif','video/mp4','video/webm','video/quicktime']);

-- Additive upgrade: preserves every invitation, answer and original file.
alter table public.wedding_media add column if not exists content_hash text;
alter table public.wedding_media add column if not exists thumbnail_key text;
alter table public.wedding_media add column if not exists thumbnail_ready boolean not null default false;
alter table public.wedding_media add column if not exists hidden boolean not null default false;
create unique index if not exists wedding_media_content_unique on public.wedding_media(content_hash) where content_hash is not null and status in ('reserved','ready');
create table if not exists public.wedding_media_reports (
 id uuid primary key default gen_random_uuid(),media_id uuid not null references public.wedding_media(id),reporter_hash text not null,reason text not null check(length(reason) between 1 and 500),resolved boolean not null default false,created_at timestamptz not null default now(),unique(media_id,reporter_hash)
);
create index if not exists wedding_reports_pending on public.wedding_media_reports(resolved,created_at desc);
alter table public.wedding_media_reports enable row level security;
revoke all on public.wedding_media_reports from anon,authenticated;
grant select,insert,update,delete on public.wedding_media_reports to service_role;
create table if not exists public.wedding_rate_limits (key text not null,window_start bigint not null,hits integer not null,primary key(key,window_start));
create index if not exists wedding_rate_expiry on public.wedding_rate_limits(window_start);
alter table public.wedding_rate_limits enable row level security;
revoke all on public.wedding_rate_limits from anon,authenticated;
grant select,insert,update,delete on public.wedding_rate_limits to service_role;
create or replace function public.consume_wedding_limit(p_key text,p_limit integer,p_seconds integer) returns boolean language plpgsql security invoker set search_path = '' as $$
declare slot bigint; accepted integer;
begin
 if p_seconds<1 or p_limit<1 then return false; end if;
 slot := floor(extract(epoch from clock_timestamp())/p_seconds)::bigint*p_seconds;
 insert into public.wedding_rate_limits(key,window_start,hits) values(p_key,slot,1)
 on conflict(key,window_start) do update set hits=public.wedding_rate_limits.hits+1 where public.wedding_rate_limits.hits<p_limit returning hits into accepted;
 return accepted is not null;
end; $$;
revoke all on function public.consume_wedding_limit(text,integer,integer) from public,anon,authenticated;
grant execute on function public.consume_wedding_limit(text,integer,integer) to service_role;
