"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CampoCapa } from "@/components/campo-capa";
import { COR_PADRAO, SeletorCor } from "@/components/seletor-cor";
import { removerCapa, salvarCor } from "@/lib/acoes-projeto";
import { enviarCapa } from "@/lib/capa";

type Props = {
  projetoId: string;
  corSalva: string;
  temCapa: boolean;
  capaSalvaUrl: string | null;
  // Avisam a barra lateral para mostrar a prévia ao vivo.
  onCor: (cor: string) => void;
  onCapa: (url: string | null) => void;
};

export function Cabecalho({ projetoId, corSalva, temCapa, capaSalvaUrl, onCor, onCapa }: Props) {
  const [corNova, setCorNova] = useState(corSalva);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [tirada, setTirada] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<{ texto: string; erro?: boolean } | null>(null);

  const mudouCor = corNova !== corSalva;
  const mudou = mudouCor || arquivo !== null || tirada;

  function escolherArquivo(f: File | null) {
    setArquivo(f);
    setTirada(false);
    onCapa(f ? URL.createObjectURL(f) : capaSalvaUrl);
  }

  function tirarCapa() {
    setArquivo(null);
    setTirada(true);
    onCapa(null);
  }

  async function salvar() {
    setSalvando(true);
    setMensagem(null);
    try {
      if (mudouCor) {
        const r = await salvarCor(projetoId, corNova);
        if (r.erro) throw new Error(r.erro);
      }
      if (arquivo) {
        const erro = await enviarCapa(projetoId, arquivo);
        if (erro) throw new Error(erro);
      }
      if (tirada && temCapa) {
        const r = await removerCapa(projetoId);
        if (r.erro) throw new Error(r.erro);
      }
      setArquivo(null);
      setTirada(false);
      setMensagem({ texto: "Cabeçalho salvo!" });
    } catch (e) {
      setMensagem({ texto: e instanceof Error ? e.message : "Não foi possível salvar.", erro: true });
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg"><h2>Cabeçalho do projeto</h2></CardTitle>
        <CardDescription>
          É a faixa do topo do seu projeto no mural. Escolha uma cor, ou envie uma imagem de capa.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="grid gap-2">
          <span className="text-sm font-medium">Cor</span>
          <SeletorCor
            mostrarRotulo={false}
            inicial={corSalva || COR_PADRAO}
            onMudar={(cor) => {
              setCorNova(cor);
              onCor(cor);
            }}
          />
        </div>

        <div className="grid gap-2">
          <span className="text-sm font-medium">Capa (opcional, cobre a cor)</span>
          <CampoCapa
            urlAtual={capaSalvaUrl}
            onArquivo={escolherArquivo}
            onTirar={tirarCapa}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={salvar} disabled={!mudou || salvando}>
            <Save />
            {salvando ? "Salvando..." : "Salvar cabeçalho"}
          </Button>
          {!mudou && !salvando && <span className="text-sm text-muted-foreground">Nenhuma mudança.</span>}
          {mensagem && (
            <span role={mensagem.erro ? "alert" : undefined} className={mensagem.erro ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>
              {mensagem.texto}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
