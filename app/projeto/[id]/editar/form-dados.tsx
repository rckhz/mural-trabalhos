"use client";

import { useActionState, useState, useTransition } from "react";
import { Save, SpellCheck, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useConfirmar } from "@/components/confirmar";
import { salvarDados, verificarOrtografia } from "@/lib/acoes-projeto";
import type { ErroOrtografia } from "@/lib/ortografia";
import { classeCampo } from "@/lib/projetos";
import { montarDescricao, type Respostas } from "@/lib/texto-projeto";

const escapar = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// Troca só a palavra inteira (não mexe em "casa" dentro de "casamento").
const trocarPalavra = (texto: string, de: string, para: string) =>
  texto.replace(new RegExp(`(?<![\\p{L}-])${escapar(de)}(?![\\p{L}-])`, "gu"), para);

type Dados = { id: string; titulo: string; semestre: number; disciplina: string | null; descricao: string | null };

const PERGUNTAS: { campo: keyof Respostas; rotulo: string; exemplo: string }[] = [
  { campo: "proposta", rotulo: "Qual é a proposta do trabalho?", exemplo: "Ex.: criar um jogo para ensinar a fotossíntese" },
  { campo: "justificativa", rotulo: "Por que esse tema é importante?", exemplo: "Ex.: muitos colegas têm dificuldade com esse conteúdo" },
  { campo: "produtos", rotulo: "O que a equipe produziu?", exemplo: "Ex.: um cartaz, uma maquete e um vídeo de 2 minutos" },
];

export function FormDados({ projeto }: { projeto: Dados }) {
  const [estado, enviar, pendente] = useActionState(salvarDados, null);
  const [respostas, setRespostas] = useState<Respostas>({ proposta: "", justificativa: "", produtos: "" });
  const [descricao, setDescricao] = useState(projeto.descricao ?? "");

  const [dialogo, confirmar] = useConfirmar();

  const gerar = async () => {
    const texto = montarDescricao(respostas);
    if (!texto) return;
    if (
      descricao.trim() &&
      !(await confirmar({
        titulo: "Substituir o texto atual?",
        texto: "A descrição escrita agora será trocada pelo texto montado com as respostas.",
        acao: "Substituir",
      }))
    ) {
      return;
    }
    setDescricao(texto);
  };

  const podeGerar = Object.values(respostas).some((v) => v.trim());

  const [verificando, iniciarVerificacao] = useTransition();
  const [erros, setErros] = useState<ErroOrtografia[] | null>(null);
  const [avisoOrto, setAvisoOrto] = useState<string | null>(null);

  const verificar = () =>
    iniciarVerificacao(async () => {
      setAvisoOrto(null);
      const r = await verificarOrtografia(descricao);
      if (r.erro) return setAvisoOrto(r.erro);
      setErros(r.erros ?? []);
    });

  const corrigir = (palavra: string, sugestao: string) => {
    setDescricao((d) => trocarPalavra(d, palavra, sugestao));
    setErros((e) => e?.filter((x) => x.palavra !== palavra) ?? null);
  };
  const ignorar = (palavra: string) => setErros((e) => e?.filter((x) => x.palavra !== palavra) ?? null);

  return (
    <Card>
      {dialogo}
      <CardHeader>
        <CardTitle className="text-lg"><h2>Sobre o projeto</h2></CardTitle>
        <CardDescription>Responda as perguntas e clique em gerar. Depois você pode editar o texto.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={enviar} className="grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="id" value={projeto.id} />
          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="titulo">Nome do trabalho</Label>
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

          <fieldset className="grid gap-4 rounded-xl border border-black/10 p-4 sm:col-span-2">
            <legend className="px-1 text-sm font-semibold">Perguntas para montar a descrição</legend>
            {PERGUNTAS.map((p) => (
              <div key={p.campo} className="grid gap-1.5">
                <Label htmlFor={`resp-${p.campo}`}>{p.rotulo}</Label>
                <Input
                  id={`resp-${p.campo}`}
                  lang="pt-BR"
                  spellCheck
                  value={respostas[p.campo]}
                  maxLength={300}
                  placeholder={p.exemplo}
                  onChange={(e) => setRespostas((r) => ({ ...r, [p.campo]: e.target.value }))}
                />
              </div>
            ))}
            <div>
              <Button type="button" variant="outline" onClick={() => void gerar()} disabled={!podeGerar}>
                <Wand2 />Gerar descrição com as respostas
              </Button>
            </div>
          </fieldset>

          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="descricao">Descrição</Label>
            <textarea
              id="descricao"
              name="descricao"
              lang="pt-BR"
              spellCheck
              autoCapitalize="sentences"
              rows={6}
              maxLength={3000}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className={classeCampo}
              placeholder="Escreva aqui, ou use as perguntas acima para montar o texto."
            />
            <div className="grid gap-2">
              <div>
                <Button type="button" variant="outline" size="sm" onClick={verificar} disabled={verificando || !descricao.trim()}>
                  <SpellCheck />
                  {verificando ? "Verificando..." : "Verificar ortografia"}
                </Button>
              </div>
              {avisoOrto && <p role="alert" className="text-sm text-destructive">{avisoOrto}</p>}
              {erros && erros.length === 0 && !verificando && (
                <p className="text-sm text-[#128242]">Nenhum erro de ortografia encontrado.</p>
              )}
              {erros && erros.length > 0 && (
                <ul className="grid gap-2 rounded-lg border border-amber-300/60 bg-amber-50 p-3 text-sm dark:bg-amber-950/30">
                  <li className="text-muted-foreground">
                    Clique na palavra certa para corrigir. O corretor não vê erros de gramática.
                  </li>
                  {erros.map((e) => (
                    <li key={e.palavra} className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-destructive line-through">{e.palavra}</span>
                      <span aria-hidden>→</span>
                      {e.sugestoes.length ? (
                        e.sugestoes.map((s) => (
                          <Button key={s} type="button" size="xs" variant="secondary" onClick={() => corrigir(e.palavra, s)}>
                            {s}
                          </Button>
                        ))
                      ) : (
                        <span className="text-muted-foreground">sem sugestão</span>
                      )}
                      <Button type="button" size="xs" variant="ghost" onClick={() => ignorar(e.palavra)}>
                        Ignorar
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
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
