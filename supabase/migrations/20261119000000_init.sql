-- Mellowood initial schema.
-- User data is stored as JSON documents keyed by (user_id, collection, id). This keeps the
-- client's offline queue simple (one upsert shape) while row-level security keeps every user's
-- data private.

create table if not exists public.documents (
  user_id    uuid        not null references auth.users (id) on delete cascade,
  collection text        not null check (collection ~ '^[a-z][a-z0-9_-]{0,40}$'),
  id         text        not null check (char_length(id) between 1 and 200),
  data       jsonb       not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, collection, id)
);

create index if not exists documents_user_collection_idx on public.documents (user_id, collection);

alter table public.documents enable row level security;

create policy "documents: owner can read"
  on public.documents for select using (auth.uid() = user_id);
create policy "documents: owner can insert"
  on public.documents for insert with check (auth.uid() = user_id);
create policy "documents: owner can update"
  on public.documents for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "documents: owner can delete"
  on public.documents for delete using (auth.uid() = user_id);

-- Shared cache of AI-generated graphs (no personal data). Readable by any signed-in user;
-- written only by the `ai` edge function using the service role.
create table if not exists public.graph_cache (
  goal_key   text        primary key,
  graph      jsonb       not null,
  created_at timestamptz not null default now()
);

alter table public.graph_cache enable row level security;

create policy "graph_cache: signed-in users can read"
  on public.graph_cache for select to authenticated using (true);

-- Lets a user delete their own account (MEL-27). Runs with definer rights so it can remove the
-- auth.users row; documents cascade, and storage objects are removed by the client first.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;
