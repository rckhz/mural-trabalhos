-- Cada projeto passa a ter 2 arquivos: o PDF (mostrado no mural) e o
-- documento editável (Word/ODT), para a turma ir melhorando ao longo do ano.
-- Rodar UMA vez no SQL Editor do Supabase.

alter table public.documento
  add column if not exists formato text not null default 'pdf' check (formato in ('pdf', 'word'));

-- Antes: 1 arquivo por bimestre. Agora: 1 de cada formato por bimestre.
alter table public.documento drop constraint if exists documento_projeto_id_bimestre_key;
alter table public.documento
  add constraint documento_projeto_bimestre_formato_key unique (projeto_id, bimestre, formato);

-- O bucket passa a aceitar Word (.docx/.doc) e LibreOffice (.odt). Limite continua 5 MB.
update storage.buckets
set allowed_mime_types = array[
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.oasis.opendocument.text'
]
where id = 'documentos';
