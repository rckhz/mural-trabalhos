import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, FileText, Pencil, Presentation } from "lucide-react";
import { podeEditar } from "@/lib/projetos";
import { sessaoAtual } from "@/lib/sessao";
import { supabaseServidor } from "@/lib/supabase/servidor";
import { Voltar } from "@/components/voltar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const UMA_HORA = 3600;

// O banco já só aceita http(s), mas confere de novo antes de virar link na página.
const linkSeguro = (link: string | null) => (link && /^https?:\/\//i.test(link) ? link : null);
const data = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });

export default async function Projeto({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const supabase = await supabaseServidor();

  // O RLS decide: visitante só enxerga projeto/documentos publicados;
  // aluno da sala e professora também veem rascunhos.
  const { data: projeto } = await supabase
    .from("projeto")
    .select(
      "id, titulo, descricao, disciplina, semestre, link_slide, status, cor, capa, turma_id, criado_em, atualizado_em, criado_por_nome, atualizado_por_nome, turma(serie, nome, ano_letivo)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!projeto) notFound();

  const t = projeto.turma as unknown as { serie: number; nome: string; ano_letivo: number };
  const s = await sessaoAtual();
  const editavel = s ? podeEditar(s.perfil, projeto) : false;

  const [{ data: doc }, { data: fotos }] = await Promise.all([
    supabase.from("documento").select("arquivo, status").eq("projeto_id", id).maybeSingle(),
    supabase.from("foto").select("id, arquivo, legenda").eq("projeto_id", id).order("atualizado_em"),
  ]);

  const slide = linkSeguro(projeto.link_slide);
  const [{ data: urlDoc }, { data: urlsFotos }, { data: urlCapa }] = await Promise.all([
    doc
      ? supabase.storage.from("documentos").createSignedUrl(doc.arquivo, UMA_HORA)
      : Promise.resolve({ data: null }),
    fotos?.length
      ? supabase.storage.from("fotos").createSignedUrls(fotos.map((f) => f.arquivo), UMA_HORA)
      : Promise.resolve({ data: [] as { signedUrl: string | null }[] }),
    projeto.capa
      ? supabase.storage.from("capas").createSignedUrl(projeto.capa, UMA_HORA)
      : Promise.resolve({ data: null }),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 pb-16">
      <div className="flex items-center justify-between gap-2">
        <Voltar href={`/mural?ano=${t.ano_letivo}&serie=${t.serie}&turma=${t.nome}`}>Voltar ao mural</Voltar>
        {editavel && (
          <Link href={`/projeto/${id}/editar`} className={buttonVariants({ variant: "outline", size: "sm" })}>
            <Pencil />Editar
          </Link>
        )}
      </div>

      <article className="mt-4 overflow-hidden rounded-2xl border border-black/10 bg-card shadow-sm">
        <div className="relative h-44 w-full sm:h-56" style={{ backgroundColor: projeto.cor }}>
          {urlCapa?.signedUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={urlCapa.signedUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
          )}
        </div>

        <div className="grid gap-4 p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <span>{t.serie}º {t.nome} · {t.ano_letivo}</span>
            <span className="size-1 rounded-full bg-current opacity-50" aria-hidden />
            <span>{projeto.semestre}º semestre</span>
            {projeto.disciplina && <Badge variant="secondary">{projeto.disciplina}</Badge>}
            {projeto.status !== "publicado" && <Badge variant="outline">{projeto.status}</Badge>}
          </div>

          <h1 className="text-2xl font-semibold leading-tight tracking-tight sm:text-4xl">{projeto.titulo}</h1>

          {slide && (
            <div>
              <a href={slide} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "default" })}>
                <Presentation />Abrir slide <ExternalLink />
              </a>
            </div>
          )}
        </div>
      </article>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_17rem] lg:items-start">
        <div className="grid min-w-0 gap-10">
          <section aria-labelledby="titulo-doc" className="grid gap-3">
            <h2 id="titulo-doc" className="flex items-center gap-2 text-lg font-semibold">
              <FileText className="size-5 text-primary" aria-hidden />Documento
            </h2>
            {!doc ? (
              <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
                Nenhum documento enviado ainda.
              </p>
            ) : urlDoc?.signedUrl ? (
              <>
                <iframe
                  className="h-[70vh] max-h-[720px] w-full rounded-xl border bg-card"
                  src={urlDoc.signedUrl}
                  title={`Documento: ${projeto.titulo}`}
                />
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <a
                    href={urlDoc.signedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonVariants({ variant: "link" }) + " px-0"}
                  >
                    Abrir documento em tela cheia <ExternalLink />
                  </a>
                  {doc.status !== "publicado" && <Badge variant="outline">{doc.status}</Badge>}
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">Não foi possível abrir o documento.</p>
            )}
          </section>

          {(projeto.descricao || !!fotos?.length) && (
            <section aria-labelledby="titulo-sobre" className="grid gap-4">
              <h2 id="titulo-sobre" className="text-lg font-semibold">Sobre o trabalho</h2>
              {projeto.descricao && (
                <p className="whitespace-pre-line text-[15px] leading-relaxed text-foreground/90">{projeto.descricao}</p>
              )}
              {!!fotos?.length && (
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {fotos.map((f, i) => {
                    const url = urlsFotos?.[i]?.signedUrl;
                    if (!url) return null;
                    return (
                      <li key={f.id}>
                        <figure className="grid gap-1.5">
                          <a href={url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-xl ring-1 ring-black/10">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={url}
                              alt={f.legenda || "Foto do trabalho"}
                              loading="lazy"
                              className="aspect-4/3 w-full object-cover transition duration-300 hover:scale-105"
                            />
                          </a>
                          {f.legenda && <figcaption className="text-sm text-muted-foreground">{f.legenda}</figcaption>}
                        </figure>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          )}
        </div>

        <aside className="grid gap-4 rounded-xl border border-black/10 bg-card p-5 text-sm shadow-sm lg:sticky lg:top-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sobre este trabalho</h2>
          <dl className="grid gap-3">
            <div>
              <dt className="text-muted-foreground">Turma</dt>
              <dd className="font-medium">{t.serie}º {t.nome} · {t.ano_letivo}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Semestre</dt>
              <dd className="font-medium">{projeto.semestre}º semestre</dd>
            </div>
            {projeto.disciplina && (
              <div>
                <dt className="text-muted-foreground">Disciplina</dt>
                <dd className="font-medium">{projeto.disciplina}</dd>
              </div>
            )}
          </dl>

          {(projeto.criado_por_nome || projeto.atualizado_por_nome) && (
            <div className="grid gap-1 border-t pt-4 text-xs text-muted-foreground">
              {projeto.criado_por_nome && <p>Criado por {projeto.criado_por_nome} em {data(projeto.criado_em)}</p>}
              {projeto.atualizado_por_nome && (
                <p>Última edição por {projeto.atualizado_por_nome} em {data(projeto.atualizado_em)}</p>
              )}
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
