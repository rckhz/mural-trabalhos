import { Folder } from "lucide-react";
import { CabecalhoPainel } from "../cabecalho";
import styles from "../painel.module.css";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { exigir } from "@/lib/sessao";
import { NovoAno, RemoverAno } from "./formularios";

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

export default async function Anos() {
  const { supabase, perfil } = await exigir("professora");

  const [{ data: anos }, { data: projetos }, { data: contas }] = await Promise.all([
    supabase.from("ano_letivo").select("ano").order("ano", { ascending: false }),
    supabase.from("projeto").select("turma!inner(ano_letivo)"),
    supabase.from("perfil").select("turma!inner(ano_letivo)"),
  ]);
  const contar = (lista: { turma: unknown }[] | null, ano: number) =>
    (lista ?? []).filter((p) => (p.turma as { ano_letivo: number }).ano_letivo === ano).length;
  const sugestao = Math.max(new Date().getFullYear(), ...(anos ?? []).map((a) => a.ano + 1));

  return (
    <>
      <CabecalhoPainel atual="Anos letivos" nome={perfil.nome} />
      <main id="conteudo" className={styles.main}>

        <h1>Anos letivos</h1>
        <p className="mt-1 text-muted-foreground">
          Cada ano vira uma pasta no mural, com as turmas 1º, 2º e 3º (MIL e MIN) dentro.
        </p>

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg"><h2>Anos criados</h2></CardTitle>
            </CardHeader>
            <CardContent>
              {!anos?.length ? (
                <p className="text-muted-foreground">Nenhum ano criado ainda.</p>
              ) : (
                <ul className="divide-y">
                  {anos.map(({ ano }) => {
                    const p = contar(projetos, ano);
                    const c = contar(contas, ano);
                    return (
                      <li key={ano} className="flex flex-wrap items-center gap-3 py-3">
                        <Folder className="size-6 text-primary" aria-hidden />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{ano}</p>
                          <p className="text-sm text-muted-foreground">
                            6 turmas · {plural(p, "projeto", "projetos")} · {plural(c, "conta", "contas")}
                          </p>
                        </div>
                        {p === 0 && c === 0 && <RemoverAno ano={ano} />}
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg"><h2>Novo ano letivo</h2></CardTitle>
              <CardDescription>As 6 turmas do ano são criadas junto, automaticamente.</CardDescription>
            </CardHeader>
            <CardContent>
              <NovoAno key={sugestao} sugestao={sugestao} />
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
