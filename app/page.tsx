import Link from "next/link";

export default function Inicio() {
  return (
    <main className="inicio">
      <h1>Mural de Trabalhos</h1>
      <p className="subtitulo">Projetos das turmas do Ensino Médio</p>
      <div className="escolhas">
        <Link href="/mural" className="escolha">
          Sou aluno
          <small>Ver o mural de projetos</small>
        </Link>
        <Link href="/entrar" className="escolha">
          Sou professor
          <small>Entrar na área de gestão</small>
        </Link>
      </div>
    </main>
  );
}
