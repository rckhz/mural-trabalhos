import { CabecalhoArea } from "@/components/cabecalho-area";
import { exigir } from "@/lib/sessao";

// Provisório: cadastro de alunos e gestão de projetos entram nos próximos passos.
export default async function Painel() {
  const { perfil } = await exigir("professora");
  return (
    <>
      <CabecalhoArea titulo="Painel da professora" nome={perfil.nome} />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <h1 className="text-2xl font-semibold tracking-tight">Gestão</h1>
        <p className="mt-2 text-muted-foreground">Em breve: alunos, projetos e moderação do mural.</p>
      </main>
    </>
  );
}
