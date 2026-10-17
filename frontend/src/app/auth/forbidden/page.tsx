'use client';

import React, { useEffect, useState } from 'react';
import { ShieldAlert, RefreshCw, LogOut, Lock } from 'lucide-react';
import { api } from '@/lib/api';
import { User } from '@/lib/types';

export default function ForbiddenPage() {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    api.getMe().then(setUser).catch(() => {});
  }, []);

  const handleCheckAgain = async () => {
    setChecking(true);
    try {
      const u = await api.getMe();
      setUser(u);
      if (u.access_status === 'ACTIVE') {
        window.location.href = '/';
      }
    } catch {}
    setChecking(false);
  };

  const handleLogout = async () => {
    try {
      await api.logout();
      window.location.href = '/';
    } catch {}
  };

  return (
    <div className="min-h-screen bg-[#090d16] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#0f172a] border border-amber-500/30 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl" />

        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
            <Lock size={32} />
          </div>

          <div>
            <span className="text-xs font-bold tracking-wider uppercase text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
              403 — Accès Non Autorisé
            </span>
            <h1 className="text-2xl font-bold text-white mt-3">Compte en attente de validation</h1>
            <p className="text-sm text-slate-400 mt-2">
              Votre identité SSO est bien authentifiée, mais l'accès à <strong className="text-slate-200">People OSINT</strong> est soumis à l'approbation préalable du Super Administrateur.
            </p>
          </div>

          {user && (
            <div className="w-full bg-slate-900/80 border border-slate-800 rounded-xl p-4 text-left text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Identifiant SSO :</span>
                <span className="text-slate-200 font-mono">{user.sso_sub}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Email :</span>
                <span className="text-slate-200 truncate">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Statut d'accès :</span>
                <span className="font-bold text-amber-400">{user.access_status}</span>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 w-full pt-2">
            <button
              onClick={handleCheckAgain}
              disabled={checking}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50"
            >
              <RefreshCw size={14} className={checking ? 'animate-spin' : ''} />
              <span>Vérifier mon statut</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition border border-slate-700"
            >
              <LogOut size={14} />
              <span>Déconnexion</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
