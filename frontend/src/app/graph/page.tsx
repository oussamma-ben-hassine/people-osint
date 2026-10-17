'use client';

import React, { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import {
  Share2, ZoomIn, ZoomOut, Maximize2, RotateCcw,
  Info, ExternalLink, ShieldAlert, CheckCircle2
} from 'lucide-react';
import { api } from '@/lib/api';
import { CytoscapeGraph } from '@/lib/types';

export default function GraphPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;

    api.getGraph()
      .then((data) => {
        if (!containerRef.current) return;

        const isDark = document.documentElement.classList.contains('dark');

        const cy = cytoscape({
          container: containerRef.current,
          elements: [
            ...data.nodes.map((n) => ({
              group: 'nodes' as const,
              data: {
                id: n.data.id,
                label: n.data.label,
                type: n.data.entity_type,
                ...n.data.attributes,
              },
            })),
            ...data.edges.map((e) => ({
              group: 'edges' as const,
              data: {
                id: e.data.id,
                source: e.data.source,
                target: e.data.target,
                label: e.data.label,
                nature: e.data.connection_nature,
                uncertainty: e.data.uncertainty_score,
                evidenceCount: e.data.evidence_count,
              },
            })),
          ],
          style: [
            {
              selector: 'node',
              style: {
                'background-color': '#2563eb',
                'label': 'data(label)',
                'color': isDark ? '#f8fafc' : '#0f172a',
                'font-size': '11px',
                'font-family': 'Plus Jakarta Sans, sans-serif',
                'text-valign': 'bottom',
                'text-margin-y': 6,
                'width': 36,
                'height': 36,
                'border-width': 2,
                'border-color': '#60a5fa',
              },
            },
            {
              selector: 'node[type = "Organization"]',
              style: {
                'background-color': '#059669',
                'border-color': '#34d399',
                'shape': 'round-rectangle',
                'width': 44,
                'height': 34,
              },
            },
            {
              selector: 'node[type = "Project"]',
              style: {
                'background-color': '#7c3aed',
                'border-color': '#a78bfa',
                'shape': 'hexagon',
                'width': 38,
                'height': 38,
              },
            },
            {
              selector: 'node[type = "Publication"]',
              style: {
                'background-color': '#d97706',
                'border-color': '#fbbf24',
                'shape': 'diamond',
                'width': 36,
                'height': 36,
              },
            },
            {
              selector: 'edge',
              style: {
                'width': 2,
                'line-color': '#94a3b8',
                'target-arrow-color': '#94a3b8',
                'target-arrow-shape': 'triangle',
                'curve-style': 'bezier',
                'label': 'data(label)',
                'font-size': '9px',
                'font-family': 'Plus Jakarta Sans, sans-serif',
                'color': isDark ? '#cbd5e1' : '#475569',
                'text-rotation': 'autorotate',
                'text-background-opacity': 0.85,
                'text-background-color': isDark ? '#090d16' : '#ffffff',
                'text-background-padding': '3px',
              },
            },
            {
              selector: 'edge[nature = "DOCUMENTED"]',
              style: {
                'line-color': '#10b981',
                'target-arrow-color': '#10b981',
                'width': 2.5,
              },
            },
            {
              selector: 'edge[nature = "DECLARED"]',
              style: {
                'line-color': '#f59e0b',
                'target-arrow-color': '#f59e0b',
                'line-style': 'dashed',
              },
            },
            {
              selector: 'edge[nature = "UNCERTAIN"]',
              style: {
                'line-color': '#f43f5e',
                'target-arrow-color': '#f43f5e',
                'line-style': 'dotted',
              },
            },
            {
              selector: ':selected',
              style: {
                'border-width': 4,
                'border-color': '#2563eb',
                'line-color': '#2563eb',
                'target-arrow-color': '#2563eb',
              },
            },
          ],
          layout: {
            name: 'cose',
            animate: false,
            nodeOverlap: 20,
            idealEdgeLength: 100,
          },
        });

        cy.on('tap', 'node, edge', (evt) => {
          setSelectedItem(evt.target.data());
        });

        cy.on('tap', (evt) => {
          if (evt.target === cy) {
            setSelectedItem(null);
          }
        });

        cyRef.current = cy;
        setLoading(false);
      })
      .catch(() => setLoading(false));

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
      }
    };
  }, []);

  const handleZoomIn = () => cyRef.current?.zoom(cyRef.current.zoom() * 1.25);
  const handleZoomOut = () => cyRef.current?.zoom(cyRef.current.zoom() * 0.8);
  const handleFit = () => cyRef.current?.fit();
  const handleReset = () => cyRef.current?.reset();

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-60px)] md:h-screen overflow-hidden relative transition-colors duration-200">
      {/* Top Controls Bar */}
      <div className="p-4 bg-white/95 dark:bg-[#0c1120]/90 border-b border-slate-200/90 dark:border-slate-800 backdrop-blur-md flex items-center justify-between z-10">
        <div>
          <span className="text-[10px] font-bold tracking-wider uppercase text-blue-600 dark:text-blue-400">
            Module D — Relationship Explorer
          </span>
          <h1 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Share2 size={18} className="text-blue-600 dark:text-blue-400" />
            <span>Cartographie Interactive Cytoscape.js</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Affiliations documentées, cosignatures, projets et preuves corroborées.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-xs">
            <button onClick={handleZoomIn} title="Zoom Avant" className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg">
              <ZoomIn size={16} />
            </button>
            <button onClick={handleZoomOut} title="Zoom Arrière" className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg">
              <ZoomOut size={16} />
            </button>
            <button onClick={handleFit} title="Ajuster la vue" className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg">
              <Maximize2 size={16} />
            </button>
            <button onClick={handleReset} title="Recentrer" className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg">
              <RotateCcw size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Graph Canvas */}
      <div className="flex-1 relative bg-slate-50 dark:bg-[#090d16]">
        <div ref={containerRef} className="w-full h-full" />

        {/* Legend Overlay */}
        <div className="absolute bottom-4 left-4 p-3.5 bg-white/95 dark:bg-[#0f172a]/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-xl text-[11px] space-y-2 pointer-events-none z-10 shadow-sm">
          <span className="font-bold text-slate-800 dark:text-slate-300 block mb-1">Légende des liens :</span>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1 bg-emerald-500 rounded" />
            <span className="text-slate-600 dark:text-slate-300">Documentée (certaine)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1 bg-amber-500 rounded border-b border-dashed" />
            <span className="text-slate-600 dark:text-slate-300">Déclarée volontairement</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1 bg-rose-500 rounded border-b border-dotted" />
            <span className="text-slate-600 dark:text-slate-300">Rapprochement incertain</span>
          </div>
        </div>

        {/* Node/Edge Inspector Drawer */}
        {selectedItem && (
          <div className="absolute top-4 right-4 w-80 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-lg space-y-4 z-20">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Info size={16} className="text-blue-600 dark:text-blue-400" />
                <span>{selectedItem.source ? 'Détail de la Relation' : 'Fiche Entité'}</span>
              </h3>
              <button onClick={() => setSelectedItem(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-xs">
                ✕
              </button>
            </div>

            {selectedItem.source ? (
              // Edge Details
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 uppercase tracking-wider font-bold text-[10px]">Type de lien :</span>
                  <p className="text-blue-600 dark:text-blue-400 font-bold text-sm mt-0.5">{selectedItem.label}</p>
                </div>
                <div>
                  <span className="text-slate-400 uppercase tracking-wider font-bold text-[10px]">Nature :</span>
                  <p className="text-slate-800 dark:text-slate-200 mt-0.5 font-medium">{selectedItem.nature}</p>
                </div>
                <div>
                  <span className="text-slate-400 uppercase tracking-wider font-bold text-[10px]">Incertitude estimée :</span>
                  <p className="text-slate-800 dark:text-slate-200 mt-0.5">{(selectedItem.uncertainty * 100).toFixed(0)}%</p>
                </div>
                <div>
                  <span className="text-slate-400 uppercase tracking-wider font-bold text-[10px]">Preuves associées :</span>
                  <p className="text-slate-800 dark:text-slate-200 mt-0.5">{selectedItem.evidenceCount} preuve(s) documentaire(s)</p>
                </div>
              </div>
            ) : (
              // Node Details
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 uppercase tracking-wider font-bold text-[10px]">Nom / Titre :</span>
                  <p className="text-slate-900 dark:text-white font-bold text-sm mt-0.5">{selectedItem.label}</p>
                </div>
                <div>
                  <span className="text-slate-400 uppercase tracking-wider font-bold text-[10px]">Type d'entité :</span>
                  <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-bold border border-blue-200 dark:border-blue-800">
                    {selectedItem.type}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
