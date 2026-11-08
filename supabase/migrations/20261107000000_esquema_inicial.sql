-- =====================================================================
-- Site de projetos escolares — esquema inicial
-- Rodar no SQL Editor do Supabase (ou `supabase db push`).
--
-- Regras de acesso:
--   visitante  → lê só projetos publicados (documentos publicados + fotos)
--   aluno      → lê tudo da própria sala; cria/edita projetos, documentos
--                e fotos da própria sala (nunca de outra, nunca "oculto")
--   professora → tudo
--
-- Convenção de caminhos no Storage (a 1ª pasta é sempre o id do projeto):
--   documentos/{projeto_id}/b{bimestre}-{timestamp}.pdf
--   fotos/{projeto_id}/{uuid}.webp
-- =====================================================================

-- ---------- Tipos ----------
create type public.funcao_conta as enum ('professora', 'aluno');
create type public.status_pub   as enum ('rascunho', 'publicado', 'oculto');

-- ---------- Tabelas ----------
create table public.ano_letivo (
  ano   smallint primary key check (ano between 2020 and 2100),
  atual boolean not null default false
);
create unique index so_um_ano_atual on public.ano_letivo (atual) where atual;

create table public.turma (
  id         uuid primary key default gen_random_uuid(),
  ano_letivo smallint not null references public.ano_letivo (ano),
  serie      smallint not null check (serie between 1 and 3),
  nome       text not null check (nome in ('MIL', 'MIN')),
  unique (ano_letivo, serie, nome)
);

create table public.perfil (
  id                uuid primary key references auth.users (id) on delete cascade,
  nome              text not null check (char_length(nome) between 2 and 120),
  funcao            public.funcao_conta not null,
  turma_id          uuid references public.turma (id),
  ativo             boolean not null default true,
  deve_trocar_senha boolean not null default true,
  check (funcao = 'professora' or turma_id is not null)
);
create index on public.perfil (turma_id);

create table public.projeto (
  id             uuid primary key default gen_random_uuid(),
  turma_id       uuid not null references public.turma (id),
  semestre       smallint not null check (semestre in (1, 2)),
  titulo         text not null check (char_length(titulo) between 3 and 120),
  descricao      text check (char_length(descricao) <= 3000),
  disciplina     text,
  tipo           text,
  status         public.status_pub not null default 'rascunho',
  criado_por     uuid references public.perfil (id) on delete set null,
  criado_em      timestamptz not null default now(),
  atualizado_por uuid references public.perfil (id) on delete set null,
  atualizado_em  timestamptz not null default now(),
  busca tsvector generated always as (
    to_tsvector('portuguese'::regconfig, coalesce(titulo, '') || ' ' || coalesce(descricao, ''))
  ) stored
);
create index on public.projeto (turma_id);
create index on public.projeto (criado_em desc) where status = 'publicado';
create index on public.projeto using gin (busca);

-- 1 documento por bimestre; um novo envio SUBSTITUI o arquivo (economiza Storage).
create table public.documento (
  id             uuid primary key default gen_random_uuid(),
  projeto_id     uuid not null references public.projeto (id) on delete cascade,
  bimestre       smallint not null check (bimestre between 1 and 4),
  arquivo        text not null unique,
  status         public.status_pub not null default 'rascunho',
  atualizado_por uuid references public.perfil (id) on delete set null,
  atualizado_em  timestamptz not null default now(),
  unique (projeto_id, bimestre)
);

create table public.foto (
  id             uuid primary key default gen_random_uuid(),
  projeto_id     uuid not null references public.projeto (id) on delete cascade,
  arquivo        text not null unique,
  legenda        text check (char_length(legenda) <= 300),
  atualizado_por uuid references public.perfil (id) on delete set null,
  atualizado_em  timestamptz not null default now()
);
create index on public.foto (projeto_id);

-- ---------- Funções auxiliares (security definer evita recursão de RLS) ----------
create function public.eh_professora() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.perfil
    where id = auth.uid() and funcao = 'professora' and ativo
  );
$$;

