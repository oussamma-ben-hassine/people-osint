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
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] flex items-center justify-center p-4 transition-colors duration-200">
      <div className="max-w-md w-full bg-white dark:bg-[#0f172a] border border-amber-300 dark:border-amber-500/30 rounded-2xl p-8 shadow-xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl" />

        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-md">
            <Lock size={30} />
          </div>

          <div>
            <span className="text-xs font-bold tracking-wider uppercase text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-500/20">
              403 — Accès Restreint
            </span>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-3">Compte en cours de validation</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Votre session SSO est confirmée, mais l'accès à <strong className="text-slate-800 dark:text-slate-200">People OSINT</strong> nécessite l'approbation préalable du Super Administrateur.
            </p>
          </div>

          {user && (
            <div className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-left text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Identifiant SSO :</span>
                <span className="text-slate-800 dark:text-slate-200 font-mono text-[11px] truncate max-w-[180px]">{user.sso_sub}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Email :</span>
                <span className="text-slate-800 dark:text-slate-200 truncate font-semibold">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Statut d'accès :</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">{user.access_status}</span>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 w-full pt-2">
            <button
              onClick={handleCheckAgain}
              disabled={checking}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50 shadow-sm"
            >
              <RefreshCw size={14} className={checking ? 'animate-spin' : ''} />
              <span>Vérifier mon statut</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition border border-slate-200 dark:border-slate-700"
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
