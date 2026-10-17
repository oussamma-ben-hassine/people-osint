'use client';

import React, { useEffect, useState } from 'react';
import {
  BookOpen, Search, RefreshCw, Trash2, Download,
  Layers, CheckSquare, Square, FileText, ArrowUpDown
} from 'lucide-react';
import { api } from '@/lib/api';
import { ResearchCase } from '@/lib/types';

export default function LibraryPage() {
  const [cases, setCases] = useState<ResearchCase[]>([]);
  const [filterText, setFilterText] = useState('');
  const [selectedCaseIds, setSelectedCaseIds] = useState<string[]>([]);
  const [comparisonResult, setComparisonResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadCases = async () => {
    setLoading(true);
    try {
      const data = await api.listCases();
      setCases(data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    loadCases();
  }, []);

  const toggleSelectCase = (id: string) => {
    if (selectedCaseIds.includes(id)) {
      setSelectedCaseIds(selectedCaseIds.filter((x) => x !== id));
    } else {
      setSelectedCaseIds([...selectedCaseIds, id]);
    }
  };

  const handleCompare = async () => {
    if (selectedCaseIds.length < 2) return;
    try {
      const comp = await api.compareCases(selectedCaseIds);
      setComparisonResult(comp);
    } catch {}
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer définitivement ce dossier et ses snapshots ?')) return;
    try {
      await api.deleteCase(id);
      loadCases();
    } catch {}
  };

  const filtered = cases.filter((c) =>
    c.title.toLowerCase().includes(filterText.toLowerCase()) ||
    c.target_name.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-6xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Module B — Research Library
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Bibliothèque d'enquêtes consolidées, snapshots horodatés et comparaison de cibles.
          </p>
        </div>

        {selectedCaseIds.length >= 2 && (
          <button
            onClick={handleCompare}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-purple-600/20 transition"
          >
            <Layers size={16} />
            <span>Comparer les dossiers ({selectedCaseIds.length})</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center gap-4 bg-[#0f172a] border border-slate-800 rounded-xl px-4 py-2.5">
        <Search size={18} className="text-slate-400" />
        <input
          type="text"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          placeholder="Filtrer les dossiers par nom de cible ou titre..."
          className="bg-transparent text-sm text-white focus:outline-none w-full"
        />
      </div>

      {/* Comparison Modal Display */}
      {comparisonResult && (
        <div className="bg-[#0f172a] border border-purple-500/40 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers size={18} className="text-purple-400" />
              <span>Résultats de la comparaison ({comparisonResult.cases_compared?.join(', ')})</span>
            </h3>
            <button
              onClick={() => setComparisonResult(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Fermer
            </button>
          </div>

          <p className="text-sm text-slate-300 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            {comparisonResult.summary}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-800 space-y-2">
              <h4 className="font-bold text-emerald-400">Entités partagées ({comparisonResult.common_entities?.length || 0})</h4>
              {comparisonResult.common_entities?.length === 0 ? (
                <p className="text-slate-500">Aucune entité commune identifiée.</p>
              ) : (
                <ul className="space-y-1 text-slate-300">
                  {comparisonResult.common_entities.map((e: string, i: number) => (
                    <li key={i}>• {e}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-800 space-y-2">
              <h4 className="font-bold text-sky-400">Entités spécifiques par dossier</h4>
              <div className="space-y-3">
                {Object.entries(comparisonResult.unique_per_case || {}).map(([cName, list]: any) => (
                  <div key={cName}>
                    <span className="font-semibold text-slate-400">{cName} :</span>
                    <span className="text-slate-200 ml-1">{(list as string[]).slice(0, 4).join(', ') || 'Aucune'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cases Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filtered.length === 0 ? (
          <div className="col-span-2 p-12 text-center text-slate-500 text-sm bg-[#0f172a] border border-slate-800 rounded-2xl">
            Aucun dossier de recherche archivé.
          </div>
        ) : (
          filtered.map((c) => {
            const isSelected = selectedCaseIds.includes(c.id);
            return (
              <div
                key={c.id}
                className={`p-6 bg-[#0f172a] border rounded-2xl space-y-4 transition ${
                  isSelected ? 'border-purple-500 shadow-lg shadow-purple-500/10' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleSelectCase(c.id)}
                      className="mt-1 text-purple-400 hover:text-purple-300"
                    >
                      {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                    </button>
                    <div>
                      <h3 className="text-base font-bold text-white">{c.title}</h3>
                      <p className="text-xs text-slate-400">Cible : <span className="text-slate-200 font-semibold">{c.target_name}</span></p>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    {c.mode}
                  </span>
                </div>

                {c.summary_ai && (
                  <p className="text-xs text-slate-400 line-clamp-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 leading-relaxed">
                    {c.summary_ai}
                  </p>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs text-slate-500">
                  <span>Créé le {new Date(c.created_at).toLocaleDateString('fr-FR')}</span>

                  <div className="flex items-center gap-2">
                    <a
                      href={`/api/v1/exports/cases/${c.id}/pdf`}
                      title="Télécharger rapport PDF"
                      className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-sky-400 rounded-lg transition"
                    >
                      <Download size={15} />
                    </a>
                    <a
                      href={`/api/v1/exports/cases/${c.id}/json`}
                      title="Télécharger export JSON"
                      className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-emerald-400 rounded-lg transition"
                    >
                      <FileText size={15} />
                    </a>
                    <button
                      onClick={() => handleDelete(c.id)}
                      title="Supprimer le dossier"
                      className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded-lg transition"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
