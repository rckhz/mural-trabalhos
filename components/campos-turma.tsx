"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { classeCampo } from "@/lib/projetos";
import type { Turma } from "@/lib/turmas";

const CLASSES = [1, 2, 3].flatMap((s) => ["MIL", "MIN"].map((n) => `${s}-${n}`));
const rotulo = (c: string) => c.replace("-", "º ");

// Escolha da turma em dois campos: a turma (1º MIL...3º MIN) e, embaixo, o ano letivo.
// Envia o id da turma correspondente no campo escondido "turma_id".
export function CamposTurma({ turmas, padrao }: { turmas: Turma[]; padrao?: string }) {
  const inicial = turmas.find((t) => t.id === padrao) ?? turmas[0];
  const anos = [...new Set(turmas.map((t) => t.ano_letivo))].sort((a, b) => b - a);
  const [classe, setClasse] = useState(inicial ? `${inicial.serie}-${inicial.nome}` : CLASSES[0]);
  const [ano, setAno] = useState(inicial?.ano_letivo ?? anos[0]);
  const id = turmas.find((t) => `${t.serie}-${t.nome}` === classe && t.ano_letivo === ano)?.id ?? "";

  return (
    <>
      <input type="hidden" name="turma_id" value={id} />
      <div className="grid gap-1.5">
        <Label htmlFor="classe">Turma</Label>
        <select id="classe" value={classe} onChange={(e) => setClasse(e.target.value)} className={classeCampo}>
          {CLASSES.map((c) => <option key={c} value={c}>{rotulo(c)}</option>)}
        </select>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="ano_letivo">Ano letivo</Label>
        <select id="ano_letivo" value={ano} onChange={(e) => setAno(Number(e.target.value))} className={classeCampo}>
          {anos.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>
    </>
  );
}
