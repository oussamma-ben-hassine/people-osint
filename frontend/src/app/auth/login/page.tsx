'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ShieldCheck, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getLoginUrl()
      .then((data) => {
        if (data.authorization_url) {
          window.location.href = data.authorization_url;
        }
      })
      .catch((err) => {
        setError(err.message || 'Impossible de joindre le serveur SSO.');
      });
  }, []);

  return (
    <div className="min-h-screen bg-[#090d16] flex items-center justify-center p-4">
      <div className="max-w-sm w-full bg-[#0f172a] border border-slate-800 rounded-2xl p-8 text-center space-y-4 shadow-xl">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
          <ShieldCheck size={28} />
        </div>
        <h2 className="text-xl font-bold text-white">Redirection SSO</h2>
        <p className="text-xs text-slate-400">Connexion sécurisée via le SSO central (sso-a.oussamma.tn)...</p>
        
        {error ? (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
            {error}
          </div>
        ) : (
          <div className="flex justify-center pt-2">
            <Loader2 className="animate-spin text-sky-400" size={24} />
          </div>
        )}
      </div>
    </div>
  );
}
