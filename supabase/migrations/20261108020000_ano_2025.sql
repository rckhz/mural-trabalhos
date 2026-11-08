-- Ano letivo de 2025 (anterior) com as 6 turmas, para aparecer como pasta no mural.
-- 2026 continua sendo o ano atual.
insert into public.ano_letivo (ano, atual) values (2025, false)
on conflict (ano) do nothing;

insert into public.turma (ano_letivo, serie, nome)
select 2025, s, n from generate_series(1, 3) s, unnest(array['MIL', 'MIN']) n
on conflict (ano_letivo, serie, nome) do nothing;
