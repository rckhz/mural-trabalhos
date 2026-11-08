"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { salvarDados } from "@/lib/acoes-projeto";
import { classeCampo } from "@/lib/projetos";

type Dados = { id: string; titulo: string; semestre: number; disciplina: string | null; descricao: string | null };

export function FormDados({ projeto }: { projeto: Dados }) {
  const [estado, enviar, pendente] = useActionState(salvarDados, null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg"><h2>Sobre o projeto</h2></CardTitle>
      </CardHeader>
      <CardContent>
        <form action={enviar} className="grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="id" value={projeto.id} />
          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="titulo">Título</Label>
            <Input id="titulo" name="titulo" defaultValue={projeto.titulo} required minLength={3} maxLength={120} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="semestre">Semestre</Label>
            <select id="semestre" name="semestre" defaultValue={String(projeto.semestre)} className={classeCampo}>
              {[1, 2].map((s) => <option key={s} value={s}>{s}º semestre</option>)}
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="disciplina">Disciplina (opcional)</Label>
            <Input id="disciplina" name="disciplina" defaultValue={projeto.disciplina ?? ""} maxLength={60} className="uppercase" />
          </div>
          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="descricao">Descrição</Label>
            <textarea
              id="descricao"
              name="descricao"
              rows={6}
              maxLength={3000}
              defaultValue={projeto.descricao ?? ""}
              className={classeCampo}
              placeholder="Conte o objetivo do trabalho, como foi feito e o que a turma aprendeu."
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
            <Button type="submit" disabled={pendente}>
              <Save />
              {pendente ? "Salvando..." : "Salvar"}
            </Button>
            {estado?.ok && !pendente && <span className="text-sm text-muted-foreground">Salvo!</span>}
            {estado?.erro && <span role="alert" className="text-sm text-destructive">{estado.erro}</span>}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
