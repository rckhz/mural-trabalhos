import { redirect } from "next/navigation";
import { FormularioAcao } from "@/components/formulario-acao";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trocarSenha } from "@/lib/acoes-sessao";
import { sessaoAtual } from "@/lib/sessao";

export default async function TrocarSenha() {
  const s = await sessaoAtual();
  if (!s) redirect("/entrar");

  return (
    <main className="mx-auto max-w-sm px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl"><h1>Crie sua senha</h1></CardTitle>
          <CardDescription>
            Olá, {s.perfil.nome.split(" ")[0]}! Troque a senha temporária por uma só sua, com pelo menos 8 caracteres.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormularioAcao
            acao={trocarSenha}
            botao="Salvar senha"
            campos={[
              { nome: "senha", rotulo: "Nova senha", tipo: "password", autoComplete: "new-password" },
              { nome: "confirma", rotulo: "Repita a nova senha", tipo: "password", autoComplete: "new-password" },
            ]}
          />
        </CardContent>
      </Card>
    </main>
  );
}
