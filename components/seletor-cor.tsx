"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export const COR_PADRAO = "#128242";

const PREDEFINIDAS = [
  { nome: "Verde", hex: COR_PADRAO },
  { nome: "Sálvia", hex: "#5E8C6A" },
  { nome: "Oliva", hex: "#7A8B3C" },
  { nome: "Terra", hex: "#A67C52" },
  { nome: "Azul", hex: "#2F6690" },
  { nome: "Roxo", hex: "#6D4C8F" },
  { nome: "Vinho", hex: "#8E3B46" },
];

// Converte matiz (0 a 360), saturação e luminosidade (0 a 1) para #rrggbb.
function hslParaHex(matiz: number, saturacao: number, luminosidade: number) {
  const a = saturacao * Math.min(luminosidade, 1 - luminosidade);
  const canal = (n: number) => {
    const k = (n + matiz / 30) % 12;
    const valor = luminosidade - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(255 * valor).toString(16).padStart(2, "0");
  };
  return `#${canal(0)}${canal(8)}${canal(4)}`;
}

// Cor enviada no campo "cor" do formulário.
export function SeletorCor({
  nome = "cor",
  inicial = COR_PADRAO,
  mostrarRotulo = true,
  onMudar,
}: {
  nome?: string;
  inicial?: string;
  mostrarRotulo?: boolean;
  onMudar?: (cor: string) => void;
}) {
  const [cor, setCorState] = useState(inicial);
  const [matiz, setMatiz] = useState(150);

  const setCor = (novo: string) => {
    setCorState(novo);
    onMudar?.(novo);
  };

  const escolherMatiz = (valor: number) => {
    setMatiz(valor);
    setCor(hslParaHex(valor, 0.6, 0.35));
  };

  return (
    <div className="grid gap-2">
      {mostrarRotulo && <span className="text-sm font-medium">Cor do cabeçalho</span>}

      <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Cores prontas">
        {PREDEFINIDAS.map((c) => {
          const marcada = c.hex === cor;
          return (
            <button
              key={c.hex}
              type="button"
              role="radio"
              aria-checked={marcada}
              aria-label={c.nome}
              title={c.nome}
              onClick={() => setCor(c.hex)}
              className={cn(
                "size-8 rounded-full ring-offset-2 ring-offset-background transition hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring",
                marcada && "ring-2 ring-foreground",
              )}
              style={{ backgroundColor: c.hex }}
            />
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <input
          type="range"
          min={0}
          max={360}
          value={matiz}
          onChange={(e) => escolherMatiz(Number(e.target.value))}
          aria-label="Escolher outra cor"
          className="h-3 w-full cursor-pointer appearance-none rounded-full [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md"
          style={{
            background: "linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)",
          }}
        />
        <span
          className="size-8 shrink-0 rounded-full border border-black/10"
          style={{ backgroundColor: cor }}
          aria-hidden
        />
      </div>

      <input type="hidden" name={nome} value={cor} />
    </div>
  );
}
