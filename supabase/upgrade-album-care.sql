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
