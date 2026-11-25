import Link from "next/link";
import { ArrowRight, ArrowUpRight, FolderOpen, LibraryBig, LogIn } from "lucide-react";
import styles from "./inicio.module.css";

export default function Inicio() {
  return (
    <div className={styles.page}>
      <a href="#inicio" className={styles.skip}>Pular para o conteúdo</a>
      <header className={styles.header}>
        <span className={styles.school}><FolderOpen aria-hidden /> ETEC Dra. Ruth Cardoso</span>
        <Link href="/entrar" className={styles.login}><LogIn size={17} aria-hidden /> Entrar</Link>
      </header>
      <main id="inicio" className={styles.main}>
        <section aria-labelledby="titulo" className={styles.hero} data-enter>
          <div className={styles.intro}>
            <p className={styles.kicker}>Ensino Médio</p>
            <h1 id="titulo">Mural de Trabalhos</h1>
            <p className={styles.lead}>Explore os documentos, slides e fotos dos projetos das turmas da ETEC Dra. Ruth Cardoso.</p>
            <Link href="/mural" className={styles.action}>Ver o mural <ArrowRight size={18} aria-hidden /></Link>
          </div>
          <nav className={styles.archive} aria-label="Explorar projetos por série">
            <h2><LibraryBig size={19} aria-hidden /> Explorar por série</h2>
            <div className={styles.folders}>
              {[1, 2, 3].map((serie) => (
                <Link key={serie} href={`/mural?serie=${serie}`} className={styles.folder} aria-label={`Ver trabalhos do ${serie}º ano`}>
                  <span className={styles.tab} aria-hidden />
                  <span className={styles.folderTitle}>{serie}º ano</span>
                  <span className={styles.folderFoot}>MIL e MIN <ArrowUpRight size={19} aria-hidden /></span>
                </Link>
              ))}
            </div>
          </nav>
        </section>
      </main>
    </div>
  );
}
