import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Pencil } from "lucide-react";
import { podeEditar } from "@/lib/projetos";
import { sessaoAtual } from "@/lib/sessao";
import { supabaseServidor } from "@/lib/supabase/servidor";
import { Voltar } from "@/components/voltar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const UMA_HORA = 3600;
const data = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });

export default async function Projeto({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ b?: string }>;
}) {
  const { id } = await params;
  const { b } = await searchParams;
  if (!UUID.test(id)) notFound();

  const supabase = await supabaseServidor();

  // O RLS decide: visitante só enxerga projeto/documentos publicados;
  // aluno da sala e professora também veem rascunhos.
  const { data: projeto } = await supabase
    .from("projeto")
    .select(
      "id, titulo, descricao, disciplina, bimestre, status, turma_id, criado_em, atualizado_em, criado_por_nome, atualizado_por_nome, turma(serie, nome, ano_letivo)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!projeto) notFound();

  const s = await sessaoAtual();
  const editavel = s ? podeEditar(s.perfil, projeto) : false;

  const [{ data: docs }, { data: fotos }] = await Promise.all([
    supabase
      .from("documento")
      .select("bimestre, arquivo, status")
      .eq("projeto_id", id)
      .order("bimestre", { ascending: false }),
    supabase.from("foto").select("id, arquivo, legenda").eq("projeto_id", id).order("atualizado_em"),
  ]);

  const atual = docs?.find((d) => String(d.bimestre) === b) ?? docs?.[0];
  const [{ data: urlDoc }, { data: urlsFotos }] = await Promise.all([
    atual
      ? supabase.storage.from("documentos").createSignedUrl(atual.arquivo, UMA_HORA)
      : Promise.resolve({ data: null }),
    fotos?.length
      ? supabase.storage.from("fotos").createSignedUrls(fotos.map((f) => f.arquivo), UMA_HORA)
      : Promise.resolve({ data: [] as { signedUrl: string | null }[] }),
  ]);

  const t = projeto.turma as unknown as { serie: number; nome: string; ano_letivo: number };

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 pb-16">
      <div className="flex items-start justify-between gap-2">
        <Voltar href="/mural">Voltar ao mural</Voltar>
        {editavel && (
          <Link href={`/projeto/${id}/editar`} className={buttonVariants({ variant: "outline", size: "sm" })}>
            <Pencil />Editar
          </Link>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <span>{t.serie}º {t.nome} · {t.ano_letivo} · {projeto.bimestre}º bimestre</span>
        {projeto.disciplina && <Badge variant="secondary">{projeto.disciplina}</Badge>}
        {projeto.status !== "publicado" && <Badge variant="outline">{projeto.status}</Badge>}
      </div>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{projeto.titulo}</h1>

      <section className="mt-8" aria-labelledby="titulo-doc">
        <h2 id="titulo-doc" className="mb-3 text-lg font-medium">Documento</h2>
        {!atual ? (
          <p className="text-muted-foreground">Nenhum documento enviado ainda.</p>
        ) : (
          <>
            {docs!.length > 1 && (
              <nav className="mb-3 flex flex-wrap gap-2" aria-label="Bimestres">
                {docs!.map((d) => {
                  const ativo = d.bimestre === atual.bimestre;
                  return (
                    <Link
                      key={d.bimestre}
                      href={`/projeto/${id}?b=${d.bimestre}`}
                      scroll={false}
                      aria-current={ativo ? "page" : undefined}
                      className={buttonVariants({ variant: ativo ? "default" : "outline", size: "sm" })}
                    >
                      {d.bimestre}º bimestre
                    </Link>
                  );
                })}
              </nav>
            )}
            {urlDoc?.signedUrl ? (
              <>
                <iframe
                  className="h-[70vh] max-h-[720px] w-full rounded-xl border bg-card"
                  src={urlDoc.signedUrl}
                  title={`Documento do ${atual.bimestre}º bimestre`}
                />
                <div className="mt-2 flex items-center gap-2">
                  <a
                    href={urlDoc.signedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonVariants({ variant: "link" }) + " px-0"}
                  >
                    Abrir documento em tela cheia <ExternalLink />
                  </a>
                  {atual.status !== "publicado" && <Badge variant="outline">{atual.status}</Badge>}
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">Não foi possível abrir o documento.</p>
            )}
          </>
        )}
      </section>

      {(projeto.descricao || !!fotos?.length) && (
        <section className="mt-10" aria-labelledby="titulo-sobre">
          <h2 id="titulo-sobre" className="mb-3 text-lg font-medium">Sobre o trabalho</h2>
          {projeto.descricao && <p className="whitespace-pre-line leading-relaxed">{projeto.descricao}</p>}
          {!!fotos?.length && (
            <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {fotos.map((f, i) => {
                const url = urlsFotos?.[i]?.signedUrl;
                if (!url) return null;
                return (
                  <li key={f.id}>
                    <figure>
                      <a href={url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-lg">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt={f.legenda || "Foto do trabalho"}
                          loading="lazy"
                          className="aspect-4/3 w-full object-cover transition hover:scale-105"
                        />
                      </a>
                      {f.legenda && <figcaption className="mt-1 text-sm text-muted-foreground">{f.legenda}</figcaption>}
                    </figure>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {(projeto.criado_por_nome || projeto.atualizado_por_nome) && (
        <footer className="mt-12 border-t pt-4 text-sm text-muted-foreground">
          {projeto.criado_por_nome && <p>Criado por {projeto.criado_por_nome} em {data(projeto.criado_em)}</p>}
          {projeto.atualizado_por_nome && (
            <p>Última edição por {projeto.atualizado_por_nome} em {data(projeto.atualizado_em)}</p>
          )}
        </footer>
      )}
    </main>
  );
}
