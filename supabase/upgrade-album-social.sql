-- Additive upgrade. Originals, invitations and RSVP answers are preserved.
create table public.wedding_album_members (
 id uuid primary key default gen_random_uuid(), owner_key text not null,
 slot text not null, invitation_id uuid references public.invitations(id) on delete set null,
 display_name text not null check(length(display_name) between 1 and 120),
 created_at timestamptz not null default now(), unique(owner_key,slot)
);
alter table public.wedding_media add column member_id uuid references public.wedding_album_members(id);
alter table public.wedding_media add column moment text not null default 'other' check(moment in ('prewedding','ceremony','cocktail','dinner','party','other'));
create index wedding_media_member_feed on public.wedding_media(member_id,status,created_at desc,id desc);
create index wedding_media_moment_feed on public.wedding_media(moment,status,hidden,created_at desc,id desc);
-- Old authors retain their own album; no arbitrary family-member attribution.
insert into public.wedding_album_members(owner_key,slot,invitation_id,display_name)
 select upload_owner,'legacy:'||md5(author),min(invitation_id::text)::uuid,left(max(author),120)
 from public.wedding_media where length(author)>0 group by upload_owner,author;
update public.wedding_media m set member_id=p.id from public.wedding_album_members p
 where p.owner_key=m.upload_owner and p.slot='legacy:'||md5(m.author);
create table public.wedding_media_likes (
 media_id uuid not null references public.wedding_media(id) on delete cascade,
 member_id uuid not null references public.wedding_album_members(id) on delete cascade,
 created_at timestamptz not null default now(),primary key(media_id,member_id)
);
create index wedding_likes_member on public.wedding_media_likes(member_id);
create table public.wedding_album_challenges (
 id text primary key check(id ~ '^[a-z0-9_-]{1,60}$'), title text not null check(length(title) between 1 and 100),
 description text not null default '' check(length(description)<=300), is_open boolean not null default true,
 closes_at timestamptz, created_at timestamptz not null default now()
);
insert into public.wedding_album_challenges(id,title,description) values
 ('outfit','Un look para recordar','La foto de un outfit que merece su propio aplauso.'),
 ('bride','La novia, en su mejor momento','Una mirada, un gesto, un recuerdo de Andrea.'),
 ('dance','El momentazo de la pista','Ese instante en el que nadie quería dejar de bailar.'),
 ('fun','La foto más divertida','La imagen que nos vuelva a hacer reír.'),
 ('couple','Los novios, juntos','Vuestra mejor foto de Andrea y Alberto.');
