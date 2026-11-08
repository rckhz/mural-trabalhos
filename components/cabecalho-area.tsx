import Link from "next/link";
import { LogOut } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { sair } from "@/lib/acoes-sessao";

// Cabeçalho das áreas logadas (painel da professora e sala do aluno).
export function CabecalhoArea({ titulo, nome }: { titulo: string; nome: string }) {
  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-3">
        <div>
          <p className="font-medium">{titulo}</p>
          <p className="text-sm text-muted-foreground">{nome}</p>
        </div>
        <nav className="flex items-center gap-1">
          <Link href="/mural" className={buttonVariants({ variant: "ghost", size: "sm" })}>Mural</Link>
          <form action={sair}>
            <Button type="submit" variant="outline" size="sm"><LogOut />Sair</Button>
          </form>
        </nav>
      </div>
    </header>
  );
}
