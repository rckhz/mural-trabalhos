import Link from "next/link";
import { GraduationCap, School } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const opcoes = [
  { href: "/mural", Icone: GraduationCap, titulo: "Sou aluno", texto: "Ver o mural de projetos" },
  { href: "/painel", Icone: School, titulo: "Sou professor", texto: "Entrar na área de gestão" },
];

export default function Inicio() {
  return (
    <main className="grid min-h-dvh content-center gap-8 px-4 py-12 text-center">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Mural de Trabalhos</h1>
        <p className="text-muted-foreground">Projetos das turmas do Ensino Médio</p>
      </div>
      <div className="mx-auto grid w-full max-w-xl gap-4 sm:grid-cols-2">
        {opcoes.map(({ href, Icone, titulo, texto }) => (
          <Link
            key={href}
            href={href}
            className="group rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <Card className="h-full transition group-hover:ring-foreground/30">
              <CardHeader className="justify-items-center gap-2 py-4">
                <Icone className="size-8 text-muted-foreground" aria-hidden />
                <CardTitle className="text-lg">{titulo}</CardTitle>
                <CardDescription>{texto}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
