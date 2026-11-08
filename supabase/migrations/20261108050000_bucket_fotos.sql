-- Garante que o bucket de fotos aceite WebP: o site converte toda foto para
-- WebP (mais leve) antes de enviar; JPEG fica de reserva para o Safari.
update storage.buckets
set allowed_mime_types = array['image/webp', 'image/jpeg', 'image/png'],
    file_size_limit = 1048576 -- 1 MB
where id = 'fotos';
