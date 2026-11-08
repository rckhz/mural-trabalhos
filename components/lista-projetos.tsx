import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Item = { id: string; titulo: string; semestre: number; status: string; disciplina: string | null };

const selo: Record<string, { texto: string; variante: "default" | "secondary" | "destructive" }> = {
  publicado: { texto: "publicado", variante: "default" },
  rascunho: { texto: "rascunho", variante: "secondary" },
  oculto: { texto: "oculto", variante: "destructive" },
};

export function ListaProjetos({ titulo, projetos }: { titulo: string; projetos: Item[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg"><h2>{titulo}</h2></CardTitle>
      </CardHeader>
      <CardContent>
        {!projetos.length ? (
          <p className="text-muted-foreground">Nenhum projeto ainda.</p>
        ) : (
          <ul className="divide-y">
            {projetos.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/projeto/${p.id}/editar`}
                  className="flex items-center justify-between gap-3 rounded-md py-3 outline-none hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{p.titulo}</p>
                    <p className="text-sm text-muted-foreground">
                      {p.semestre}º semestre{p.disciplina && ` · ${p.disciplina}`}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant={selo[p.status]?.variante ?? "secondary"}>{selo[p.status]?.texto ?? p.status}</Badge>
                    <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
