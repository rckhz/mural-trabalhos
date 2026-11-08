import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Eye } from "lucide-react";
import { CabecalhoArea } from "@/components/cabecalho-area";
import { Voltar } from "@/components/voltar";
import { buttonVariants } from "@/components/ui/button";
import { bimestresDo, podeEditar } from "@/lib/projetos";
import { sessaoAtual } from "@/lib/sessao";
import { rotuloTurma, type Turma } from "@/lib/turmas";
import { Documentos } from "./documentos";
import { FormDados } from "./form-dados";
import { Fotos } from "./fotos";
import { StatusProjeto } from "./status";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const UMA_HORA = 3600;
const formatarData = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });

export default async function EditarProjeto({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const s = await sessaoAtual();
  if (!s) redirect("/entrar");
  if (s.perfil.deve_trocar_senha) redirect("/trocar-senha");
  const { supabase, perfil } = s;

  // O RLS só devolve o projeto se a pessoa puder vê-lo.
  const { data: projeto } = await supabase
    .from("projeto")
    .select("id, titulo, descricao, disciplina, semestre, status, turma_id, turma(serie, nome, ano_letivo)")
    .eq("id", id)
    .maybeSingle();
  if (!projeto) notFound();

  const professora = perfil.funcao === "professora";
  const editavel = podeEditar(perfil, projeto);
  const turma = projeto.turma as unknown as Turma;
  const voltar = professora ? `/painel/projetos?turma=${projeto.turma_id}` : "/sala";

  const [{ data: docs }, { data: fotos }] = await Promise.all([
    supabase.from("documento").select("bimestre, arquivo, atualizado_em").eq("projeto_id", id),
    supabase.from("foto").select("id, arquivo").eq("projeto_id", id).order("atualizado_em"),
  ]);
  const [{ data: urlsDocs }, { data: urlsFotos }] = await Promise.all([
    docs?.length
      ? supabase.storage.from("documentos").createSignedUrls(docs.map((d) => d.arquivo), UMA_HORA)
      : Promise.resolve({ data: [] as { signedUrl: string | null }[] }),
    fotos?.length
      ? supabase.storage.from("fotos").createSignedUrls(fotos.map((f) => f.arquivo), UMA_HORA)
      : Promise.resolve({ data: [] as { signedUrl: string | null }[] }),
  ]);

  const itensDocs = bimestresDo(projeto.semestre).map((bimestre) => {
    const i = docs?.findIndex((d) => d.bimestre === bimestre) ?? -1;
    return {
      bimestre,
      url: i >= 0 ? (urlsDocs?.[i]?.signedUrl ?? null) : null,
      enviadoEm: i >= 0 ? formatarData(docs![i].atualizado_em) : null,
    };
  });

  return (
    <>
      <CabecalhoArea titulo={professora ? "Painel do professor" : "Minha sala"} nome={perfil.nome} />
      <main className="mx-auto max-w-5xl px-4 py-6 pb-16">
        <Voltar href={voltar}>Projetos</Voltar>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">{rotuloTurma(turma)} · {projeto.semestre}º semestre</p>
            <h1 className="text-2xl font-semibold tracking-tight">{projeto.titulo}</h1>
          </div>
          <Link href={`/projeto/${id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
            <Eye />Ver como no mural
          </Link>
        </div>

        {!editavel ? (
          <p className="mt-6 text-muted-foreground">
            Este projeto foi ocultado pelo professor e não pode ser editado no momento.
          </p>
        ) : (
          <div className="mt-6 grid gap-6">
            <StatusProjeto id={id} status={projeto.status} professora={professora} />
            <FormDados projeto={projeto} />
            <Documentos projetoId={id} itens={itensDocs} />
            <Fotos
              projetoId={id}
              fotos={(fotos ?? []).map((f, i) => ({ id: f.id, url: urlsFotos?.[i]?.signedUrl ?? null }))}
            />
          </div>
        )}
      </main>
    </>
  );
}
