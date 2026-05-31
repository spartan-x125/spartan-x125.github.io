create table if not exists public.article_like_counts (
  post_key text primary key,
  like_count integer not null default 0 check (like_count >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.article_like_votes (
  post_key text not null references public.article_like_counts(post_key) on delete cascade,
  visitor_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (post_key, visitor_id)
);

alter table public.article_like_counts enable row level security;
alter table public.article_like_votes enable row level security;

drop policy if exists "Public like counts are readable" on public.article_like_counts;
create policy "Public like counts are readable"
  on public.article_like_counts
  for select
  to anon
  using (true);

create or replace function public.toggle_article_like(target_post_key text, target_visitor_id uuid)
returns table (like_count integer, liked boolean)
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.article_like_counts (post_key)
  values (target_post_key)
  on conflict (post_key) do nothing;

  if exists (
    select 1
    from public.article_like_votes
    where post_key = target_post_key and visitor_id = target_visitor_id
  ) then
    delete from public.article_like_votes
    where post_key = target_post_key and visitor_id = target_visitor_id;

    update public.article_like_counts
    set like_count = greatest(like_count - 1, 0), updated_at = now()
    where post_key = target_post_key;

    return query
    select counts.like_count, false
    from public.article_like_counts as counts
    where counts.post_key = target_post_key;
  else
    insert into public.article_like_votes (post_key, visitor_id)
    values (target_post_key, target_visitor_id);

    update public.article_like_counts
    set like_count = like_count + 1, updated_at = now()
    where post_key = target_post_key;

    return query
    select counts.like_count, true
    from public.article_like_counts as counts
    where counts.post_key = target_post_key;
  end if;
end;
$$;

create or replace function public.get_article_like(target_post_key text, target_visitor_id uuid)
returns table (like_count integer, liked boolean)
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.article_like_counts (post_key)
  values (target_post_key)
  on conflict (post_key) do nothing;

  return query
  select
    counts.like_count,
    exists (
      select 1
      from public.article_like_votes
      where post_key = target_post_key and visitor_id = target_visitor_id
    )
  from public.article_like_counts as counts
  where counts.post_key = target_post_key;
end;
$$;

revoke all on public.article_like_counts from anon;
revoke all on public.article_like_votes from anon;
revoke execute on function public.toggle_article_like(text, uuid) from public;
revoke execute on function public.get_article_like(text, uuid) from public;
grant select on public.article_like_counts to anon;
grant execute on function public.toggle_article_like(text, uuid) to anon;
grant execute on function public.get_article_like(text, uuid) to anon;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'article_like_counts'
  ) then
    alter publication supabase_realtime add table public.article_like_counts;
  end if;
end;
$$;
