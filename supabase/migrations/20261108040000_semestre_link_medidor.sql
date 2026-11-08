-- =====================================================================
-- 1. Projeto passa a ser de um SEMESTRE (1 ou 2), escolhido direto.
-- 2. Slide vira LINK (Google Apresentações, Canva, OneDrive...) e não
--    ocupa mais espaço. Cada projeto tem 1 documento em PDF.
-- 3. Medidor de armazenamento para o painel do professor.
-- Rodar UMA vez no SQL Editor do Supabase (pode rodar de novo sem problema).
-- =====================================================================

-- ---------- 1. Semestre ----------
-- Antes o semestre era calculado a partir do bimestre; agora é escolhido.
drop trigger if exists semestre on public.projeto;
drop function if exists public.semestre_do_bimestre();
alter table public.projeto alter column bimestre drop not null; -- fica só como histórico

-- ---------- 2. Slide como link + 1 PDF por projeto ----------
alter table public.projeto add column if not exists link_slide text;
alter table public.projeto drop constraint if exists projeto_link_slide_check;
alter table public.projeto add constraint projeto_link_slide_check
  check (link_slide is null or (link_slide ~* '^https?://' and length(link_slide) <= 500));

-- O documento não depende mais do bimestre.
drop trigger if exists bimestre on public.documento;
drop function if exists public.checa_bimestre();
alter table public.documento alter column bimestre drop not null;

-- Registros de slide em arquivo deixam de existir (os arquivos que sobrarem
-- aparecem como "arquivos soltos" no medidor e podem ser limpos por lá).
delete from public.documento where formato <> 'pdf';
-- Se algum projeto antigo tiver mais de um PDF, fica só o mais recente.
delete from public.documento d
using public.documento e
where d.projeto_id = e.projeto_id and d.formato = e.formato
  and (d.atualizado_em, d.id) < (e.atualizado_em, e.id);

alter table public.documento drop constraint if exists documento_formato_check;
alter table public.documento add constraint documento_formato_check check (formato = 'pdf');
alter table public.documento drop constraint if exists documento_projeto_bimestre_formato_key;
alter table public.documento drop constraint if exists documento_projeto_formato_key;
alter table public.documento add constraint documento_projeto_formato_key unique (projeto_id, formato);

-- O bucket volta a aceitar só PDF, até 5 MB.
update storage.buckets
set file_size_limit = 5242880, allowed_mime_types = array['application/pdf']
where id = 'documentos';

-- ---------- 3. Medidor de armazenamento ----------
-- "Solto" = arquivo no Storage que nenhum documento/foto usa (sobra de envio
-- antigo). Só conta com mais de 1 hora, para não pegar um envio em andamento.
create or replace function public.uso_armazenamento() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.eh_professora() then
    raise exception 'Acesso negado';
  end if;
  return jsonb_build_object(
    'banco', pg_database_size(current_database()),
    'buckets', coalesce((
      select jsonb_agg(jsonb_build_object(
        'bucket', b.bucket, 'arquivos', b.arquivos, 'bytes', b.bytes,
        'soltos', b.soltos, 'bytes_soltos', b.bytes_soltos))
      from (
        select o.bucket_id as bucket,
               count(*) as arquivos,
               coalesce(sum((o.metadata->>'size')::bigint), 0) as bytes,
               count(*) filter (where s.solto) as soltos,
               coalesce(sum((o.metadata->>'size')::bigint) filter (where s.solto), 0) as bytes_soltos
        from storage.objects o
        cross join lateral (select
          o.created_at < now() - interval '1 hour' and case o.bucket_id
            when 'documentos' then not exists (select 1 from public.documento d where d.arquivo = o.name)
            else not exists (select 1 from public.foto f where f.arquivo = o.name)
          end as solto) s
        where o.bucket_id in ('documentos', 'fotos')
        group by o.bucket_id
      ) b
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function public.arquivos_soltos()
returns table (bucket text, nome text)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.eh_professora() then
    raise exception 'Acesso negado';
  end if;
  return query
    select o.bucket_id::text, o.name
    from storage.objects o
    where o.bucket_id in ('documentos', 'fotos')
      and o.created_at < now() - interval '1 hour'
      and case o.bucket_id
        when 'documentos' then not exists (select 1 from public.documento d where d.arquivo = o.name)
        else not exists (select 1 from public.foto f where f.arquivo = o.name)
      end;
end;
$$;

revoke all on function public.uso_armazenamento() from public, anon;
revoke all on function public.arquivos_soltos() from public, anon;
grant execute on function public.uso_armazenamento() to authenticated;
grant execute on function public.arquivos_soltos() to authenticated;
