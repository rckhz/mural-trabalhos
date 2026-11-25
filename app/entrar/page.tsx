import { redirect } from "next/navigation";
import { Voltar } from "@/components/voltar";
import { FormularioAcao } from "@/components/formulario-acao";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { entrar } from "@/lib/acoes-sessao";
import { destino, sessaoAtual } from "@/lib/sessao";

export default async function Entrar() {
  const s = await sessaoAtual();
  if (s) redirect(destino(s.perfil));

  return (
    <main className="mx-auto grid min-h-svh max-w-md content-center px-5 py-16">
      <Voltar href="/mural">Mural</Voltar>
      <Card className="border-t-4 border-t-primary py-7">
        <CardHeader>
          <CardTitle className="text-3xl font-medium tracking-tight"><h1>Entrar</h1></CardTitle>
          <CardDescription>Use o e-mail e a senha que a professora passou para você.</CardDescription>
        </CardHeader>
        <CardContent>
          <FormularioAcao
            acao={entrar}
            botao="Entrar"
            campos={[
              { nome: "email", rotulo: "E-mail", tipo: "email", autoComplete: "username" },
              { nome: "senha", rotulo: "Senha", tipo: "password", autoComplete: "current-password" },
            ]}
          />
          <p className="mt-4 text-sm text-muted-foreground">Esqueceu a senha? Peça uma nova para a professora.</p>
        </CardContent>
      </Card>
    </main>
  );
}
