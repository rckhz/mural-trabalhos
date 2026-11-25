import { CabecalhoPainel } from "../cabecalho";
import { ListaProjetos } from "@/components/lista-projetos";
import { NovoProjeto } from "@/components/novo-projeto";
import { SeletorTurma } from "@/components/seletor-turma";
import styles from "../painel.module.css";
import { exigir } from "@/lib/sessao";
import { buscarTurmas, rotuloTurma } from "@/lib/turmas";

export default async function ProjetosPainel({ searchParams }: { searchParams: Promise<{ turma?: string }> }) {
  const { supabase, perfil } = await exigir("professora");
  const { turma } = await searchParams;

  const turmas = await buscarTurmas(supabase);
  const sel = turmas.find((t) => t.id === turma) ?? turmas[0];
  const { data: projetos } = sel
    ? await supabase
        .from("projeto")
        .select("id, titulo, semestre, status, disciplina")
        .eq("turma_id", sel.id)
        .order("semestre")
        .order("criado_em")
    : { data: [] };

  return (
    <>
      <CabecalhoPainel atual="Projetos" nome={perfil.nome} turma={sel?.id} />
      <main id="conteudo" className={styles.main}>

        <h1>Projetos</h1>

        <SeletorTurma turmas={turmas} sel={sel} base="/painel/projetos" />

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
          <ListaProjetos titulo={sel ? rotuloTurma(sel) : "Nenhuma turma"} projetos={projetos ?? []} />
          <NovoProjeto key={sel?.id} turmas={turmas} turmaPadrao={sel?.id} />
        </div>
      </main>
    </>
  );
}
