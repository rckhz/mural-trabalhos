import Link from "next/link";
import { FolderKanban, Users } from "lucide-react";
import { CabecalhoArea } from "@/components/cabecalho-area";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { exigir } from "@/lib/sessao";

const secoes = [
  { href: "/painel/alunos", Icone: Users, titulo: "Alunos", texto: "Cadastrar, gerar nova senha e desativar contas" },
  { href: "/painel/projetos", Icone: FolderKanban, titulo: "Projetos", texto: "Criar, publicar e ocultar projetos das turmas" },
];

export default async function Painel() {
  const { perfil } = await exigir("professora");
  return (
    <>
      <CabecalhoArea titulo="Painel do professor" nome={perfil.nome} />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <h1 className="text-2xl font-semibold tracking-tight">Gestão</h1>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {secoes.map(({ href, Icone, titulo, texto }) => {
            const card = (
              <Card className={href ? "h-full transition group-hover:ring-foreground/30" : "h-full opacity-60"}>
                <CardHeader>
                  <Icone className="size-6 text-muted-foreground" aria-hidden />
                  <CardTitle className="text-lg"><h2>{titulo}</h2></CardTitle>
                  <CardDescription>{texto}</CardDescription>
                </CardHeader>
              </Card>
            );
            return href ? (
              <Link key={titulo} href={href} className="group rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                {card}
              </Link>
            ) : (
              <div key={titulo}>{card}</div>
            );
          })}
        </div>
      </main>
    </>
  );
}
