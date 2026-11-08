import { CabecalhoArea } from "@/components/cabecalho-area";
import { ListaProjetos } from "@/components/lista-projetos";
import { NovoProjeto } from "@/components/novo-projeto";
import { exigir } from "@/lib/sessao";
import { rotuloTurma, type Turma } from "@/lib/turmas";

export default async function Sala() {
  const { supabase, perfil } = await exigir("aluno");

  const [{ data: turma }, { data: projetos }] = await Promise.all([
    supabase.from("turma").select("id, serie, nome, ano_letivo").eq("id", perfil.turma_id!).maybeSingle<Turma>(),
    supabase
      .from("projeto")
      .select("id, titulo, semestre, status, disciplina")
      .eq("turma_id", perfil.turma_id!)
      .order("semestre")
      .order("criado_em"),
  ]);

  return (
    <>
      <CabecalhoArea titulo="Minha sala" nome={perfil.nome} />
      <main className="mx-auto max-w-5xl px-4 py-6 pb-16">
        <h1 className="text-2xl font-semibold tracking-tight">{turma ? rotuloTurma(turma) : "Minha sala"}</h1>
        <p className="mt-1 text-muted-foreground">
          Projetos da sua turma. Rascunhos só aparecem para a sala e os professores.
        </p>
        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_380px]">
          <ListaProjetos titulo="Projetos da sala" projetos={projetos ?? []} />
          <NovoProjeto />
        </div>
      </main>
    </>
  );
}
