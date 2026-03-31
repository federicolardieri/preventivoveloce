"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, AlertTriangle } from "lucide-react";

interface DuplicateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function DuplicateDialog({ open, onOpenChange, onConfirm }: DuplicateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-black">
            <Copy className="w-5 h-5 text-primary" />
            Duplica Preventivo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Stai per creare una copia di questo preventivo. Il duplicato verrà aperto nell&apos;editor pronto per essere modificato.
          </p>

          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-amber-800">
                Il duplicato non verrà salvato automaticamente
              </p>
              <p className="text-xs text-amber-700 leading-relaxed">
                La copia esiste solo in sessione. Se esci o fai il logout senza salvarlo, il duplicato andrà perso. Per salvarlo clicca <strong>Salva nello Storico</strong> o <strong>Scarica PDF</strong> dall&apos;editor.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl font-bold"
            >
              Annulla
            </Button>
            <Button
              onClick={() => {
                onConfirm();
                onOpenChange(false);
              }}
              className="rounded-xl font-bold bg-primary text-primary-foreground hover:opacity-90 gap-2"
            >
              <Copy className="w-4 h-4" />
              Duplica e Apri
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
