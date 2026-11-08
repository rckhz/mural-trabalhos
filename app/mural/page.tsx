import Link from "next/link";
import { supabaseServidor } from "@/lib/supabase/servidor";

type Params = Promise<Record<string, string | string[] | undefined>>;
const um = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function Mural({ searchParams }: { searchParams: Params }) {
  const sp = await searchParams;
  const f = {
    ano: um(sp.ano),
    serie: um(sp.serie),
    turma: um(sp.turma),
    semestre: um(sp.semestre),
    disciplina: um(sp.disciplina),
    q: um(sp.q).trim(),
  };

  const supabase = await supabaseServidor();

  const [{ data: anos }, { data: comDisciplina }] = await Promise.all([
    supabase.from("ano_letivo").select("ano, atual").order("ano", { ascending: false }),
    supabase.from("projeto").select("disciplina").eq("status", "publicado").not("disciplina", "is", null),
  ]);
  const anoPadrao = String(anos?.find((a) => a.atual)?.ano ?? anos?.[0]?.ano ?? "");
  const ano = f.ano || anoPadrao;
  const disciplinas = [...new Set((comDisciplina ?? []).map((p) => p.disciplina as string))].sort();

  let consulta = supabase
    .from("projeto")
    .select("id, titulo, disciplina, semestre, criado_em, turma!inner(serie, nome, ano_letivo)")
    .eq("status", "publicado")
    .order("criado_em", { ascending: false });
  if (ano && ano !== "todos") consulta = consulta.eq("turma.ano_letivo", ano);
  if (f.serie) consulta = consulta.eq("turma.serie", f.serie);
  if (f.turma) consulta = consulta.eq("turma.nome", f.turma);
  if (f.semestre) consulta = consulta.eq("semestre", f.semestre);
  if (f.disciplina) consulta = consulta.eq("disciplina", f.disciplina);
  if (f.q) consulta = consulta.textSearch("busca", f.q, { type: "websearch", config: "portuguese" });

  const { data: projetos, error } = await consulta;
  const filtrando = Boolean(f.serie || f.turma || f.semestre || f.disciplina || f.q || (f.ano && f.ano !== anoPadrao));

  return (
    <main className="pagina">
      <Link href="/" className="voltar">← Início</Link>
      <h1>Mural de projetos</h1>
      <p className="subtitulo">Os mais recentes aparecem primeiro.</p>

      <form className="filtros" action="/mural" role="search">
        <label className="busca">
          Buscar
          <input type="search" name="q" defaultValue={f.q} placeholder="Título ou descrição" />
        </label>
        <label>
          Ano letivo
          <select name="ano" defaultValue={ano}>
            <option value="todos">Todos</option>
            {anos?.map((a) => <option key={a.ano} value={a.ano}>{a.ano}</option>)}
          </select>
        </label>
        <label>
          Série
          <select name="serie" defaultValue={f.serie}>
            <option value="">Todas</option>
            <option value="1">1º ano</option>
            <option value="2">2º ano</option>
            <option value="3">3º ano</option>
          </select>
        </label>
        <label>
          Turma
          <select name="turma" defaultValue={f.turma}>
            <option value="">Todas</option>
            <option value="MIL">MIL</option>
            <option value="MIN">MIN</option>
          </select>
        </label>
        <label>
          Semestre
          <select name="semestre" defaultValue={f.semestre}>
            <option value="">Todos</option>
            <option value="1">1º semestre</option>
            <option value="2">2º semestre</option>
          </select>
        </label>
        {disciplinas.length > 0 && (
          <label>
            Disciplina
            <select name="disciplina" defaultValue={f.disciplina}>
              <option value="">Todas</option>
              {disciplinas.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>
        )}
        <div className="acoes">
          <button className="botao" type="submit">Filtrar</button>
          {filtrando && <Link href="/mural">Limpar filtros</Link>}
        </div>
      </form>

      {error ? (
        <p className="vazio">Não foi possível carregar o mural. Tente novamente em instantes.</p>
      ) : !projetos?.length ? (
        <p className="vazio">Nenhum projeto encontrado{filtrando ? " com esses filtros" : " ainda"}.</p>
      ) : (
        <ul className="cards">
          {projetos.map((p) => {
            const t = p.turma as unknown as { serie: number; nome: string };
            return (
              <li key={p.id}>
                <Link href={`/projeto/${p.id}`} className="card">
                  <span className="meta">{t.serie}º {t.nome} · {p.semestre}º semestre</span>
                  <h2>{p.titulo}</h2>
                  {p.disciplina && <span className="tag">{p.disciplina}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
