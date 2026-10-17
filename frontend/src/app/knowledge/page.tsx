'use client';

import React, { useEffect, useState } from 'react';
import {
  Database, UserCheck, Building2, FolderGit2, BookOpen,
  Link2, CheckCircle2, AlertCircle, ExternalLink, Filter
} from 'lucide-react';
import { api } from '@/lib/api';
import { KnowledgeEntity, KnowledgeRelation } from '@/lib/types';

export default function KnowledgePage() {
  const [entities, setEntities] = useState<KnowledgeEntity[]>([]);
  const [relations, setRelations] = useState<KnowledgeRelation[]>([]);
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'ENTITIES' | 'RELATIONS'>('ENTITIES');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.listEntities(),
      api.listRelations(),
    ]).then(([ents, rels]) => {
      setEntities(ents);
      setRelations(rels);
      setLoading(false);
    });
  }, []);

  const filteredEntities = selectedType === 'ALL'
    ? entities
    : entities.filter((e) => e.entity_type === selectedType);

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-6xl mx-auto w-full transition-colors duration-200">
      <div className="pb-4 border-b border-slate-200/80 dark:border-slate-800/80">
        <span className="text-xs font-bold tracking-wider uppercase text-blue-600 dark:text-blue-400">
          Module C — Knowledge Base
        </span>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
          Base de Connaissances Relationnelle
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Entités structurées (Personnes, Organisations, Projets, Publications) et relations corroborées avec preuves documentaires.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('ENTITIES')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'ENTITIES'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Database size={16} />
          <span>Entités indexées ({entities.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('RELATIONS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'RELATIONS'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Link2 size={16} />
          <span>Relations sourcées ({relations.length})</span>
        </button>
      </div>

      {activeTab === 'ENTITIES' ? (
        <div className="space-y-6">
          {/* Entity Type Filter */}
          <div className="flex flex-wrap gap-2">
            {['ALL', 'Person', 'Organization', 'Project', 'Publication'].map((t) => (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  selectedType === t
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'
                    : 'bg-white dark:bg-[#0f172a] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200/90 dark:border-slate-800'
                }`}
              >
                {t === 'ALL' ? 'Toutes les entités' : t}
              </button>
            ))}
          </div>

          {/* Entities Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filteredEntities.map((ent) => (
              <div
                key={ent.id}
                className="p-5 bg-white dark:bg-[#0f172a] border border-slate-200/90 dark:border-slate-800/80 rounded-2xl space-y-3 hover:border-blue-500/40 shadow-xs transition"
              >
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    ent.entity_type === 'Person' ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800' :
                    ent.entity_type === 'Organization' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800' :
                    'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800'
                  }`}>
                    {ent.entity_type}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(ent.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white">{ent.name}</h3>

                {Object.keys(ent.attributes || {}).length > 0 && (
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/60 space-y-1">
                    {Object.entries(ent.attributes).slice(0, 3).map(([k, v]: any) => (
                      <div key={k} className="truncate">
                        <span className="font-semibold text-slate-400">{k}:</span> {String(v)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {relations.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl">
              Aucune relation documentée enregistrée.
            </div>
          ) : (
            <div className="space-y-3">
              {relations.map((rel, idx) => (
                <div
                  key={idx}
                  className="p-5 bg-white dark:bg-[#0f172a] border border-slate-200/90 dark:border-slate-800/80 rounded-2xl space-y-3 hover:border-blue-500/40 shadow-xs transition"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800 uppercase tracking-wider">
                        {rel.relation_type}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        rel.connection_nature === 'DOCUMENTED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800' :
                        rel.connection_nature === 'DECLARED' ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800' :
                        'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800'
                      }`}>
                        Nature : {rel.connection_nature}
                      </span>
                    </div>

                    <span className="text-slate-400 text-[11px]">
                      Indice d'incertitude : <strong className="text-slate-700 dark:text-slate-300">{(rel.uncertainty_score * 100).toFixed(0)}%</strong>
                    </span>
                  </div>

                  {/* Evidence snippet */}
                  {rel.evidence && rel.evidence.length > 0 && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 rounded-xl text-xs space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Preuve documentaire :</span>
                      <p className="text-slate-700 dark:text-slate-300 italic">"{rel.evidence[0].text_snippet}"</p>
                      {rel.evidence[0].source_url && (
                        <a
                          href={rel.evidence[0].source_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 pt-1"
                        >
                          <span>{rel.evidence[0].source_url}</span>
                          <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
