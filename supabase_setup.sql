-- Run once in the Supabase SQL Editor for the Waste Pollution photo wall.
-- Public visitors can add and view photos, but cannot update or delete them.
-- This deliberately refuses to turn an existing private bucket public.

do $$
begin
  if exists (
    select 1 from storage.buckets
    where id = 'clean-up-photos' and public = false
  ) then
    raise exception 'The clean-up-photos bucket already exists and is private. Review it in Storage before changing its visibility.';
  end if;
end;
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'clean-up-photos',
  'clean-up-photos',
  true,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do nothing;

create table if not exists public.community_photos (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null unique,
  caption text not null default '',
  created_at timestamptz not null default now(),
  constraint community_photos_caption_length check (char_length(caption) <= 100),
  constraint community_photos_storage_path_format check (
    storage_path ~ '^[0-9a-f-]{36}\.(jpg|png|webp)$'
  )
);

alter table public.community_photos enable row level security;
grant select, insert on public.community_photos to anon;

drop policy if exists "waste_photo_public_read" on public.community_photos;
create policy "waste_photo_public_read"
  on public.community_photos for select to anon using (true);

drop policy if exists "waste_photo_public_submit" on public.community_photos;
create policy "waste_photo_public_submit"
  on public.community_photos for insert to anon
  with check (
    char_length(caption) <= 100
    and storage_path ~ '^[0-9a-f-]{36}\.(jpg|png|webp)$'
  );

-- Public bucket URLs work without exposing Storage object listings.
drop policy if exists "waste_photo_storage_public_list" on storage.objects;

drop policy if exists "waste_photo_storage_public_upload" on storage.objects;
create policy "waste_photo_storage_public_upload"
  on storage.objects for insert to anon
  with check (
    bucket_id = 'clean-up-photos'
    and name ~ '^[0-9a-f-]{36}\.(jpg|png|webp)$'
  );
