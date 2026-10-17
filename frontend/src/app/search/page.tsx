'use client';

import React, { useState, useEffect } from 'react';
import {
  Search, Sliders, Play, XCircle, CheckCircle2, Loader2,
  Building2, MapPin, Briefcase, Tag, Globe, Sparkles, ExternalLink, ShieldCheck
} from 'lucide-react';
import { api } from '@/lib/api';
import { SearchJob } from '@/lib/types';

export default function SearchPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [profession, setProfession] = useState('');
  const [organization, setOrganization] = useState('');
  const [keywords, setKeywords] = useState('');
  
  const [mode, setMode] = useState<'PROFESSIONAL' | 'FULL_WEB'>('PROFESSIONAL');
  const [depth, setDepth] = useState<'QUICK' | 'DEEP' | 'EXTENDED'>('QUICK');
  const [useExisting, setUseExisting] = useState(true);
  const [enableAI, setEnableAI] = useState(true);

  const [activeJob, setActiveJob] = useState<SearchJob | null>(null);
  const [jobResults, setJobResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Polling for active search progress
  useEffect(() => {
    if (!activeJob || activeJob.status === 'COMPLETED' || activeJob.status === 'FAILED' || activeJob.status === 'CANCELLED') {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const updated = await api.getSearch(activeJob.id);
        setActiveJob(updated);
        if (updated.status === 'COMPLETED') {
          const results = await api.getSearchResults(updated.id);
          setJobResults(results);
          setLoading(false);
        }
      } catch {}
    }, 1500);

    return () => clearInterval(interval);
  }, [activeJob]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lastName.trim()) {
      setError('Le nom de famille est obligatoire pour lancer la recherche.');
      return;
    }
    setError(null);
    setLoading(true);
    setJobResults([]);

    try {
      const job = await api.createSearch({
        first_name: firstName,
        last_name: lastName,
        country,
        city,
        profession,
        organization,
        keywords,
        mode,
        depth,
        use_existing_knowledge: useExisting,
        enable_ai_analysis: enableAI,
      });
      setActiveJob(job);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du lancement de la recherche.');
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!activeJob) return;
    try {
      await api.cancelSearch(activeJob.id);
      setActiveJob({ ...activeJob, status: 'CANCELLED', progress_step: 'Recherche annulée' });
      setLoading(false);
    } catch {}
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-6xl mx-auto w-full">
      {/* Title */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
          Module A — People Search
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Moteur multi-sources asynchrone (SearXNG, GitHub, GitLab, ORCID, Crossref, OpenAlex) avec extraction d'entités et détection des relations.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm">
          {error}
        </div>
      )}

      {/* Search Form */}
      <form onSubmit={handleSubmit} className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Prénom
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Ex : Oussama"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Nom de famille *
            </label>
            <input
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Ex : Ben Hassine"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Briefcase size={14} className="text-sky-400" />
              <span>Profession / Rôle</span>
            </label>
            <input
              type="text"
              value={profession}
              onChange={(e) => setProfession(e.target.value)}
              placeholder="Ex : Chercheur IA, Développeur..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Building2 size={14} className="text-emerald-400" />
              <span>Organisation / Entreprise</span>
            </label>
            <input
              type="text"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              placeholder="Ex : Université, Startup..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <MapPin size={14} className="text-rose-400" />
              <span>Localisation (Pays, Ville)</span>
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ex : Tunis, Paris, Remote..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Tag size={14} className="text-purple-400" />
              <span>Mots-clés additionnels</span>
            </label>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="Ex : LLM, Open Source, Deep Learning"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500 transition"
            />
          </div>
        </div>

        {/* Modes & Depths */}
        <div className="pt-4 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Mode de recherche
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMode('PROFESSIONAL')}
                className={`p-3 rounded-xl border text-left transition ${
                  mode === 'PROFESSIONAL'
                    ? 'border-sky-500 bg-sky-500/10 text-white font-medium'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="text-xs font-bold text-sky-400">Professionnel</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Expériences, repos, ORCID & publications</div>
              </button>

              <button
                type="button"
                onClick={() => setMode('FULL_WEB')}
                className={`p-3 rounded-xl border text-left transition ${
                  mode === 'FULL_WEB'
                    ? 'border-sky-500 bg-sky-500/10 text-white font-medium'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="text-xs font-bold text-sky-400">Web complet</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Presse, blogs, métamoteur SearXNG</div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Profondeur de collecte
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['QUICK', 'DEEP', 'EXTENDED'] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDepth(d)}
                  className={`py-2.5 px-3 rounded-xl border text-center text-xs font-semibold transition ${
                    depth === d
                      ? 'border-sky-500 bg-sky-500/10 text-sky-400'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              QUICK : sources directes • DEEP : profilage étendu • EXTENDED : graphe étendu
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2 flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={enableAI}
                onChange={(e) => setEnableAI(e.target.checked)}
                className="rounded border-slate-700 text-sky-600 focus:ring-sky-500 bg-slate-900"
              />
              <span>Analyse sémantique LiteLLM</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-sky-600/30 transition disabled:opacity-50"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />}
            <span>Lancer l'investigation</span>
          </button>
        </div>
      </form>

      {/* Progress & Live Status Box */}
      {activeJob && (
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {activeJob.status === 'RUNNING' && <Loader2 className="animate-spin text-sky-400" size={20} />}
              {activeJob.status === 'COMPLETED' && <CheckCircle2 className="text-emerald-400" size={20} />}
              {activeJob.status === 'CANCELLED' && <XCircle className="text-amber-400" size={20} />}
              <div>
                <h3 className="text-sm font-bold text-white">
                  Statut : {activeJob.status} ({activeJob.progress_pct}%)
                </h3>
                <p className="text-xs text-slate-400">{activeJob.progress_step}</p>
              </div>
            </div>

            {activeJob.status === 'RUNNING' && (
              <button
                onClick={handleCancel}
                className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-semibold transition"
              >
                Annuler
              </button>
            )}
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-sky-500 to-cyan-400 h-full transition-all duration-500"
              style={{ width: `${activeJob.progress_pct}%` }}
            />
          </div>
        </div>
      )}

      {/* Results Section */}
      {jobResults.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles size={18} className="text-sky-400" />
            <span>Résultats collectés ({jobResults.length} sources)</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jobResults.map((r, i) => (
              <div key={i} className="p-5 bg-[#0f172a] border border-slate-800 rounded-xl space-y-2 hover:border-slate-700 transition">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-sky-400 uppercase tracking-wider bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                    {r.connector}
                  </span>
                  <a
                    href={r.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    <span>Ouvrir la source</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
                <h3 className="text-sm font-bold text-white leading-snug">{r.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">{r.snippet}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
