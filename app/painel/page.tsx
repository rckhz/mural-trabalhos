import Link from "next/link";
import { ArrowUpRight, HardDrive } from "lucide-react";
import { areas, CabecalhoPainel } from "./cabecalho";
import styles from "./painel.module.css";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { exigir } from "@/lib/sessao";
import { LimparSoltos } from "./medidor";

// Limites do plano gratuito do Supabase.
const LIMITE_ARQUIVOS = 1024 ** 3; // 1 GB
const LIMITE_BANCO = 500 * 1024 ** 2; // 500 MB

type Bucket = { bucket: string; arquivos: number; bytes: number; soltos: number; bytes_soltos: number };
type Uso = { banco: number; buckets: Bucket[] };

function tamanho(bytes: number) {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2).replace(".", ",")} GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1).replace(".", ",")} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

function Barra({ usado, limite, rotulo }: { usado: number; limite: number; rotulo: string }) {
  const pct = Math.min(100, (usado / limite) * 100);
  const cor = pct >= 90 ? "bg-destructive" : pct >= 70 ? "bg-amber-500" : "bg-primary";
  return (
    <div className="grid gap-1.5">
      <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
        <span className="font-medium">{rotulo}</span>
        <span className="text-muted-foreground">
          {tamanho(usado)} de {tamanho(limite)} · <span className="font-medium text-foreground">{pct.toFixed(pct < 10 ? 1 : 0).replace(".", ",")}%</span>
        </span>
      </div>
      <div
        className="h-3 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-label={rotulo}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
      >
        <div className={`h-full rounded-full ${cor}`} style={{ width: `${Math.max(pct, 0.5)}%` }} />
      </div>
    </div>
  );
}

export default async function Painel() {
  const { perfil, supabase } = await exigir("professora");
  const { data, error } = await supabase.rpc("uso_armazenamento");
  const uso = data as Uso | null;

  const buckets = uso?.buckets ?? [];
  const doBucket = (nome: string) => buckets.find((b) => b.bucket === nome);
  const total = buckets.reduce((s, b) => s + Number(b.bytes), 0);
  const soltos = buckets.reduce((s, b) => s + Number(b.soltos), 0);
  const bytesSoltos = buckets.reduce((s, b) => s + Number(b.bytes_soltos), 0);
  const pct = (total / LIMITE_ARQUIVOS) * 100;

  return (
    <>
      <CabecalhoPainel nome={perfil.nome} atual="Visão geral" />
      <main id="conteudo" className={styles.main}>
        <h1>Gestão do mural</h1>
        <div className={styles.tiles}>
          {areas.map(({ href, Icone, titulo, texto }) => (
            <Link key={href} href={href} className={styles.tile}>
              <div className={styles.tileIcons}><Icone size={26} aria-hidden /><ArrowUpRight size={20} aria-hidden /></div>
              <h2>{titulo}</h2>
              <p>{texto}</p>
            </Link>
          ))}
        </div>
        <Card className="mt-6">
          <CardHeader>
            <HardDrive className="size-6 text-muted-foreground" aria-hidden />
            <CardTitle className="text-lg"><h2>Armazenamento</h2></CardTitle>
            <CardDescription>Espaço usado no plano gratuito do Supabase.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5">
            {error || !uso ? (
              <p className="text-muted-foreground">Não foi possível medir o armazenamento agora.</p>
            ) : (
              <>
                <Barra usado={total} limite={LIMITE_ARQUIVOS} rotulo="Arquivos (PDFs e fotos)" />
                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  {[
                    { nome: "Documentos (PDF)", b: doBucket("documentos") },
                    { nome: "Fotos", b: doBucket("fotos") },
                  ].map(({ nome, b }) => (
                    <div key={nome} className="rounded-lg border p-3">
                      <dt className="text-muted-foreground">{nome}</dt>
                      <dd className="font-medium">
                        {tamanho(Number(b?.bytes ?? 0))} · {b?.arquivos ?? 0} arquivo(s)
                      </dd>
                    </div>
                  ))}
                </dl>
                {pct >= 70 && (
                  <p role="alert" className={`text-sm ${pct >= 90 ? "text-destructive" : "text-amber-600 dark:text-amber-400"}`}>
                    {pct >= 90
                      ? "O espaço está quase acabando. Quando chegar a 100%, ninguém consegue enviar arquivos novos."
                      : "Mais de 70% do espaço já foi usado. Vale começar a planejar (ex.: guardar uma cópia e apagar arquivos de anos antigos)."}
                  </p>
                )}
                {soltos > 0 && (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted/50 p-3 text-sm">
                    <p>
                      <span className="font-medium">{soltos} arquivo(s) solto(s)</span> ({tamanho(bytesSoltos)}): sobras de
                      envios antigos que nenhum projeto usa mais.
                    </p>
                    <LimparSoltos quantidade={soltos} tamanho={tamanho(bytesSoltos)} />
                  </div>
                )}
                <Barra usado={Number(uso.banco)} limite={LIMITE_BANCO} rotulo="Banco de dados (textos, contas)" />
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
