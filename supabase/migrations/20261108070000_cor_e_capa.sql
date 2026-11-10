-- Cor do cabeçalho e capa (imagem opcional) de cada projeto.

alter table public.projeto
  add column cor text not null default '#128242' check (cor ~ '^#[0-9a-fA-F]{6}$'),
  add column capa text check (capa is null or length(capa) <= 200);

-- Bucket privado para as capas: 1 MB, só imagem (a foto já vem reduzida do navegador).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('capas', 'capas', false, 1048576, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

-- Ler: quem pode editar o projeto, ou qualquer pessoa se o projeto estiver publicado.
create policy "capas: ler" on storage.objects for select to anon, authenticated
  using (
    bucket_id = 'capas' and (
      public.pode_editar_projeto(public.pasta_projeto(objects.name))
      or exists (select 1 from public.projeto p where p.capa = objects.name and p.status = 'publicado')
    )
  );

create policy "capas: enviar" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'capas'
    and public.pode_editar_projeto(public.pasta_projeto(name))
  );

create policy "capas: apagar" on storage.objects for delete to authenticated
  using (
    bucket_id = 'capas'
    and public.pode_editar_projeto(public.pasta_projeto(name))
  );
