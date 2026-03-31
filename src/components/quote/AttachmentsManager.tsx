"use client";

import { useQuoteStore } from "@/store/quoteStore";
import { Button } from "@/components/ui/button";
import { Paperclip, X, FileText, Image as ImageIcon, AlertCircle } from "lucide-react";
import { useRef, useState } from "react";
import { QuoteAttachment } from "@/types/quote";

export function AttachmentsManager() {
  const { currentQuote, addAttachment, removeAttachment } = useQuoteStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  if (!currentQuote) return null;

  const attachments = currentQuote.attachments || [];
  const MAX_ATTACHMENTS = 7;
  // Restrict to 1MB to prevent breaking localStorage (base64 inflates size by 30%)
  const MAX_FILE_SIZE = 1 * 1024 * 1024; 

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (attachments.length + files.length > MAX_ATTACHMENTS) {
      setError(`Massimo ${MAX_ATTACHMENTS} allegati consentiti.`);
      return;
    }

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        setError(`Il file "${file.name}" supera il limite di 1MB.`);
        continue;
      }
      
      const isValidType = file.type === 'application/pdf' || file.type === 'image/jpeg' || file.type === 'image/png';
      if (!isValidType) {
        setError(`Formato non supportato per "${file.name}". Usa PDF, JPG o PNG.`);
        continue;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          addAttachment({
            id: crypto.randomUUID(),
            name: file.name,
            data: event.target.result as string,
            type: file.type as QuoteAttachment['type'],
          });
        }
      };
      reader.readAsDataURL(file);
    }
    
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="bg-card rounded-3xl border border-border p-8 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_-4px_rgba(var(--primary),0.08)] transition-all duration-300">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-foreground">Allegati Extra</h3>
          <p className="text-xs text-muted-foreground mt-1 font-medium italic">Allega schede tecniche, certificazioni o altro (Max {MAX_ATTACHMENTS} file, max 1MB cad.).</p>
        </div>
        <div className="flex items-center justify-center bg-primary/10 text-primary w-12 h-12 rounded-2xl font-black shadow-inner">
          {attachments.length}/{MAX_ATTACHMENTS}
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-500/10 text-red-600 px-4 py-3 rounded-xl border border-red-500/20 flex items-center text-sm font-bold animate-in fade-in slide-in-from-top-1">
          <AlertCircle className="w-4 h-4 mr-2" />
          {error}
        </div>
      )}

      {attachments.length > 0 && (
        <div className="space-y-3 mb-6">
          {attachments.map(att => (
            <div key={att.id} className="flex items-center justify-between p-3 rounded-2xl border border-border bg-muted/30 group hover:bg-muted/50 transition-colors">
              <div className="flex items-center truncate">
                {att.type === 'application/pdf' ? (
                  <div className="w-9 h-9 rounded-xl bg-rose-500/10 flex items-center justify-center mr-3 shrink-0">
                    <FileText className="w-5 h-5 text-rose-500" />
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center mr-3 shrink-0">
                    <ImageIcon className="w-5 h-5 text-blue-500" />
                  </div>
                )}
                <span className="text-sm font-bold text-foreground truncate">{att.name}</span>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => removeAttachment(att.id)}
                className="w-8 h-8 rounded-xl text-muted-foreground hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all shrink-0 ml-4"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="pt-2">
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          className="hidden" 
          accept=".pdf,.jpg,.jpeg,.png"
          multiple
        />
        <Button 
          variant="outline" 
          onClick={() => fileInputRef.current?.click()}
          disabled={attachments.length >= MAX_ATTACHMENTS}
          className="w-full h-14 border-dashed border-2 border-border text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all rounded-2xl font-black text-sm"
        >
          <Paperclip className="w-5 h-5 mr-2" />
          Aggiungi Allegati ✨
        </Button>
      </div>
    </div>
  );
}
