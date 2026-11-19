create table public.vocab_settings (
 id boolean primary key default true check (id),
 code_hash text not null check(length(code_hash)=64)
);
create table public.vocab_sessions (
 token_hash text primary key check(length(token_hash)=64),
 expires_at timestamptz not null,
 created_at timestamptz not null default now()
);
create index vocab_sessions_expiry on public.vocab_sessions(expires_at);
create table public.vocab_words (
 id uuid primary key default gen_random_uuid(),
 subject text not null check(subject in ('lat1','lat2','lat4','gr1')),
 form text not null check(length(form) between 1 and 300),
 form_key text not null,
 meaning text not null check(length(meaning) between 1 and 1000),
 answers text[] not null check(cardinality(answers) between 1 and 30),
 units text[] not null check(cardinality(units) between 1 and 30),
 in_exam boolean not null default false,
 active boolean not null default true,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(subject,form_key)
);
create table public.vocab_reports (
 id uuid primary key default gen_random_uuid(),
 kind text not null check(kind in ('translation','missing','units','other')),
 subject text not null check(subject in ('lat1','lat2','lat4','gr1')),
 mode text not null check(mode in ('general','examen')),
 units text[] not null default '{}',
 entry_id text not null default '' check(length(entry_id)<=100),
 entry_form text not null default '' check(length(entry_form)<=300),
 message text not null check(length(message) between 5 and 2000),
 status text not null default 'pending' check(status in ('pending','reviewing','resolved','dismissed')),
 teacher_note text not null default '' check(length(teacher_note)<=2000),
 created_at timestamptz not null default now()
);
create index vocab_reports_status_date on public.vocab_reports(status,created_at desc);
create table public.vocab_limits (
 bucket text primary key,
 hits integer not null default 1,
 expires_at timestamptz not null
);
alter table public.vocab_settings enable row level security;
alter table public.vocab_sessions enable row level security;
alter table public.vocab_words enable row level security;
alter table public.vocab_reports enable row level security;
alter table public.vocab_limits enable row level security;
revoke all on public.vocab_settings, public.vocab_sessions, public.vocab_words, public.vocab_reports, public.vocab_limits from public, anon, authenticated;
grant all on public.vocab_settings, public.vocab_sessions, public.vocab_words, public.vocab_reports, public.vocab_limits to service_role;
create function public.vocab_take_limit(bucket_key text, bucket_expiry timestamptz, maximum integer)
returns boolean language plpgsql security invoker set search_path='' as $$
declare hit_count integer;
begin
 delete from public.vocab_limits where expires_at < now();
 insert into public.vocab_limits(bucket,hits,expires_at) values(bucket_key,1,bucket_expiry)
 on conflict(bucket) do update set hits=public.vocab_limits.hits+1 returning hits into hit_count;
 return hit_count <= maximum;
end;
$$;
revoke all on function public.vocab_take_limit(text,timestamptz,integer) from public,anon,authenticated;
grant execute on function public.vocab_take_limit(text,timestamptz,integer) to service_role;
