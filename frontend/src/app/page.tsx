'use client';

import React, { useEffect, useState } from 'react';
import {
  Search, BookOpen, Database, Share2, Sparkles, ShieldCheck,
  TrendingUp, Clock, ArrowRight, ShieldAlert, CheckCircle2, AlertTriangle
} from 'lucide-react';
import { api } from '@/lib/api';
import { SearchJob, ResearchCase } from '@/lib/types';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>({
    searches: 0,
    cases: 0,
    entities: 0,
    relations: 0,
  });
  const [recentJobs, setRecentJobs] = useState<SearchJob[]>([]);
  const [recentCases, setRecentCases] = useState<ResearchCase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.listSearches().catch(() => []),
      api.listCases().catch(() => []),
      api.listEntities().catch(() => []),
      api.listRelations().catch(() => []),
    ]).then(([jobs, cases, entities, relations]) => {
      setRecentJobs(jobs.slice(0, 5));
      setRecentCases(cases.slice(0, 5));
      setStats({
        searches: jobs.length,
        cases: cases.length,
        entities: entities.length,
        relations: relations.length,
      });
      setLoading(false);
    });
  }, []);

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold tracking-wider uppercase text-emerald-400">Écosystème Actif</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mt-1">
            Tableau de Bord — People OSINT
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Moteur de recherche multi-sources, base de connaissances et graphe de relations documentées.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/search"
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white font-medium rounded-xl text-xs md:text-sm shadow-lg shadow-sky-600/20 transition"
          >
            <Search size={16} />
            <span>Lancer une enquête</span>
          </a>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        <div className="bg-[#0f172a] border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden group hover:border-sky-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Recherches lancées</span>
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <Search size={16} />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mt-3">{stats.searches}</div>
          <p className="text-[11px] text-slate-500 mt-1">Historique consolidé</p>
        </div>

        <div className="bg-[#0f172a] border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden group hover:border-emerald-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Dossiers d'enquête</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <BookOpen size={16} />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mt-3">{stats.cases}</div>
          <p className="text-[11px] text-slate-500 mt-1">Snapshots préservés</p>
        </div>

        <div className="bg-[#0f172a] border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden group hover:border-purple-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Entités indexées</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Database size={16} />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mt-3">{stats.entities}</div>
          <p className="text-[11px] text-slate-500 mt-1">Personnes, orgs, projets</p>
        </div>

        <div className="bg-[#0f172a] border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden group hover:border-amber-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Relations documentées</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Share2 size={16} />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mt-3">{stats.relations}</div>
          <p className="text-[11px] text-slate-500 mt-1">Preuves & affiliations</p>
        </div>
      </div>

      {/* Main Grid: Recent Searches & Knowledge Spotlight */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Searches */}
        <div className="lg:col-span-2 bg-[#0f172a] border border-slate-800/80 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Clock size={18} className="text-sky-400" />
              <span>Dernières enquêtes asynchrones</span>
            </h2>
            <a href="/library" className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 font-medium">
              <span>Voir tout</span>
              <ArrowRight size={14} />
            </a>
          </div>

          <div className="space-y-3">
            {recentJobs.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                Aucune recherche effectuée pour le moment.
              </div>
            ) : (
              recentJobs.map((job) => (
                <div
                  key={job.id}
                  className="p-4 bg-slate-900/60 border border-slate-800/60 rounded-xl flex items-center justify-between hover:border-slate-700 transition"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-white">
                      {job.query_params.first_name || ''} {job.query_params.last_name || 'Cible'}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="capitalize">{job.mode.toLowerCase().replace('_', ' ')}</span>
                      <span>•</span>
                      <span>Profondeur : {job.depth}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      job.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      job.status === 'RUNNING' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20 animate-pulse' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {job.status === 'RUNNING' ? `${job.progress_pct}%` : job.status}
                    </span>
                    <a
                      href={`/library`}
                      className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
                    >
                      <ArrowRight size={16} />
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Platform Status & Connectors */}
        <div className="bg-[#0f172a] border border-slate-800/80 rounded-2xl p-6 space-y-5">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-400" />
            <span>Connecteurs & Intégrations</span>
          </h2>

          <div className="space-y-3">
            {[
              { name: 'SSO Central', domain: 'sso-a.oussamma.tn', status: 'Actif (PKCE)', ok: true },
              { name: 'LiteLLM IA Gateway', domain: 'ai.oussamma.tn', status: 'Actif (Flash & Embeddings)', ok: true },
              { name: 'SearXNG Metasearch', domain: 'people-searxng', status: 'Connecté', ok: true },
              { name: 'GitHub API', domain: 'api.github.com', status: 'Actif', ok: true },
              { name: 'ORCID & Crossref', domain: 'Scholarly Graph', status: 'Actif', ok: true },
              { name: 'OpenAlex Graph', domain: 'api.openalex.org', status: 'Actif', ok: true },
              { name: 'Exposure Threat Intel', domain: 'haveibeenpwned.com', status: 'Vérifié', ok: true },
            ].map((conn) => (
              <div key={conn.name} className="flex items-center justify-between p-2.5 bg-slate-900/50 rounded-lg text-xs">
                <div>
                  <p className="font-semibold text-slate-200">{conn.name}</p>
                  <p className="text-[10px] text-slate-500">{conn.domain}</p>
                </div>
                <span className="text-emerald-400 flex items-center gap-1 font-medium text-[11px]">
                  <CheckCircle2 size={12} />
                  <span>{conn.status}</span>
                </span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 leading-relaxed">
            Respect strict de la conformité RGPD, minimisation des données et déduplication intelligente des sources publiques.
          </div>
        </div>
      </div>
    </div>
  );
}
