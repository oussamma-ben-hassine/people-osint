'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Search, Sliders, Play, XCircle, CheckCircle2, Loader2,
  Building2, MapPin, Briefcase, Tag, Globe, Sparkles, ExternalLink,
  ShieldCheck, Share2, Download, Filter, Code2, GraduationCap,
  Newspaper, UserCheck, Copy, Check, ChevronRight, Image as ImageIcon,
  Trash2, X, Eye
} from 'lucide-react';
import { api } from '@/lib/api';
import { SearchJob, SearchResult } from '@/lib/types';

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
  const [jobResults, setJobResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Results filtering, categories and deletion
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchFilter, setSearchFilter] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
    setSelectedCategory('ALL');
    setSearchFilter('');

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
      setActiveJob({ ...activeJob, status: 'CANCELLED', progress_step: 'Recherche annulée par l\'analyste' });
      setLoading(false);
    } catch {}
  };

  const handleCopyCitation = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleDeleteResult = async (resultId: string) => {
    if (!activeJob) return;
    if (!confirm('Supprimer ce résultat de la synthèse d\'investigation ?')) return;

    setDeletingId(resultId);
    try {
      await api.deleteSearchResult(activeJob.id, resultId);
      setJobResults((prev) => prev.filter((r) => r.id !== resultId));
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la suppression du résultat.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({
      target: {
        first_name: firstName,
        last_name: lastName,
        profession,
        organization,
        city,
        country
      },
      investigation_id: activeJob?.id,
      timestamp: new Date().toISOString(),
      results: jobResults
    }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `dossier_osint_${lastName.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Helper to get image URL from result
  const getImageUrl = (r: SearchResult): string | null => {
    return (
      r.image_url ||
      r.raw_data?.image_url ||
      r.raw_data?.avatar_url ||
      r.raw_data?.img_src ||
      r.raw_data?.thumbnail_src ||
      r.raw_data?.thumbnail ||
      null
    );
  };

  // Categorize results
  const categorizedCounts = useMemo(() => {
    const counts = {
      ALL: jobResults.length,
      IMAGES: 0,
      PROFILES: 0,
      CODE: 0,
      ACADEMIC: 0,
      WEB: 0,
    };
    jobResults.forEach((r) => {
      const c = (r.connector || '').toLowerCase();
      const hasImg = !!getImageUrl(r);
      if (hasImg || c.includes('images') || r.raw_data?.is_image) {
        counts.IMAGES++;
      }
      if (c.includes('github') || c.includes('gitlab')) {
        counts.CODE++;
        counts.PROFILES++;
      } else if (c.includes('orcid') || c.includes('crossref') || c.includes('openalex')) {
        counts.ACADEMIC++;
      } else if (!c.includes('images')) {
        counts.WEB++;
      }
    });
    return counts;
  }, [jobResults]);

  const filteredResults = useMemo(() => {
    return jobResults.filter((r) => {
      const c = (r.connector || '').toLowerCase();
      const img = getImageUrl(r);
      const isImg = !!img || c.includes('images') || r.raw_data?.is_image;

      // Category filter
      if (selectedCategory === 'IMAGES' && !isImg) return false;
      if (selectedCategory === 'CODE' && !(c.includes('github') || c.includes('gitlab'))) return false;
      if (selectedCategory === 'PROFILES' && !(c.includes('github') || c.includes('gitlab') || (r.title && r.title.toLowerCase().includes('profile')))) return false;
      if (selectedCategory === 'ACADEMIC' && !(c.includes('orcid') || c.includes('crossref') || c.includes('openalex'))) return false;
      if (selectedCategory === 'WEB' && (c.includes('github') || c.includes('gitlab') || c.includes('orcid') || c.includes('crossref') || c.includes('openalex') || c.includes('images'))) return false;

      // Text search
      if (searchFilter.trim()) {
        const query = searchFilter.toLowerCase();
        const matchesTitle = r.title && r.title.toLowerCase().includes(query);
        const matchesSnippet = r.snippet && r.snippet.toLowerCase().includes(query);
        const matchesConnector = r.connector && r.connector.toLowerCase().includes(query);
        return matchesTitle || matchesSnippet || matchesConnector;
      }
      return true;
    });
  }, [jobResults, selectedCategory, searchFilter]);

  const getConnectorBadgeStyle = (connector: string) => {
    const c = connector.toLowerCase();
    if (c.includes('images')) {
      return 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/40 dark:text-pink-300 dark:border-pink-800';
    }
    if (c.includes('github')) {
      return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800';
    }
    if (c.includes('gitlab')) {
      return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800';
    }
    if (c.includes('orcid')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
    }
    if (c.includes('crossref') || c.includes('openalex')) {
      return 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800';
    }
    return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800';
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-6xl mx-auto w-full transition-colors duration-200">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <span className="text-[11px] font-bold tracking-wider uppercase text-blue-600 dark:text-blue-400">
              Module A — People Search
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
            Enquête & Profilage OSINT Multi-Sources
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Recherche asynchrone unifiée : SearXNG (Web & Images), GitHub, GitLab, ORCID, Crossref & OpenAlex avec extraction sémantique.
          </p>
        </div>

        {jobResults.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-xs shadow-xs transition"
            >
              <Download size={14} />
              <span>Exporter (JSON)</span>
            </button>
            <Link
              href="/graph"
              className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs shadow-sm transition"
            >
              <Share2 size={14} />
              <span>Cartographie Graphe</span>
            </Link>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-2xl text-rose-700 dark:text-rose-300 text-sm flex items-center gap-3">
          <XCircle size={18} className="shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Search Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-[#0f172a] border border-slate-200/90 dark:border-slate-800/80 rounded-2xl p-6 md:p-8 space-y-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <UserCheck size={18} className="text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Identité de la cible à investiguer
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">* Champs essentiels</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Prénom
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Ex : Oussama"
              className="w-full bg-slate-50/70 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Nom de famille *
            </label>
            <input
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Ex : Ben Hassine"
              className="w-full bg-slate-50/70 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Briefcase size={14} className="text-blue-600 dark:text-blue-400" />
              <span>Profession / Rôle</span>
            </label>
            <input
              type="text"
              value={profession}
              onChange={(e) => setProfession(e.target.value)}
              placeholder="Ex : Chercheur IA, Architecte Cloud..."
              className="w-full bg-slate-50/70 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Building2 size={14} className="text-emerald-600 dark:text-emerald-400" />
              <span>Organisation / Entreprise</span>
            </label>
            <input
              type="text"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              placeholder="Ex : Université, Startup, CNRS..."
              className="w-full bg-slate-50/70 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <MapPin size={14} className="text-rose-600 dark:text-rose-400" />
              <span>Localisation (Pays, Ville)</span>
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ex : Paris, Tunis, Remote..."
              className="w-full bg-slate-50/70 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Tag size={14} className="text-purple-600 dark:text-purple-400" />
              <span>Mots-clés discriminants</span>
            </label>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="Ex : LLM, Open Source, Deep Learning"
              className="w-full bg-slate-50/70 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
            />
          </div>
        </div>

        {/* Modes & Depths */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Mode d'investigation
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMode('PROFESSIONAL')}
                className={`p-3.5 rounded-xl border text-left transition ${
                  mode === 'PROFESSIONAL'
                    ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-900/20 text-blue-900 dark:text-blue-300 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <div className="text-xs font-bold text-blue-600 dark:text-blue-400">Recherche Pro</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                  Dépôts de code, profils tech, ORCID & publications
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMode('FULL_WEB')}
                className={`p-3.5 rounded-xl border text-left transition ${
                  mode === 'FULL_WEB'
                    ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-900/20 text-blue-900 dark:text-blue-300 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <div className="text-xs font-bold text-blue-600 dark:text-blue-400">Web Complet</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                  Presse, articles, métamoteur SearXNG, images & mentions web
                </div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Profondeur de scan
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['QUICK', 'DEEP', 'EXTENDED'] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDepth(d)}
                  className={`py-2.5 px-3 rounded-xl border text-center text-xs font-bold transition ${
                    depth === d
                      ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
              QUICK : sources directes (10-20s) • DEEP : profilage étendu • EXTENDED : graphe exhaustif
            </p>
          </div>
        </div>

        {/* Options & Submit */}
        <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
            <label className="flex items-center gap-2 cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={enableAI}
                onChange={(e) => setEnableAI(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500"
              />
              <span>Enrichissement IA LiteLLM (ai.oussamma.tn)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={useExisting}
                onChange={(e) => setUseExisting(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500"
              />
              <span>Interroger la base de connaissances</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm shadow-md shadow-blue-600/20 transition disabled:opacity-50"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />}
            <span>Lancer l'investigation</span>
          </button>
        </div>
      </form>

      {/* Progress & Live Status Box */}
      {activeJob && (
        <div className="bg-white dark:bg-[#0f172a] border border-slate-200/90 dark:border-slate-800/80 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {activeJob.status === 'RUNNING' && <Loader2 className="animate-spin text-blue-600 dark:text-blue-400" size={22} />}
              {activeJob.status === 'COMPLETED' && <CheckCircle2 className="text-emerald-500" size={22} />}
              {activeJob.status === 'CANCELLED' && <XCircle className="text-amber-500" size={22} />}
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Enquête #{activeJob.id.slice(0, 8)}</span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    activeJob.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' :
                    activeJob.status === 'RUNNING' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400' :
                    'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                  }`}>
                    {activeJob.status} ({activeJob.progress_pct}%)
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{activeJob.progress_step}</p>
              </div>
            </div>

            {activeJob.status === 'RUNNING' && (
              <button
                onClick={handleCancel}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 rounded-xl text-xs font-semibold transition"
              >
                Interrompre
              </button>
            )}
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 dark:bg-slate-900 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 dark:bg-blue-500 h-full transition-all duration-500 rounded-full"
              style={{ width: `${activeJob.progress_pct}%` }}
            />
          </div>
        </div>
      )}

      {/* OSINT INVESTIGATION DOSSIER & RESULTS */}
      {jobResults.length > 0 && (
        <div className="space-y-6 pt-2">
          {/* Target Consolidated Identity Card */}
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200/90 dark:border-slate-800/80 rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-xl font-extrabold text-white shadow-md">
                  {(firstName ? firstName[0] : '') + (lastName ? lastName[0] : '')}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                      {firstName} {lastName}
                    </h2>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
                      <ShieldCheck size={12} />
                      <span>Dossier Consolidé</span>
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {profession && <span>{profession}</span>}
                    {organization && (
                      <span className="flex items-center gap-1">
                        <Building2 size={12} />
                        <span>{organization}</span>
                      </span>
                    )}
                    {(city || country) && (
                      <span className="flex items-center gap-1">
                        <MapPin size={12} />
                        <span>{[city, country].filter(Boolean).join(', ')}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/ai`}
                  className="flex items-center gap-1.5 px-3 py-2 bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-xl text-xs font-semibold hover:bg-purple-100 transition"
                >
                  <Sparkles size={14} />
                  <span>Interroger l'IA</span>
                </Link>
                <Link
                  href={`/graph`}
                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-semibold hover:bg-blue-100 transition"
                >
                  <Share2 size={14} />
                  <span>Voir le graphe</span>
                </Link>
              </div>
            </div>

            {/* Metrics Ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-6">
              <div className="p-3.5 bg-slate-50/80 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Sources</span>
                <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{categorizedCounts.ALL}</div>
                <span className="text-[10px] text-slate-500">Collectées</span>
              </div>
              <div className="p-3.5 bg-slate-50/80 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-pink-600 dark:text-pink-400">Images & Médias</span>
                <div className="text-xl font-bold text-pink-600 dark:text-pink-400 mt-0.5">{categorizedCounts.IMAGES}</div>
                <span className="text-[10px] text-slate-500">Photos & Avatars</span>
              </div>
              <div className="p-3.5 bg-slate-50/80 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">Dépôts & Code</span>
                <div className="text-xl font-bold text-purple-600 dark:text-purple-400 mt-0.5">{categorizedCounts.CODE}</div>
                <span className="text-[10px] text-slate-500">GitHub & GitLab</span>
              </div>
              <div className="p-3.5 bg-slate-50/80 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Publications</span>
                <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{categorizedCounts.ACADEMIC}</div>
                <span className="text-[10px] text-slate-500">ORCID & DOIs</span>
              </div>
              <div className="p-3.5 bg-slate-50/80 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Mentions Web</span>
                <div className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-0.5">{categorizedCounts.WEB}</div>
                <span className="text-[10px] text-slate-500">SearXNG Articles</span>
              </div>
            </div>
          </div>

          {/* Results Navigation Bar: Tabs + Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            {/* Category Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-x-auto">
              <button
                onClick={() => setSelectedCategory('ALL')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  selectedCategory === 'ALL'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <span>Toutes ({categorizedCounts.ALL})</span>
              </button>

              <button
                onClick={() => setSelectedCategory('IMAGES')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  selectedCategory === 'IMAGES'
                    ? 'bg-white dark:bg-slate-800 text-pink-600 dark:text-pink-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <ImageIcon size={13} />
                <span>Images & Médias ({categorizedCounts.IMAGES})</span>
              </button>

              <button
                onClick={() => setSelectedCategory('CODE')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  selectedCategory === 'CODE'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Code2 size={13} />
                <span>Code ({categorizedCounts.CODE})</span>
              </button>

              <button
                onClick={() => setSelectedCategory('ACADEMIC')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  selectedCategory === 'ACADEMIC'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <GraduationCap size={13} />
                <span>Publications ({categorizedCounts.ACADEMIC})</span>
              </button>

              <button
                onClick={() => setSelectedCategory('WEB')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  selectedCategory === 'WEB'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Newspaper size={13} />
                <span>Web & Presse ({categorizedCounts.WEB})</span>
              </button>
            </div>

            {/* Instant Filter input */}
            <div className="relative min-w-[220px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filtrer dans les résultats..."
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Results List */}
          {filteredResults.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 text-sm">
              Aucun résultat ne correspond aux filtres sélectionnés.
            </div>
          ) : selectedCategory === 'IMAGES' ? (
            /* Dedicated Image Gallery Grid */
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {filteredResults.map((r, i) => {
                const img = getImageUrl(r);
                return (
                  <div
                    key={r.id || i}
                    className="group bg-white dark:bg-[#0f172a] border border-slate-200/90 dark:border-slate-800/80 rounded-2xl overflow-hidden hover:border-pink-500/50 hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div className="relative aspect-square w-full bg-slate-100 dark:bg-slate-900 overflow-hidden cursor-pointer" onClick={() => img && setPreviewImage(img)}>
                      {img ? (
                        <img
                          src={img}
                          alt={r.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          loading="lazy"
                          onError={(e: any) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <ImageIcon size={32} />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            img && setPreviewImage(img);
                          }}
                          className="p-2 bg-white/90 text-slate-800 rounded-full hover:bg-white transition shadow-sm"
                          title="Agrandir l'image"
                        >
                          <Eye size={16} />
                        </button>
                        <a
                          href={r.source_url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 bg-white/90 text-slate-800 rounded-full hover:bg-white transition shadow-sm"
                          title="Visiter la page source"
                        >
                          <ExternalLink size={16} />
                        </a>
                      </div>
                    </div>

                    <div className="p-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getConnectorBadgeStyle(r.connector)}`}>
                          {r.connector}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteResult(r.id)}
                          disabled={deletingId === r.id}
                          title="Supprimer ce résultat"
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition"
                        >
                          {deletingId === r.id ? <Loader2 size={13} className="animate-spin text-rose-500" /> : <Trash2 size={13} />}
                        </button>
                      </div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 truncate" title={r.title}>
                        {r.title}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {r.source_url.replace(/^https?:\/\//, '').split('/')[0]}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Standard OSINT Results Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredResults.map((r, i) => {
                const img = getImageUrl(r);
                return (
                  <div
                    key={r.id || i}
                    className="bg-white dark:bg-[#0f172a] border border-slate-200/90 dark:border-slate-800/80 rounded-2xl p-5 space-y-3 hover:border-blue-500/50 hover:shadow-sm transition flex flex-col justify-between"
                  >
                    <div className="space-y-2.5">
                      {/* Header: Connector badge, External link & Delete button */}
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center gap-1 font-bold text-[11px] uppercase tracking-wider px-2.5 py-0.5 rounded-md border ${getConnectorBadgeStyle(r.connector)}`}>
                          {r.connector}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleCopyCitation(`${r.title} — ${r.source_url}`, i)}
                            title="Copier la référence"
                            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                          >
                            {copiedIndex === i ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                          </button>
                          <a
                            href={r.source_url}
                            target="_blank"
                            rel="noreferrer"
                            title="Consulter la source originale"
                            className="flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline p-1"
                          >
                            <ExternalLink size={13} />
                          </a>
                          <button
                            type="button"
                            onClick={() => handleDeleteResult(r.id)}
                            disabled={deletingId === r.id}
                            title="Supprimer ce résultat de l'enquête"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                          >
                            {deletingId === r.id ? <Loader2 size={14} className="animate-spin text-rose-500" /> : <Trash2 size={14} />}
                          </button>
                        </div>
                      </div>

                      {/* Content with thumbnail if present */}
                      <div className="flex gap-3">
                        {img && (
                          <div
                            onClick={() => setPreviewImage(img)}
                            className="shrink-0 w-16 h-16 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 cursor-pointer hover:opacity-90 transition relative group"
                            title="Agrandir l'image"
                          >
                            <img
                              src={img}
                              alt={r.title}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              onError={(e: any) => {
                                e.target.style.display = 'none';
                              }}
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                              <Eye size={14} />
                            </div>
                          </div>
                        )}

                        <div className="flex-1 min-w-0 space-y-1">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                            {r.title}
                          </h3>
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                            {r.snippet || 'Aucune description disponible pour cette source.'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Footer Meta */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="truncate max-w-[200px]" title={r.source_url}>
                        {r.source_url.replace(/^https?:\/\//, '').split('/')[0]}
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">Source vérifiée</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Lightbox Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl overflow-hidden p-2 shadow-2xl border border-slate-200 dark:border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition z-10"
              title="Fermer l'aperçu"
            >
              <X size={18} />
            </button>
            <img
              src={previewImage}
              alt="Aperçu OSINT"
              className="max-h-[80vh] w-auto mx-auto object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
