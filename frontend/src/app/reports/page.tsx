'use client';

import React, { useEffect, useState } from 'react';
import { FileText, Download, CheckCircle2, ShieldCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { ResearchCase } from '@/lib/types';

export default function ReportsPage() {
  const [cases, setCases] = useState<ResearchCase[]>([]);

  useEffect(() => {
    api.listCases().then(setCases).catch(() => {});
  }, []);

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-5xl mx-auto w-full">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
          Rapports & Exports d'Enquête
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Exportez vos synthèses d'investigation, entités documentées et graphes au format PDF certifié ou JSON standardisé.
        </p>
      </div>

      <div className="space-y-4">
        {cases.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm bg-[#0f172a] border border-slate-800 rounded-2xl">
            Aucun dossier éligible aux rapports actuellement.
          </div>
        ) : (
          <div className="space-y-3">
            {cases.map((c) => (
              <div
                key={c.id}
                className="p-5 bg-[#0f172a] border border-slate-800 rounded-2xl flex items-center justify-between hover:border-slate-700 transition"
              >
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white">{c.title}</h3>
                  <p className="text-xs text-slate-400">
                    Cible : <span className="text-slate-200 font-semibold">{c.target_name}</span> • Mode : {c.mode}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Horodatage : {new Date(c.created_at).toLocaleString('fr-FR')}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <a
                    href={`/api/v1/exports/cases/${c.id}/pdf`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-sky-600/20 transition"
                  >
                    <Download size={14} />
                    <span>Rapport PDF</span>
                  </a>
                  <a
                    href={`/api/v1/exports/cases/${c.id}/json`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition"
                  >
                    <FileText size={14} />
                    <span>JSON RGPD</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
