"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { criarProjeto } from "@/lib/acoes-projeto";
import { classeCampo } from "@/lib/projetos";
import type { Turma } from "@/lib/turmas";
import { CamposTurma } from "@/components/campos-turma";

// turmas: só para o professor (o aluno sempre cria na própria sala).
export function NovoProjeto({ turmas, turmaPadrao }: { turmas?: Turma[]; turmaPadrao?: string }) {
  const [erro, enviar, pendente] = useActionState(criarProjeto, null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg"><h2>Novo projeto</h2></CardTitle>
        <CardDescription>Depois de criar, você envia o documento, o slide e as fotos.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={enviar} className="grid gap-4">
          {turmas && <CamposTurma turmas={turmas} padrao={turmaPadrao} />}
          <div className="grid gap-1.5">
            <Label htmlFor="titulo">Título</Label>
            <Input id="titulo" name="titulo" required minLength={3} maxLength={120} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="semestre">Semestre</Label>
            <select id="semestre" name="semestre" defaultValue="1" className={classeCampo}>
              {[1, 2].map((s) => <option key={s} value={s}>{s}º semestre</option>)}
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="disciplina">Disciplina (opcional)</Label>
            <Input id="disciplina" name="disciplina" maxLength={60} placeholder="Ex.: Biologia" />
          </div>
          {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}
          <Button type="submit" disabled={pendente}>
            <Plus />
            {pendente ? "Criando..." : "Criar projeto"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
