-- =====================================================================
-- Cada projeto passa a pertencer a UM bimestre (e tem 1 documento).
-- O semestre continua existindo, preenchido sozinho a partir do bimestre.
-- Rodar UMA vez no SQL Editor do Supabase.
-- =====================================================================

alter table public.projeto
  add column bimestre smallint check (bimestre between 1 and 4);

-- Projetos já existentes: usa o bimestre do documento enviado, se houver;
-- senão, o primeiro bimestre do semestre.
update public.projeto p
set bimestre = coalesce(
  (select min(d.bimestre) from public.documento d where d.projeto_id = p.id),
  case p.semestre when 1 then 1 else 3 end
);

alter table public.projeto alter column bimestre set not null;

-- Semestre derivado do bimestre (1–2 → 1º semestre, 3–4 → 2º semestre).
create function public.semestre_do_bimestre() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.semestre := case when new.bimestre <= 2 then 1 else 2 end;
  return new;
end;
$$;

create trigger semestre before insert or update on public.projeto
  for each row execute function public.semestre_do_bimestre();

-- O documento precisa ser do mesmo bimestre do projeto.
create or replace function public.checa_bimestre() returns trigger
language plpgsql set search_path = '' as $$
declare b smallint;
begin
  select bimestre into b from public.projeto where id = new.projeto_id;
  if new.bimestre <> b then
    raise exception 'O documento precisa ser do % bimestre do projeto', b;
  end if;
  return new;
end;
$$;
