'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';

export default function CallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code || !state) {
      setError('Paramètres OAuth invalides reçus du SSO.');
      return;
    }

    // Call backend callback endpoint to finalize token exchange & session
    fetch(`/auth/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({ detail: 'Échec de validation SSO' }));
          throw new Error(data.detail || 'Échec de validation SSO');
        }
        return res.json();
      })
      .then((data) => {
        if (data.is_active) {
          window.location.href = '/';
        } else {
          window.location.href = '/auth/forbidden';
        }
      })
      .catch((err) => {
        setError(err.message);
      });
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-[#090d16] flex items-center justify-center p-4">
      <div className="max-w-sm w-full bg-[#0f172a] border border-slate-800 rounded-2xl p-8 text-center space-y-4">
        {error ? (
          <>
            <div className="w-12 h-12 mx-auto rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <AlertCircle size={24} />
            </div>
            <h2 className="text-lg font-bold text-white">Échec d'authentification</h2>
            <p className="text-xs text-rose-400">{error}</p>
            <a href="/auth/login" className="inline-block mt-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold">
              Réessayer
            </a>
          </>
        ) : (
          <>
            <Loader2 className="animate-spin text-sky-400 mx-auto" size={32} />
            <h2 className="text-lg font-bold text-white">Validation de session</h2>
            <p className="text-xs text-slate-400">Finalisation de l'authentification avec People OSINT...</p>
          </>
        )}
      </div>
    </div>
  );
}
