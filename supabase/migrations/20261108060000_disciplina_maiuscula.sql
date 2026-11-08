-- Disciplinas já cadastradas passam para maiúsculas (o site já salva assim
-- daqui em diante), para "ea", "Ea" e "EA" aparecerem iguais no mural.
update public.projeto
set disciplina = upper(regexp_replace(btrim(disciplina), '\s+', ' ', 'g'))
where disciplina is not null;
