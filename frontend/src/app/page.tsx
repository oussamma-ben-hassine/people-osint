'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Search, BookOpen, Database, Share2, Sparkles, ShieldCheck,
  TrendingUp, Clock, ArrowRight, ShieldAlert, CheckCircle2, AlertTriangle,
  FolderGit2, Users, FileText
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
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full transition-colors duration-200">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200/80 dark:border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold tracking-wider uppercase text-emerald-600 dark:text-emerald-400">
              Écosystème Actif & Connecté
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
            Tableau de Bord — People OSINT
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Moteur d'enquête multi-sources, base de connaissances relationnelle et analyseur sémantique d'identités.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/search"
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs md:text-sm shadow-md shadow-blue-600/20 transition"
          >
            <Search size={16} />
            <span>Lancer une enquête</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        <div className="bg-white dark:bg-[#0f172a] border border-slate-200/90 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs hover:border-blue-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Enquêtes</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center">
              <Search size={16} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-3">{stats.searches}</div>
          <p className="text-[11px] text-slate-400 mt-1">Collectes asynchrones</p>
        </div>

        <div className="bg-white dark:bg-[#0f172a] border border-slate-200/90 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs hover:border-emerald-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Dossiers</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 flex items-center justify-center">
              <BookOpen size={16} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-3">{stats.cases}</div>
          <p className="text-[11px] text-slate-400 mt-1">Snapshots préservés</p>
        </div>

        <div className="bg-white dark:bg-[#0f172a] border border-slate-200/90 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs hover:border-purple-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Entités</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 flex items-center justify-center">
              <Database size={16} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-3">{stats.entities}</div>
          <p className="text-[11px] text-slate-400 mt-1">Profils, orgs, dépôts</p>
        </div>

        <div className="bg-white dark:bg-[#0f172a] border border-slate-200/90 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs hover:border-amber-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Relations</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 flex items-center justify-center">
              <Share2 size={16} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-3">{stats.relations}</div>
          <p className="text-[11px] text-slate-400 mt-1">Preuves & affiliations</p>
        </div>
      </div>

      {/* Main Grid: Recent Searches & Connectors */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Searches */}
        <div className="lg:col-span-2 bg-white dark:bg-[#0f172a] border border-slate-200/90 dark:border-slate-800/80 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock size={18} className="text-blue-600 dark:text-blue-400" />
              <span>Dernières enquêtes asynchrones</span>
            </h2>
            <Link href="/library" className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold">
              <span>Voir la bibliothèque</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="space-y-3">
            {recentJobs.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                Aucune recherche effectuée pour le moment.
              </div>
            ) : (
              recentJobs.map((job) => (
                <div
                  key={job.id}
                  className="p-4 bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/60 rounded-xl flex items-center justify-between hover:border-blue-500/40 transition"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {job.query_params.first_name || ''} {job.query_params.last_name || 'Cible'}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="capitalize">{job.mode.toLowerCase().replace('_', ' ')}</span>
                      <span>•</span>
                      <span>Profondeur : {job.depth}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                      job.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800' :
                      job.status === 'RUNNING' ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800 animate-pulse' :
                      'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}>
                      {job.status === 'RUNNING' ? `${job.progress_pct}%` : job.status}
                    </span>
                    <Link
                      href={`/library`}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg transition"
                    >
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Platform Status & Connectors */}
        <div className="bg-white dark:bg-[#0f172a] border border-slate-200/90 dark:border-slate-800/80 rounded-2xl p-6 space-y-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-600 dark:text-emerald-400" />
              <span>Connecteurs & Intégrations</span>
            </h2>
            <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
              Opérationnels
            </span>
          </div>

          <div className="space-y-2.5">
            {[
              { name: 'SSO Central', domain: 'sso-a.oussamma.tn', status: 'Actif (PKCE)' },
              { name: 'LiteLLM IA Gateway', domain: 'ai.oussamma.tn', status: 'Actif (Flash & Embeddings)' },
              { name: 'SearXNG Metasearch', domain: 'people-searxng', status: 'Connecté' },
              { name: 'GitHub & GitLab API', domain: 'api.github.com', status: 'Actif' },
              { name: 'ORCID & Crossref', domain: 'Scholarly Graph', status: 'Actif' },
              { name: 'OpenAlex Graph', domain: 'api.openalex.org', status: 'Actif' },
              { name: 'Exposure Threat Intel', domain: 'haveibeenpwned.com', status: 'Prêt' },
            ].map((conn) => (
              <div key={conn.name} className="flex items-center justify-between p-2.5 bg-slate-50/70 dark:bg-slate-900/50 rounded-xl text-xs border border-slate-100 dark:border-slate-800/50">
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{conn.name}</p>
                  <p className="text-[10px] text-slate-400">{conn.domain}</p>
                </div>
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold text-[11px]">
                  <CheckCircle2 size={12} />
                  <span>{conn.status}</span>
                </span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Conformité stricte RGPD, déduplication intelligente et gestion souveraine des dossiers.
          </div>
        </div>
      </div>
    </div>
  );
}
