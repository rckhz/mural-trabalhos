"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { criarProjeto } from "@/lib/acoes-projeto";
import { classeCampo } from "@/lib/projetos";

// turmas: só para o professor (o aluno sempre cria na própria sala).
export function NovoProjeto({
  turmas,
  turmaPadrao,
}: {
  turmas?: { id: string; rotulo: string }[];
  turmaPadrao?: string;
}) {
  const [erro, enviar, pendente] = useActionState(criarProjeto, null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg"><h2>Novo projeto</h2></CardTitle>
        <CardDescription>Depois de criar, você envia o documento do bimestre e as fotos.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={enviar} className="grid gap-4">
          {turmas && (
            <div className="grid gap-1.5">
              <Label htmlFor="turma_id">Turma</Label>
              <select id="turma_id" name="turma_id" defaultValue={turmaPadrao} className={classeCampo} required>
                {turmas.map((t) => <option key={t.id} value={t.id}>{t.rotulo}</option>)}
              </select>
            </div>
          )}
          <div className="grid gap-1.5">
            <Label htmlFor="titulo">Título</Label>
            <Input id="titulo" name="titulo" required minLength={3} maxLength={120} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="bimestre">Bimestre</Label>
            <select id="bimestre" name="bimestre" defaultValue="1" className={classeCampo}>
              {[1, 2, 3, 4].map((b) => <option key={b} value={b}>{b}º bimestre</option>)}
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
