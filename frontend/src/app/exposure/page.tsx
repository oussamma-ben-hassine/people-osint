'use client';

import React, { useEffect, useState } from 'react';
import {
  ShieldAlert, ShieldCheck, CheckCircle2, AlertTriangle,
  Lock, Key, Send, Loader2
} from 'lucide-react';
import { api } from '@/lib/api';
import { ExposureCheck } from '@/lib/types';

export default function ExposurePage() {
  const [checks, setChecks] = useState<ExposureCheck[]>([]);
  const [targetValue, setTargetValue] = useState('');
  const [targetType, setTargetType] = useState<'EMAIL' | 'DOMAIN'>('EMAIL');
  const [verifyToken, setVerifyToken] = useState('');
  const [pendingCheckId, setPendingCheckId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadChecks = async () => {
    try {
      const data = await api.listExposureChecks();
      setChecks(data);
    } catch {}
  };

  useEffect(() => {
    loadChecks();
  }, []);

  const handleCreateCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetValue.trim()) return;
    setError(null);
    setLoading(true);

    try {
      const created = await api.createExposureCheck(targetType, targetValue.trim());
      if (!created.is_verified) {
        setPendingCheckId(created.id);
        setVerifyToken(created.verification_token || '');
      }
      setTargetValue('');
      loadChecks();
    } catch (err: any) {
      setError(err.message || 'Erreur lors du lancement de la vérification.');
    }
    setLoading(false);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingCheckId || !verifyToken) return;
    setLoading(true);
    try {
      await api.verifyExposureCheck(pendingCheckId, verifyToken);
      setPendingCheckId(null);
      setVerifyToken('');
      loadChecks();
    } catch (err: any) {
      setError(err.message || 'Échec de validation de la preuve de propriété.');
    }
    setLoading(false);
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-5xl mx-auto w-full">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
          Module F — Exposure Monitor
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Surveillance et détection d'exposition d'identifiants légitimement contrôlés (Have I Been Pwned / Threat Intelligence).
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm">
          {error}
        </div>
      )}

      {/* Security Principles Banner */}
      <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3 text-xs text-amber-300">
        <ShieldCheck size={20} className="shrink-0 text-amber-400 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">Engagements de Sécurité et Conformité :</p>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Seuls les identifiants dont l'utilisateur prouve le contrôle sont analysés. L'application ne télécharge, n'indexe, ni n'affiche jamais de mots de passe ou de bases brutes compromises.
          </p>
        </div>
      </div>

      {/* Form Section */}
      <form onSubmit={handleCreateCheck} className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 space-y-5">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">
          Vérifier une exposition de données
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Type d'identifiant</label>
            <select
              value={targetType}
              onChange={(e: any) => setTargetType(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
            >
              <option value="EMAIL">Adresse Email (personnelle)</option>
              <option value="DOMAIN">Nom de Domaine (administré)</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
              {targetType === 'EMAIL' ? 'Adresse email à auditer' : 'Nom de domaine à auditer'}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder={targetType === 'EMAIL' ? 'Ex : contact@domaine.com' : 'Ex : domaine.com'}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                <span>Vérifier</span>
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Verification Challenge Modal / Section */}
      {pendingCheckId && (
        <form onSubmit={handleVerify} className="bg-[#0f172a] border border-sky-500/40 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Lock size={18} className="text-sky-400" />
            <h3 className="text-sm font-bold text-white">Validation de preuve de contrôle requise</h3>
          </div>
          <p className="text-xs text-slate-300">
            Pour vérifier cet identifiant externe, confirmez la possession via le jeton de validation généré :
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              required
              value={verifyToken}
              onChange={(e) => setVerifyToken(e.target.value)}
              placeholder="Jeton de preuve (ex: DNS TXT ou email token)"
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold"
            >
              Valider la preuve
            </button>
          </div>
        </form>
      )}

      {/* Exposure Checks History & Reports */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white">Historique des vérifications</h2>

        {checks.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm bg-[#0f172a] border border-slate-800 rounded-2xl">
            Aucune vérification d'exposition effectuée.
          </div>
        ) : (
          <div className="space-y-4">
            {checks.map((c) => (
              <div
                key={c.id}
                className="p-6 bg-[#0f172a] border border-slate-800 rounded-2xl space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-base">{c.identifier_value}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 uppercase">
                      {c.identifier_type}
                    </span>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                    c.breach_count > 0
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {c.breach_count > 0 ? (
                      <>
                        <AlertTriangle size={14} />
                        <span>{c.breach_count} incident(s) détecté(s)</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={14} />
                        <span>Aucune fuite répertoriée</span>
                      </>
                    )}
                  </span>
                </div>

                {/* Breaches list */}
                {c.breach_details && c.breach_details.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-800/80">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Incidents historiques répertoriés :</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {c.breach_details.map((b: any, idx: number) => (
                        <div key={idx} className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1 text-xs">
                          <div className="flex justify-between font-bold text-slate-200">
                            <span>{b.title}</span>
                            <span className="text-[10px] text-slate-500">{b.breach_date}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 line-clamp-2">{b.description}</p>
                          <div className="pt-1 flex flex-wrap gap-1">
                            {(b.data_classes || []).map((dc: string, dci: number) => (
                              <span key={dci} className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-rose-300">
                                {dc}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {c.recommendations && c.recommendations.length > 0 && (
                  <div className="pt-2 border-t border-slate-800/80 text-xs space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Recommandations de sécurité :</span>
                    <ul className="space-y-1 text-slate-300">
                      {c.recommendations.map((r, ri) => (
                        <li key={ri} className="flex items-start gap-2">
                          <CheckCircle2 size={13} className="text-sky-400 shrink-0 mt-0.5" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
