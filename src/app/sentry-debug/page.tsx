'use client';

import * as Sentry from '@sentry/nextjs';

export default function SentryDebugPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
      <div className="text-center space-y-6 max-w-md">
        <h1 className="text-2xl font-black text-white">🐛 Sentry Debug</h1>
        <p className="text-white/50 text-sm">
          Clicca un bottone per generare un errore di test e verificare che Sentry lo catturi.
        </p>

        <div className="space-y-3">
          {/* Errore client-side (React) */}
          <button
            onClick={() => {
              throw new Error('Test errore client-side Sentry!');
            }}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl transition-colors"
          >
            💥 Errore Client (throw)
          </button>

          {/* Errore catturato manualmente */}
          <button
            onClick={() => {
              Sentry.captureException(new Error('Test captureException manuale Sentry!'));
              alert('✅ Errore inviato a Sentry con captureException!');
            }}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-6 rounded-xl transition-colors"
          >
            📤 captureException (silenzioso)
          </button>

          {/* Errore server-side (API) */}
          <button
            onClick={async () => {
              try {
                const res = await fetch('/api/sentry-debug');
                const data = await res.json();
                alert(`Server ha risposto: ${JSON.stringify(data)}`);
              } catch {
                alert('Errore nella chiamata API');
              }
            }}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-xl transition-colors"
          >
            🖥️ Errore Server (API route)
          </button>
        </div>

        <p className="text-white/30 text-xs">
          Dopo aver cliccato, controlla la dashboard Sentry entro 1-2 minuti.
        </p>
      </div>
    </div>
  );
}
