"use client";

import { useActionState, useState } from "react";
import { Copy, Printer, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cadastrarAlunos } from "./acoes";

const classeCampo =
  "w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

export function CadastroAlunos({
  turmas,
  turmaPadrao,
}: {
  turmas: { id: string; rotulo: string }[];
  turmaPadrao?: string;
}) {
  const [estado, enviar, pendente] = useActionState(cadastrarAlunos, null);
  const [tipo, setTipo] = useState<"aluno" | "professor">("aluno");
  const criados = estado?.resultado.filter((r) => r.senha) ?? [];

  const copiar = () =>
    navigator.clipboard.writeText(
      ["Nome\tE-mail\tSenha inicial", ...criados.map((r) => `${r.nome}\t${r.email}\t${r.senha}`)].join("\n"),
    );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg"><h2>Cadastrar contas</h2></CardTitle>
        <CardDescription>
          Uma linha por pessoa, no formato <code>Nome; e-mail</code>. Também dá para colar duas colunas de uma planilha.
          A senha inicial é o que vem antes do @ (no mínimo 6 caracteres, completando com números).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={enviar} className="grid gap-4">
          <fieldset className="grid gap-1.5">
            <legend className="mb-1.5 text-sm font-medium">Tipo de conta</legend>
            <input type="hidden" name="tipo" value={tipo} />
            <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1" role="radiogroup">
              {(["aluno", "professor"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  role="radio"
                  aria-checked={tipo === t}
                  onClick={() => setTipo(t)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium outline-none transition focus-visible:ring-3 focus-visible:ring-ring/50 ${
                    tipo === t ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t === "aluno" ? "Aluno" : "Professor"}
                </button>
              ))}
            </div>
            {tipo === "professor" && (
              <p className="text-sm text-muted-foreground">
                Professores não ficam em turma e têm acesso total ao painel (alunos, projetos e contas).
              </p>
            )}
          </fieldset>
          {tipo === "aluno" && (
            <div className="grid gap-1.5">
              <Label htmlFor="turma_id">Turma</Label>
              <select id="turma_id" name="turma_id" defaultValue={turmaPadrao} className={classeCampo} required>
                {turmas.map((t) => <option key={t.id} value={t.id}>{t.rotulo}</option>)}
              </select>
            </div>
          )}
          <div className="grid gap-1.5">
            <Label htmlFor="lista">{tipo === "aluno" ? "Alunos" : "Professores"}</Label>
            <textarea
              id="lista"
              name="lista"
              rows={8}
              required
              className={classeCampo + " font-mono"}
              placeholder={"Ana Souza; ana.souza@escola.com\nBruno Lima; bruno.lima@escola.com"}
            />
          </div>
          {estado?.erro && <p role="alert" className="text-sm text-destructive">{estado.erro}</p>}
          <Button type="submit" disabled={pendente}>
            <UserPlus />
            {pendente ? "Cadastrando..." : "Cadastrar"}
          </Button>
        </form>

        {!!estado?.resultado.length && (
          <div id="impressao" className="mt-6 grid gap-3">
            <p className="text-sm font-medium">
              No primeiro acesso, cada pessoa entra com a senha abaixo e cria uma senha própria.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-muted-foreground">
                  <tr><th className="py-1 pr-3 font-medium">Nome</th><th className="py-1 pr-3 font-medium">E-mail</th><th className="py-1 font-medium">Senha</th></tr>
                </thead>
                <tbody>
                  {estado.resultado.map((r, i) => (
                    <tr key={i} className="border-t">
                      <td className="py-1.5 pr-3">{r.nome}</td>
                      <td className="py-1.5 pr-3">{r.email}</td>
                      <td className="py-1.5">
                        {r.senha ? <code className="font-mono">{r.senha}</code> : <span className="text-destructive">{r.erro}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {criados.length > 0 && (
              <div className="flex gap-2 print:hidden">
                <Button type="button" variant="outline" onClick={copiar}><Copy />Copiar</Button>
                <Button type="button" variant="outline" onClick={() => window.print()}><Printer />Imprimir</Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
