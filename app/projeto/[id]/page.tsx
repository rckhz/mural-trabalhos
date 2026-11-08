import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServidor } from "@/lib/supabase/servidor";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const UMA_HORA = 3600;

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
    .select("id, titulo, descricao, disciplina, semestre, status, turma(serie, nome, ano_letivo)")
    .eq("id", id)
    .maybeSingle();
  if (!projeto) notFound();

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
    <main className="pagina">
      <Link href="/mural" className="voltar">← Voltar ao mural</Link>
      <p className="meta">
        {t.serie}º {t.nome} · {t.ano_letivo} · {projeto.semestre}º semestre
        {projeto.disciplina && ` · ${projeto.disciplina}`}
        {projeto.status !== "publicado" && <span className="selo">{projeto.status}</span>}
      </p>
      <h1>{projeto.titulo}</h1>

      <section className="secao" aria-labelledby="titulo-doc">
        <h2 id="titulo-doc">Documento</h2>
        {!atual ? (
          <p className="meta">Nenhum documento enviado ainda.</p>
        ) : (
          <>
            {docs!.length > 1 && (
              <nav className="abas" aria-label="Bimestres">
                {docs!.map((d) => (
                  <Link
                    key={d.bimestre}
                    href={`/projeto/${id}?b=${d.bimestre}`}
                    scroll={false}
                    aria-current={d.bimestre === atual.bimestre ? "page" : undefined}
                  >
                    {d.bimestre}º bimestre
                  </Link>
                ))}
              </nav>
            )}
            {urlDoc?.signedUrl ? (
              <>
                <iframe
                  className="pdf"
                  src={urlDoc.signedUrl}
                  title={`Documento do ${atual.bimestre}º bimestre`}
                />
                <p>
                  <a href={urlDoc.signedUrl} target="_blank" rel="noopener noreferrer">
                    Abrir documento em tela cheia
                  </a>
                  {atual.status !== "publicado" && <span className="selo">{atual.status}</span>}
                </p>
              </>
            ) : (
              <p className="meta">Não foi possível abrir o documento.</p>
            )}
          </>
        )}
      </section>

      {(projeto.descricao || fotos?.length) && (
        <section className="secao" aria-labelledby="titulo-sobre">
          <h2 id="titulo-sobre">Sobre o trabalho</h2>
          {projeto.descricao && <p className="descricao">{projeto.descricao}</p>}
          {!!fotos?.length && (
            <ul className="galeria">
              {fotos.map((f, i) => {
                const url = urlsFotos?.[i]?.signedUrl;
                if (!url) return null;
                return (
                  <li key={f.id}>
                    <figure style={{ margin: 0 }}>
                      <a href={url} target="_blank" rel="noopener noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={f.legenda || "Foto do trabalho"} loading="lazy" />
                      </a>
                      {f.legenda && <figcaption>{f.legenda}</figcaption>}
                    </figure>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
    </main>
  );
}
