import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Eye } from "lucide-react";
import { CabecalhoArea } from "@/components/cabecalho-area";
import { Voltar } from "@/components/voltar";
import { buttonVariants } from "@/components/ui/button";
import { podeEditar } from "@/lib/projetos";
import { sessaoAtual } from "@/lib/sessao";
import { rotuloTurma, type Turma } from "@/lib/turmas";
import { Documentos } from "./documentos";
import { FormDados } from "./form-dados";
import { Fotos } from "./fotos";
import { StatusProjeto } from "./status";
import { EditorProjeto } from "./editor";

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
    .select("id, titulo, descricao, disciplina, semestre, link_slide, status, cor, capa, turma_id, turma(serie, nome, ano_letivo)")
    .eq("id", id)
    .maybeSingle();
  if (!projeto) notFound();

  const professora = perfil.funcao === "professora";
  const editavel = podeEditar(perfil, projeto);
  const turma = projeto.turma as unknown as Turma;
  const voltar = professora ? `/painel/projetos?turma=${projeto.turma_id}` : "/sala";

  // Um projeto = um documento (PDF) + o link do slide + fotos.
  const [{ data: doc }, { data: fotos }] = await Promise.all([
    supabase.from("documento").select("arquivo, atualizado_em").eq("projeto_id", id).maybeSingle(),
    supabase.from("foto").select("id, arquivo").eq("projeto_id", id).order("atualizado_em"),
  ]);
  const [{ data: urlPdf }, { data: urlsFotos }] = await Promise.all([
    doc
      ? supabase.storage.from("documentos").createSignedUrl(doc.arquivo, UMA_HORA)
      : Promise.resolve({ data: null }),
    fotos?.length
      ? supabase.storage.from("fotos").createSignedUrls(fotos.map((f) => f.arquivo), UMA_HORA)
      : Promise.resolve({ data: [] as { signedUrl: string | null }[] }),
  ]);

  // Capa: bucket privado, então um link temporário (1 h).
  const { data: urlCapa } = projeto.capa
    ? await supabase.storage.from("capas").createSignedUrl(projeto.capa, UMA_HORA)
    : { data: null };

  return (
    <>
      <CabecalhoArea titulo={professora ? "Painel do professor" : "Minha sala"} nome={perfil.nome} />
      <main className="mx-auto max-w-6xl px-4 py-6 pb-16">
        <div className="flex items-center justify-between gap-3">
          <Voltar href={voltar}>Projetos</Voltar>
          <Link href={`/projeto/${id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
            <Eye />Ver como no mural
          </Link>
        </div>

        {!editavel ? (
          <p className="mt-6 text-muted-foreground">
            Este projeto foi ocultado pelo professor e não pode ser editado no momento.
          </p>
        ) : (
          <div className="mt-4">
            <EditorProjeto
              projetoId={id}
              titulo={projeto.titulo}
              rotuloTurma={rotuloTurma(turma)}
              semestre={projeto.semestre}
              corSalva={projeto.cor}
              capaSalvaUrl={urlCapa?.signedUrl ?? null}
              temCapa={Boolean(projeto.capa)}
              temPdf={Boolean(doc)}
              temSlide={Boolean(projeto.link_slide)}
              publicado={projeto.status === "publicado"}
              temDescricao={Boolean(projeto.descricao)}
              temFotos={(fotos ?? []).length > 0}
              sobre={<FormDados projeto={projeto} />}
              documentos={
                <Documentos
                  projetoId={id}
                  pdf={{ url: urlPdf?.signedUrl ?? null, enviadoEm: doc ? formatarData(doc.atualizado_em) : null }}
                  linkSlide={projeto.link_slide}
                />
              }
              fotos={
                <Fotos
                  projetoId={id}
                  fotos={(fotos ?? []).map((f, i) => ({ id: f.id, url: urlsFotos?.[i]?.signedUrl ?? null }))}
                />
              }
              situacao={<StatusProjeto id={id} status={projeto.status} professora={professora} />}
            />
          </div>
        )}
      </main>
    </>
  );
}
