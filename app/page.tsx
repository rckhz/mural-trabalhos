import Link from "next/link";
import { ArrowRight, LogIn } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

// Página inicial: apresenta o site e leva ao mural. Não mostra nenhum projeto nem nome de aluno.
export default function Inicio() {
  return (
    <main className="grid min-h-dvh place-items-center px-6 py-16 text-center">
      <div className="grid max-w-3xl justify-items-center gap-6">
        <p className="text-sm font-semibold tracking-[0.25em] text-muted-foreground uppercase">
          ETEC Dra. Ruth Cardoso
        </p>
        <h1 className="text-5xl font-bold leading-[1.05] tracking-tight text-primary sm:text-7xl">
          Mural de Trabalhos
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          Os projetos das turmas do Ensino Médio, reunidos num só lugar: documentos, slides e fotos de cada trabalho.
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <Link href="/mural" className={buttonVariants({ size: "lg" })}>
            Ver o mural <ArrowRight />
          </Link>
          <Link href="/entrar" className={buttonVariants({ variant: "outline", size: "lg" })}>
            <LogIn />Entrar
          </Link>
        </div>
      </div>
    </main>
  );
}
