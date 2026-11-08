"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Opcoes = { titulo: string; texto: string; acao: string; perigoso?: boolean };

// Substitui o confirm() do navegador, que o Chrome pode passar a bloquear
// ("impedir que esta página crie caixas de diálogo adicionais").
// Uso: const [dialogo, confirmar] = useConfirmar(); ... if (await confirmar({...})) ...
export function useConfirmar() {
  const [aberto, setAberto] = useState(false);
  const [pedido, setPedido] = useState<Opcoes & { resolver: (ok: boolean) => void }>();

  const confirmar = (opcoes: Opcoes) =>
    new Promise<boolean>((resolver) => {
      setPedido({ ...opcoes, resolver });
      setAberto(true);
    });

  const fechar = (ok: boolean) => {
    pedido?.resolver(ok);
    setAberto(false);
  };

  const dialogo = (
    <AlertDialog open={aberto} onOpenChange={(abrir) => !abrir && fechar(false)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{pedido?.titulo}</AlertDialogTitle>
          <AlertDialogDescription>{pedido?.texto}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction variant={pedido?.perigoso ? "destructive" : "default"} onClick={() => fechar(true)}>
            {pedido?.acao}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return [dialogo, confirmar] as const;
}
