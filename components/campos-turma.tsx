"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { classeCampo } from "@/lib/projetos";
import type { Turma } from "@/lib/turmas";

// Escolha da turma em três campos: ano (1º/2º/3º), turma (MIL/MIN) e ano letivo.
// Envia o id da turma correspondente no campo escondido "turma_id".
export function CamposTurma({ turmas, padrao }: { turmas: Turma[]; padrao?: string }) {
  const inicial = turmas.find((t) => t.id === padrao) ?? turmas[0];
  const anos = [...new Set(turmas.map((t) => t.ano_letivo))].sort((a, b) => b - a);
  const [serie, setSerie] = useState(inicial?.serie ?? 1);
  const [nome, setNome] = useState(inicial?.nome ?? "MIL");
  const [ano, setAno] = useState(inicial?.ano_letivo ?? anos[0]);
  const id = turmas.find((t) => t.serie === serie && t.nome === nome && t.ano_letivo === ano)?.id ?? "";

  return (
    <div className="grid grid-cols-3 gap-3">
      <input type="hidden" name="turma_id" value={id} />
      <div className="grid gap-1.5">
        <Label htmlFor="serie">Ano</Label>
        <select id="serie" value={serie} onChange={(e) => setSerie(Number(e.target.value))} className={classeCampo}>
          {[1, 2, 3].map((s) => <option key={s} value={s}>{s}º ano</option>)}
        </select>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="turma">Turma</Label>
        <select id="turma" value={nome} onChange={(e) => setNome(e.target.value)} className={classeCampo}>
          {["MIL", "MIN"].map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="ano_letivo">Ano letivo</Label>
        <select id="ano_letivo" value={ano} onChange={(e) => setAno(Number(e.target.value))} className={classeCampo}>
          {anos.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>
    </div>
  );
}