create function public.minha_turma() returns uuid
language sql stable security definer set search_path = '' as $$
  select turma_id from public.perfil
  where id = auth.uid() and funcao = 'aluno' and ativo;
$$;

create function public.da_minha_turma(p uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.projeto where id = p and turma_id = public.minha_turma()
  );
$$;

create function public.projeto_publicado(p uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.projeto where id = p and status = 'publicado');
$$;

-- Professora: qualquer projeto. Aluno: projetos da própria sala que não estejam ocultos.
create function public.pode_editar_projeto(p uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.eh_professora() or exists (
    select 1 from public.projeto
    where id = p and turma_id = public.minha_turma() and status <> 'oculto'
  );
$$;

-- Extrai o projeto_id da 1ª pasta do caminho; null se não for uuid.
create function public.pasta_projeto(caminho text) returns uuid
language plpgsql immutable set search_path = '' as $$
begin
  return (storage.foldername(caminho))[1]::uuid;
exception when others then
  return null;
end;
$$;

-- Chamado pelo app logo depois de supabase.auth.updateUser({ password }).
create function public.marcar_senha_trocada() returns void
language sql security definer set search_path = '' as $$
  update public.perfil set deve_trocar_senha = false where id = auth.uid();
$$;

-- ---------- Triggers ----------
-- Autoria sempre vem do token, nunca do que o cliente envia.
create function public.marca_autoria() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.atualizado_por := auth.uid();
  new.atualizado_em  := now();
  if tg_op = 'INSERT' and tg_table_name = 'projeto' then
    new.criado_por := auth.uid();
    new.criado_em  := now();
  end if;
  return new;
end;
$$;

create trigger autoria before insert or update on public.projeto
  for each row execute function public.marca_autoria();
create trigger autoria before insert or update on public.documento
  for each row execute function public.marca_autoria();
create trigger autoria before insert or update on public.foto
  for each row execute function public.marca_autoria();

-- 1º semestre → bimestres 1 e 2; 2º semestre → bimestres 3 e 4.
create function public.checa_bimestre() returns trigger
language plpgsql set search_path = '' as $$
declare s smallint;
begin
  select semestre into s from public.projeto where id = new.projeto_id;
  if (s = 1 and new.bimestre not in (1, 2)) or (s = 2 and new.bimestre not in (3, 4)) then
    raise exception 'O bimestre % não pertence ao % semestre do projeto', new.bimestre, s;
  end if;
  return new;
end;
$$;

create trigger bimestre before insert or update on public.documento
  for each row execute function public.checa_bimestre();

-- ---------- RLS ----------
alter table public.ano_letivo enable row level security;
alter table public.turma      enable row level security;
alter table public.perfil     enable row level security;
alter table public.projeto    enable row level security;
alter table public.documento  enable row level security;
alter table public.foto       enable row level security;

grant select on public.ano_letivo, public.turma, public.projeto, public.documento, public.foto
  to anon, authenticated;
grant select, insert, update, delete
  on public.ano_letivo, public.turma, public.perfil, public.projeto, public.documento, public.foto
  to authenticated;

-- ano_letivo / turma: leitura pública, escrita só professora
create policy "ano_letivo: ler"      on public.ano_letivo for select to anon, authenticated using (true);
create policy "ano_letivo: gerenciar" on public.ano_letivo for all to authenticated
  using (public.eh_professora()) with check (public.eh_professora());

create policy "turma: ler"      on public.turma for select to anon, authenticated using (true);
create policy "turma: gerenciar" on public.turma for all to authenticated
  using (public.eh_professora()) with check (public.eh_professora());

-- perfil: nomes NUNCA públicos; aluno vê a si e aos colegas de sala
create policy "perfil: ler" on public.perfil for select to authenticated
  using (id = auth.uid() or public.eh_professora() or turma_id = public.minha_turma());
create policy "perfil: gerenciar" on public.perfil for all to authenticated
  using (public.eh_professora()) with check (public.eh_professora());

-- projeto
create policy "projeto: ler" on public.projeto for select to anon, authenticated
  using (status = 'publicado' or public.eh_professora() or turma_id = public.minha_turma());
create policy "projeto: criar" on public.projeto for insert to authenticated
  with check (public.eh_professora() or (turma_id = public.minha_turma() and status <> 'oculto'));
create policy "projeto: editar" on public.projeto for update to authenticated
  using      (public.eh_professora() or (turma_id = public.minha_turma() and status <> 'oculto'))
  with check (public.eh_professora() or (turma_id = public.minha_turma() and status <> 'oculto'));
create policy "projeto: apagar" on public.projeto for delete to authenticated
  using (public.eh_professora());

-- documento
create policy "documento: ler" on public.documento for select to anon, authenticated
  using (
    public.eh_professora()
    or public.da_minha_turma(projeto_id)
    or (status = 'publicado' and public.projeto_publicado(projeto_id))
  );
create policy "documento: criar" on public.documento for insert to authenticated
  with check (public.pode_editar_projeto(projeto_id) and (status <> 'oculto' or public.eh_professora()));
create policy "documento: editar" on public.documento for update to authenticated
  using      (public.pode_editar_projeto(projeto_id) and (status <> 'oculto' or public.eh_professora()))
  with check (public.pode_editar_projeto(projeto_id) and (status <> 'oculto' or public.eh_professora()));
create policy "documento: apagar" on public.documento for delete to authenticated
  using (public.pode_editar_projeto(projeto_id));

-- foto (segue a visibilidade do projeto)
create policy "foto: ler" on public.foto for select to anon, authenticated
  using (
    public.eh_professora()
    or public.da_minha_turma(projeto_id)
    or public.projeto_publicado(projeto_id)
  );
create policy "foto: criar"  on public.foto for insert to authenticated
  with check (public.pode_editar_projeto(projeto_id));
create policy "foto: editar" on public.foto for update to authenticated
  using (public.pode_editar_projeto(projeto_id)) with check (public.pode_editar_projeto(projeto_id));
create policy "foto: apagar" on public.foto for delete to authenticated
  using (public.pode_editar_projeto(projeto_id));

-- ---------- Storage ----------
-- Buckets privados com limite de tamanho e tipo validados pelo próprio Supabase.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('documentos', 'documentos', false, 5242880, array['application/pdf']),               -- 5 MB
  ('fotos',      'fotos',      false, 1048576, array['image/webp', 'image/jpeg', 'image/png']); -- 1 MB

-- Ler: quem pode editar o projeto, ou quem pode ver a linha correspondente
-- (a subconsulta respeita o RLS de documento/foto, então rascunho não vaza).
create policy "arquivos: ler" on storage.objects for select to anon, authenticated
  using (
    bucket_id in ('documentos', 'fotos') and (
      public.pode_editar_projeto(public.pasta_projeto(objects.name))
      or (bucket_id = 'documentos' and exists (select 1 from public.documento d where d.arquivo = objects.name))
      or (bucket_id = 'fotos'      and exists (select 1 from public.foto f      where f.arquivo = objects.name))
    )
  );

create policy "arquivos: enviar" on storage.objects for insert to authenticated
  with check (
    bucket_id in ('documentos', 'fotos')
    and public.pode_editar_projeto(public.pasta_projeto(name))
  );

create policy "arquivos: apagar" on storage.objects for delete to authenticated
  using (
    bucket_id in ('documentos', 'fotos')
    and public.pode_editar_projeto(public.pasta_projeto(name))
  );

-- ---------- Dados iniciais ----------
insert into public.ano_letivo (ano, atual) values (2026, true);
insert into public.turma (ano_letivo, serie, nome)
select 2026, s, n from generate_series(1, 3) s, unnest(array['MIL', 'MIN']) n;

-- Primeira professora (fazer uma vez, à mão):
--   1. Dashboard → Authentication → Users → Add user (marcar "Auto Confirm User")
--   2. Rodar:
--      insert into public.perfil (id, nome, funcao, deve_trocar_senha)
--      select id, 'Nome da Professora', 'professora', false
--      from auth.users where email = 'email-da-professora@exemplo.com';
