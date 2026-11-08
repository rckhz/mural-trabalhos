-- Cada projeto passa a ter 2 arquivos obrigatórios:
--   'pdf'   → o documento em PDF (mostrado no mural)
--   'slide' → a apresentação em PowerPoint (.pptx/.ppt/.odp), para baixar
-- Rodar UMA vez no SQL Editor do Supabase (pode rodar de novo sem problema).

alter table public.documento add column if not exists formato text not null default 'pdf';
alter table public.documento drop constraint if exists documento_formato_check;
alter table public.documento add constraint documento_formato_check check (formato in ('pdf', 'slide'));

-- Antes: 1 arquivo por bimestre. Agora: 1 de cada formato por bimestre.
alter table public.documento drop constraint if exists documento_projeto_id_bimestre_key;
alter table public.documento drop constraint if exists documento_projeto_bimestre_formato_key;
alter table public.documento
  add constraint documento_projeto_bimestre_formato_key unique (projeto_id, bimestre, formato);

-- O bucket passa a aceitar PowerPoint/LibreOffice. Limite sobe para 10 MB
-- por causa dos slides (o site continua limitando o PDF a 5 MB).
update storage.buckets
set file_size_limit = 10485760,
    allowed_mime_types = array[
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-powerpoint',
      'application/vnd.oasis.opendocument.presentation'
    ]
where id = 'documentos';
