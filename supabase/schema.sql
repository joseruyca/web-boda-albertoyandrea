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
 author text not null,
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
