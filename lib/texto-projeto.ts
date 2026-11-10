// Monta a descrição com frases fixas a partir das respostas do autor. Sem IA e sem internet.
export type Respostas = { proposta: string; justificativa: string; produtos: string };

const limpa = (s: string) => s.trim().replace(/[\s.]+$/, "");

export function montarDescricao(r: Respostas) {
  const frases: string[] = [];
  const proposta = limpa(r.proposta);
  const justificativa = limpa(r.justificativa);
  const produtos = limpa(r.produtos);
  if (proposta) frases.push(`O trabalho propõe ${proposta}.`);
  if (justificativa) frases.push(`Esse tema é importante porque ${justificativa}.`);
  if (produtos) frases.push(`Como resultado, a equipe produziu ${produtos}.`);
  return frases.join(" ");
}
