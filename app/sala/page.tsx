import { CabecalhoArea } from "@/components/cabecalho-area";
import { exigir } from "@/lib/sessao";

// Provisório: envio de documentos e fotos entra no próximo passo.
export default async function Sala() {
  const { supabase, perfil } = await exigir("aluno");
  const { data: turma } = await supabase
    .from("turma")
    .select("serie, nome, ano_letivo")
    .eq("id", perfil.turma_id!)
    .single();

  return (
    <>
      <CabecalhoArea titulo="Minha sala" nome={perfil.nome} />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          {turma ? `${turma.serie}º ${turma.nome} · ${turma.ano_letivo}` : "Minha sala"}
        </h1>
        <p className="mt-2 text-muted-foreground">Em breve: projetos da sala e envio de documentos e fotos.</p>
      </main>
    </>
  );
}
