import Link from "next/link";
import { ArrowUpRight, CalendarDays, FolderKanban, LayoutDashboard, LibraryBig, LogOut, Users } from "lucide-react";
import { sair } from "@/lib/acoes-sessao";
import styles from "./painel.module.css";

export const areas = [
  { href: "/painel/projetos", titulo: "Projetos", Icone: FolderKanban, texto: "Crie trabalhos e escolha quais aparecem no mural." },
  { href: "/painel/alunos", titulo: "Alunos", Icone: Users, texto: "Cadastre contas, redefina senhas e ajuste os acessos." },
  { href: "/painel/anos", titulo: "Anos letivos", Icone: CalendarDays, texto: "Organize as seis turmas de cada ano letivo." },
] as const;

const inicio = { href: "/painel", titulo: "Visão geral", Icone: LayoutDashboard };

export function CabecalhoPainel({ nome, atual, turma }: {
  nome: string;
  atual: typeof inicio.titulo | typeof areas[number]["titulo"];
  turma?: string;
}) {
  return (
    <header className={styles.header}>
      <a className={styles.skip} href="#conteudo">Pular para o conteúdo</a>
      <div className={styles.bar}>
        <Link href="/painel" className={styles.brand}>
          <LibraryBig aria-hidden size={24} />
          <span>Painel do professor<small>ETEC Dra. Ruth Cardoso</small></span>
        </Link>
        <div className={styles.account}>
          <span>{nome}</span>
          <Link href="/mural">Ver mural <ArrowUpRight aria-hidden size={16} /></Link>
          <form action={sair}><button type="submit"><LogOut aria-hidden size={16} /> Sair</button></form>
        </div>
      </div>
      <nav className={styles.nav} aria-label="Seções do painel">
        {[inicio, ...areas].map(({ href, titulo, Icone }) => (
          <Link key={href} href={turma && (href === "/painel/projetos" || href === "/painel/alunos") ? `${href}?turma=${encodeURIComponent(turma)}` : href}
            aria-current={titulo === atual ? "page" : undefined}>
            <Icone aria-hidden size={16} /> {titulo}
          </Link>
        ))}
      </nav>
    </header>
  );
}