create table public.wedding_challenge_entries (
 id uuid primary key default gen_random_uuid(), challenge_id text not null references public.wedding_album_challenges(id),
 member_id uuid not null references public.wedding_album_members(id), media_id uuid not null references public.wedding_media(id),
 created_at timestamptz not null default now(),unique(challenge_id,member_id),unique(challenge_id,media_id)
);
create index wedding_entries_member on public.wedding_challenge_entries(member_id);
create index wedding_entries_media on public.wedding_challenge_entries(media_id);
create table public.wedding_challenge_votes (
 challenge_id text not null references public.wedding_album_challenges(id),
 member_id uuid not null references public.wedding_album_members(id),
 entry_id uuid not null references public.wedding_challenge_entries(id) on delete cascade,
 created_at timestamptz not null default now(),primary key(challenge_id,member_id)
);
create index wedding_votes_entry on public.wedding_challenge_votes(entry_id);
create index wedding_votes_member on public.wedding_challenge_votes(member_id);
alter table public.wedding_album_challenges add column winner_entry_id uuid references public.wedding_challenge_entries(id) on delete set null;
-- All operations go through the existing authenticated wedding backend.
do $$ declare t text; begin foreach t in array array['wedding_album_members','wedding_media_likes','wedding_album_challenges','wedding_challenge_entries','wedding_challenge_votes'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from anon, authenticated',t);
 execute format('grant select,insert,update,delete on public.%I to service_role',t);
end loop; end $$;
create function public.wedding_album_people(p_offset integer default 0,p_search text default '')
returns table(id uuid,name text,media_count bigint,cover_id uuid,cover_mime text,thumbnail_ready boolean)
language sql stable security invoker set search_path='' as $$
 select p.id,p.display_name,count(*),
 (array_agg(m.id order by (m.mime like 'image/%') desc,m.created_at desc,m.id desc))[1],
 (array_agg(m.mime order by (m.mime like 'image/%') desc,m.created_at desc,m.id desc))[1],
 (array_agg(m.thumbnail_ready order by (m.mime like 'image/%') desc,m.created_at desc,m.id desc))[1]
 from public.wedding_album_members p join public.wedding_media m on m.member_id=p.id and m.status='ready' and not m.hidden
 where p.display_name ilike '%'||left(p_search,100)||'%'
 group by p.id order by lower(p.display_name),p.id limit 61 offset greatest(p_offset,0)
$$;
create function public.wedding_album_stats(p_ids uuid[],p_member uuid default null)
returns table(media_id uuid,likes bigint,liked boolean)
language sql stable security invoker set search_path='' as $$
 select m.id,count(l.member_id),coalesce(bool_or(l.member_id=p_member),false)
 from public.wedding_media m left join public.wedding_media_likes l on l.media_id=m.id
 where m.id=any(p_ids) and m.status='ready' group by m.id
$$;
create function public.wedding_album_moments() returns table(moment text,total bigint)
language sql stable security invoker set search_path='' as $$
 select m.moment,count(*) from public.wedding_media m where m.status='ready' and not m.hidden group by m.moment
$$;
create function public.wedding_challenge_results(p_challenge text,p_member uuid default null,p_offset integer default 0)
returns table(id uuid,member_id uuid,media_id uuid,author text,name text,mime text,thumbnail_ready boolean,caption text,votes bigint,voted boolean,created_at timestamptz)
language sql stable security invoker set search_path='' as $$
 select e.id,e.member_id,e.media_id,p.display_name,m.name,m.mime,m.thumbnail_ready,m.caption,count(v.member_id),coalesce(bool_or(v.member_id=p_member),false),e.created_at
 from public.wedding_challenge_entries e join public.wedding_media m on m.id=e.media_id and m.status='ready' and not m.hidden
 join public.wedding_album_members p on p.id=e.member_id left join public.wedding_challenge_votes v on v.entry_id=e.id and v.challenge_id=e.challenge_id
 where e.challenge_id=p_challenge group by e.id,p.display_name,m.id order by count(v.member_id) desc,e.created_at,e.id limit 61 offset greatest(p_offset,0)
$$;
create function public.wedding_album_react(p_media uuid,p_member uuid,p_owner text,p_liked boolean) returns void
language plpgsql security invoker set search_path='' as $$
begin
 if not exists(select 1 from public.wedding_album_members where id=p_member and owner_key=p_owner) then raise exception 'Identifícate para reaccionar.'; end if;
 perform 1 from public.wedding_media where id=p_media and status='ready' and not hidden for update;
 if not found then raise exception 'El recuerdo ya no está disponible.'; end if;
 if p_liked then insert into public.wedding_media_likes(media_id,member_id) values(p_media,p_member) on conflict do nothing;
 else delete from public.wedding_media_likes where media_id=p_media and member_id=p_member; end if;
end $$;
create function public.wedding_submit_entry(p_challenge text,p_media uuid,p_member uuid,p_owner text) returns uuid
language plpgsql security invoker set search_path='' as $$
declare existing public.wedding_challenge_entries; result uuid;
begin
 if not exists(select 1 from public.wedding_album_members p join public.invitations i on i.id=p.invitation_id and not i.revoked where p.id=p_member and p.owner_key=p_owner and p.owner_key='invite:'||i.id::text and (case when p.slot ~ '^guest:[0-9]{1,2}$' then split_part(p.slot,':',2)::int else -1 end) between 0 and jsonb_array_length(i.guests)-1) then raise exception 'Para participar, abre tu invitación personal y elige tu nombre.'; end if;
 perform 1 from public.wedding_album_challenges where id=p_challenge and is_open and (closes_at is null or closes_at>now()) for update;
 if not found then raise exception 'Este reto está cerrado.'; end if;
 perform 1 from public.wedding_media where id=p_media and member_id=p_member and upload_owner=p_owner and mime like 'image/%' and status='ready' and not hidden for share;
 if not found then raise exception 'Elige una foto visible de tu álbum.'; end if;
 select * into existing from public.wedding_challenge_entries where challenge_id=p_challenge and member_id=p_member for update;
 if found and existing.media_id=p_media then return existing.id; end if;
 if existing.id is not null and exists(select 1 from public.wedding_challenge_votes where entry_id=existing.id) then raise exception 'Tu foto ya tiene votos. Puedes retirarla, pero no sustituirla conservando los votos.'; end if;
 insert into public.wedding_challenge_entries(challenge_id,member_id,media_id) values(p_challenge,p_member,p_media)
 on conflict(challenge_id,member_id) do update set media_id=excluded.media_id returning id into result;
 return result;
end $$;
create function public.wedding_vote_entry(p_challenge text,p_entry uuid,p_member uuid,p_owner text,p_remove boolean default false) returns void
language plpgsql security invoker set search_path='' as $$
begin
 if not exists(select 1 from public.wedding_album_members p join public.invitations i on i.id=p.invitation_id and not i.revoked where p.id=p_member and p.owner_key=p_owner and p.owner_key='invite:'||i.id::text and (case when p.slot ~ '^guest:[0-9]{1,2}$' then split_part(p.slot,':',2)::int else -1 end) between 0 and jsonb_array_length(i.guests)-1) then raise exception 'Para votar, abre tu invitación personal.'; end if;
 perform 1 from public.wedding_album_challenges where id=p_challenge and is_open and (closes_at is null or closes_at>now()) for update;
 if not found then raise exception 'La votación de este reto está cerrada.'; end if;
 if p_remove then delete from public.wedding_challenge_votes where challenge_id=p_challenge and member_id=p_member and entry_id=p_entry; return; end if;
 perform 1 from public.wedding_challenge_entries e join public.wedding_media m on m.id=e.media_id and m.status='ready' and not m.hidden where e.id=p_entry and e.challenge_id=p_challenge and e.member_id<>p_member for share of e;
 if not found then raise exception 'No puedes votar tu propia foto ni una candidatura retirada.'; end if;
 insert into public.wedding_challenge_votes(challenge_id,member_id,entry_id) values(p_challenge,p_member,p_entry)
 on conflict(challenge_id,member_id) do update set entry_id=excluded.entry_id;
end $$;
revoke all on function public.wedding_album_people(integer,text),public.wedding_album_stats(uuid[],uuid),public.wedding_album_moments(),public.wedding_challenge_results(text,uuid,integer),public.wedding_album_react(uuid,uuid,text,boolean),public.wedding_submit_entry(text,uuid,uuid,text),public.wedding_vote_entry(text,uuid,uuid,text,boolean) from public,anon,authenticated;
grant execute on function public.wedding_album_people(integer,text),public.wedding_album_stats(uuid[],uuid),public.wedding_album_moments(),public.wedding_challenge_results(text,uuid,integer),public.wedding_album_react(uuid,uuid,text,boolean),public.wedding_submit_entry(text,uuid,uuid,text),public.wedding_vote_entry(text,uuid,uuid,text,boolean) to service_role;

-- Canonicalize only previous photos that have an unambiguous invitation member.
insert into public.wedding_album_members(owner_key,slot,invitation_id,display_name)
select distinct 'invite:'||i.id::text,'guest:'||(g.n-1)::text,i.id,left(g.name,120)
from public.invitations i cross join lateral jsonb_array_elements_text(i.guests) with ordinality g(name,n)
where exists(select 1 from public.wedding_media m join public.wedding_album_members old on old.id=m.member_id
 where m.upload_owner='invite:'||i.id::text and old.slot like 'legacy:%'
 and (jsonb_array_length(i.guests)=1 or lower(trim(m.author))=lower(trim(g.name))))
on conflict(owner_key,slot) do nothing;
update public.wedding_media m set member_id=p.id
from public.wedding_album_members p,public.invitations i,public.wedding_album_members old
where i.id=p.invitation_id and old.id=m.member_id and old.slot like 'legacy:%'
and m.upload_owner=p.owner_key and p.slot like 'guest:%'
and (jsonb_array_length(i.guests)=1 or lower(trim(m.author))=lower(trim(p.display_name)));

create index if not exists wedding_members_invitation on public.wedding_album_members(invitation_id);
create index if not exists wedding_challenge_winner on public.wedding_album_challenges(winner_entry_id);
create or replace function public.wedding_album_backup() returns jsonb
language sql stable security invoker set search_path='' as $$
 select jsonb_build_object(
 'members',coalesce((select jsonb_agg(to_jsonb(p)) from public.wedding_album_members p),'[]'::jsonb),
 'likes',coalesce((select jsonb_agg(to_jsonb(l)) from public.wedding_media_likes l),'[]'::jsonb),
 'challenges',coalesce((select jsonb_agg(to_jsonb(c)) from public.wedding_album_challenges c),'[]'::jsonb),
 'entries',coalesce((select jsonb_agg(to_jsonb(e)) from public.wedding_challenge_entries e),'[]'::jsonb),
 'votes',coalesce((select jsonb_agg(to_jsonb(v)) from public.wedding_challenge_votes v),'[]'::jsonb))
$$;
revoke all on function public.wedding_album_backup() from public,anon,authenticated;
grant execute on function public.wedding_album_backup() to service_role;
