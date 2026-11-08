import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import type { Turma } from "@/lib/turmas";

// Abas do painel: primeiro o ano letivo, depois as 6 turmas daquele ano.
export function SeletorTurma({ turmas, sel, base }: { turmas: Turma[]; sel?: Turma; base: string }) {
  const anos = [...new Set(turmas.map((t) => t.ano_letivo))].sort((a, b) => b - a);
  const doAno = turmas.filter((t) => t.ano_letivo === sel?.ano_letivo);

  // Ao trocar de ano, tenta manter a mesma turma (ex.: 2º MIN de 2026 → 2º MIN de 2025).
  const turmaDoAno = (ano: number) =>
    turmas.find((t) => t.ano_letivo === ano && t.serie === sel?.serie && t.nome === sel?.nome) ??
    turmas.find((t) => t.ano_letivo === ano);

  return (
    <div className="mt-4 grid gap-3">
      <nav className="flex flex-wrap items-center gap-2" aria-label="Ano letivo">
        <span className="text-sm text-muted-foreground">Ano:</span>
        {anos.map((a) => {
          const ativo = a === sel?.ano_letivo;
          return (
            <Link
              key={a}
              href={`${base}?turma=${turmaDoAno(a)?.id}`}
              aria-current={ativo ? "page" : undefined}
              className={buttonVariants({ variant: ativo ? "secondary" : "ghost", size: "sm" })}
            >
              {a}
            </Link>
          );
        })}
      </nav>
      <nav className="flex flex-wrap gap-2" aria-label="Turmas">
        {doAno.map((t) => (
          <Link
            key={t.id}
            href={`${base}?turma=${t.id}`}
            aria-current={t.id === sel?.id ? "page" : undefined}
            className={buttonVariants({ variant: t.id === sel?.id ? "default" : "outline", size: "sm" })}
          >
            {t.serie}º {t.nome}
          </Link>
        ))}
      </nav>
    </div>
  );
}
