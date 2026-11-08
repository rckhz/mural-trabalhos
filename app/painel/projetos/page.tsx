import { CabecalhoArea } from "@/components/cabecalho-area";
import { ListaProjetos } from "@/components/lista-projetos";
import { NovoProjeto } from "@/components/novo-projeto";
import { SeletorTurma } from "@/components/seletor-turma";
import { Voltar } from "@/components/voltar";
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
      <CabecalhoArea titulo="Painel do professor" nome={perfil.nome} />
      <main className="mx-auto max-w-5xl px-4 py-6 pb-16">
        <Voltar href="/painel">Painel</Voltar>
        <h1 className="text-2xl font-semibold tracking-tight">Projetos</h1>

        <SeletorTurma turmas={turmas} sel={sel} base="/painel/projetos" />

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_380px]">
          <ListaProjetos titulo={sel ? rotuloTurma(sel) : "Nenhuma turma"} projetos={projetos ?? []} />
          <NovoProjeto key={sel?.id} turmas={turmas} turmaPadrao={sel?.id} />
        </div>
      </main>
    </>
  );
}
