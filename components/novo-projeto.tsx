"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { criarProjeto } from "@/lib/acoes-projeto";
import { enviarCapa } from "@/lib/capa";
import { classeCampo } from "@/lib/projetos";
import type { Turma } from "@/lib/turmas";
import { CamposTurma } from "@/components/campos-turma";
import { CampoCapa } from "@/components/campo-capa";
import { SeletorCor } from "@/components/seletor-cor";

// turmas: só para o professor (o aluno sempre cria na própria sala).
export function NovoProjeto({ turmas, turmaPadrao }: { turmas?: Turma[]; turmaPadrao?: string }) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  // Projeto já criado, mas a capa falhou: mostra o link para continuar mesmo assim.
  const [criado, setCriado] = useState<string | null>(null);
  const [capa, setCapa] = useState<File | null>(null);

  async function enviar(form: FormData) {
    setErro(null);
    setEnviando(true);
    const r = await criarProjeto(null, form);
    if (r?.erro || !r?.id) {
      setErro(r?.erro ?? "Não foi possível criar o projeto.");
      setEnviando(false);
      return;
    }
    const id = r.id;

    if (capa) {
      const erroCapa = await enviarCapa(id, capa);
      if (erroCapa) {
        setErro(`O projeto foi criado, mas a capa não foi salva. ${erroCapa} Continue e envie a capa depois.`);
        setCriado(id);
        setEnviando(false);
        return;
      }
    }
    router.push(`/projeto/${id}/editar`);
  }

  function aoEnviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (enviando) return;
    void enviar(new FormData(e.currentTarget));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg"><h2>Novo projeto</h2></CardTitle>
        <CardDescription>Depois de criar, você envia o documento, o slide e as fotos.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={aoEnviar} className="grid gap-5">
          {turmas && <CamposTurma turmas={turmas} padrao={turmaPadrao} />}

          <div className="grid gap-1.5">
            <Label htmlFor="titulo">Título</Label>
            <Input id="titulo" name="titulo" required minLength={3} maxLength={120} />
          </div>

          <div className="grid gap-1.5 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="semestre">Semestre</Label>
              <select id="semestre" name="semestre" defaultValue="1" className={classeCampo}>
                {[1, 2].map((s) => <option key={s} value={s}>{s}º semestre</option>)}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="disciplina">Disciplina (opcional)</Label>
              <Input id="disciplina" name="disciplina" maxLength={60} placeholder="Ex.: BIOLOGIA" className="uppercase" />
            </div>
          </div>

          <SeletorCor />

          <div className="grid gap-1.5">
            <span className="text-sm font-medium">Capa (opcional)</span>
            <CampoCapa onArquivo={setCapa} />
          </div>

          {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}

          {criado ? (
            <Link href={`/projeto/${criado}/editar`} className={buttonVariants({ size: "default" })}>
              Continuar para a edição
            </Link>
          ) : (
            <Button type="submit" disabled={enviando}>
              <Plus />
              {enviando ? "Criando..." : "Criar projeto"}
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
