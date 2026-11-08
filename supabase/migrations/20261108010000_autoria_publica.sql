-- =====================================================================
-- Nome de quem criou e de quem editou por último, visível no mural.
-- Gravado pelo banco a partir da sessão (ninguém consegue editar).
-- Rodar UMA vez no SQL Editor, DEPOIS de 20261108000000_projeto_por_bimestre.sql.
-- =====================================================================

alter table public.projeto
  add column criado_por_nome text,
  add column atualizado_por_nome text;

update public.projeto p set
  criado_por_nome = (select nome from public.perfil where id = p.criado_por),
  atualizado_por_nome = (select nome from public.perfil where id = p.atualizado_por);

create or replace function public.marca_autoria() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  quem uuid := auth.uid();
  nome_quem text;
begin
  -- Ações feitas pelo servidor (sem usuário logado) não mudam a autoria.
  if quem is null then
    return new;
  end if;

  -- Só mudar a situação (publicar/ocultar) não conta como edição.
  if tg_table_name = 'projeto' and tg_op = 'UPDATE' then
    if new.status is distinct from old.status
       and (new.titulo, new.descricao, new.disciplina, new.bimestre)
           is not distinct from (old.titulo, old.descricao, old.disciplina, old.bimestre) then
      return new;
    end if;
  end if;

  new.atualizado_por := quem;
  new.atualizado_em  := now();

  if tg_table_name = 'projeto' then
    select nome into nome_quem from public.perfil where id = quem;
    new.atualizado_por_nome := nome_quem;
    if tg_op = 'INSERT' then
      new.criado_por      := quem;
      new.criado_em       := now();
      new.criado_por_nome := nome_quem;
    end if;
  end if;

  return new;
end;
$$;
