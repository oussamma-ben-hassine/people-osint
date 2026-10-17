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
    <div className="p-6 md:p-8 space-y-8 max-w-6xl mx-auto w-full">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
          Module C — Base de Connaissances
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Entités structurées (Personnes, Organisations, Projets, Publications) et relations avec preuves sourcées.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('ENTITIES')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'ENTITIES'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Database size={16} />
          <span>Entités indexées ({entities.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('RELATIONS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'RELATIONS'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
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
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  selectedType === t
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                    : 'bg-[#0f172a] text-slate-400 hover:text-slate-200 border border-slate-800'
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
                className="p-5 bg-[#0f172a] border border-slate-800 rounded-xl space-y-3 hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    ent.entity_type === 'Person' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' :
                    ent.entity_type === 'Organization' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                  }`}>
                    {ent.entity_type}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {new Date(ent.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white">{ent.name}</h3>

                {Object.keys(ent.attributes || {}).length > 0 && (
                  <div className="text-[11px] text-slate-400 bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/60 space-y-1">
                    {Object.entries(ent.attributes).slice(0, 3).map(([k, v]: any) => (
                      <div key={k} className="truncate">
                        <span className="font-semibold text-slate-500">{k}:</span> {String(v)}
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
            <div className="p-8 text-center text-slate-500 text-sm bg-[#0f172a] border border-slate-800 rounded-xl">
              Aucune relation documentée enregistrée.
            </div>
          ) : (
            <div className="space-y-3">
              {relations.map((rel, idx) => (
                <div
                  key={idx}
                  className="p-5 bg-[#0f172a] border border-slate-800 rounded-xl space-y-3 hover:border-slate-700 transition"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20 uppercase tracking-wider">
                        {rel.relation_type}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        rel.connection_nature === 'DOCUMENTED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        rel.connection_nature === 'DECLARED' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        Nature : {rel.connection_nature}
                      </span>
                    </div>

                    <span className="text-slate-500 text-[11px]">
                      Indice d'incertitude : <strong className="text-slate-300">{(rel.uncertainty_score * 100).toFixed(0)}%</strong>
                    </span>
                  </div>

                  {/* Evidence snippet */}
                  {rel.evidence && rel.evidence.length > 0 && (
                    <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg text-xs space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Preuve documentaire :</span>
                      <p className="text-slate-300 italic">"{rel.evidence[0].text_snippet}"</p>
                      {rel.evidence[0].source_url && (
                        <a
                          href={rel.evidence[0].source_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-sky-400 hover:underline flex items-center gap-1 pt-1"
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
