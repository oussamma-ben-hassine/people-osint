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
                'background-color': '#0284c7',
                'label': 'data(label)',
                'color': '#f8fafc',
                'font-size': '11px',
                'text-valign': 'bottom',
                'text-margin-y': 6,
                'width': 36,
                'height': 36,
                'border-width': 2,
                'border-color': '#38bdf8',
              },
            },
            {
              selector: 'node[type = "Organization"]',
              style: {
                'background-color': '#10b981',
                'border-color': '#34d399',
                'shape': 'round-rectangle',
                'width': 42,
                'height': 32,
              },
            },
            {
              selector: 'node[type = "Project"]',
              style: {
                'background-color': '#a855f7',
                'border-color': '#c084fc',
                'shape': 'hexagon',
                'width': 38,
                'height': 38,
              },
            },
            {
              selector: 'node[type = "Publication"]',
              style: {
                'background-color': '#f59e0b',
                'border-color': '#fbbf24',
                'shape': 'diamond',
                'width': 34,
                'height': 34,
              },
            },
            {
              selector: 'edge',
              style: {
                'width': 2,
                'line-color': '#64748b',
                'target-arrow-color': '#64748b',
                'target-arrow-shape': 'triangle',
                'curve-style': 'bezier',
                'label': 'data(label)',
                'font-size': '9px',
                'color': '#94a3b8',
                'text-rotation': 'autorotate',
                'text-background-opacity': 0.8,
                'text-background-color': '#090d16',
                'text-background-padding': '2px',
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
                'border-color': '#ffffff',
                'line-color': '#38bdf8',
                'target-arrow-color': '#38bdf8',
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
    <div className="flex-1 flex flex-col h-[calc(100vh-60px)] md:h-screen overflow-hidden relative">
      {/* Top Controls Bar */}
      <div className="p-4 bg-[#0c1120]/90 border-b border-slate-800 backdrop-blur-md flex items-center justify-between z-10">
        <div>
          <h1 className="text-base font-bold text-white flex items-center gap-2">
            <Share2 size={18} className="text-sky-400" />
            <span>Module D — Relationship Explorer (Cytoscape.js)</span>
          </h1>
          <p className="text-xs text-slate-400">
            Exploration cartographique des affiliations, travaux et relations documentées.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1">
            <button onClick={handleZoomIn} title="Zoom Avant" className="p-1.5 text-slate-400 hover:text-white rounded-lg">
              <ZoomIn size={16} />
            </button>
            <button onClick={handleZoomOut} title="Zoom Arrière" className="p-1.5 text-slate-400 hover:text-white rounded-lg">
              <ZoomOut size={16} />
            </button>
            <button onClick={handleFit} title="Ajuster la vue" className="p-1.5 text-slate-400 hover:text-white rounded-lg">
              <Maximize2 size={16} />
            </button>
            <button onClick={handleReset} title="Recentrer" className="p-1.5 text-slate-400 hover:text-white rounded-lg">
              <RotateCcw size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Graph Canvas */}
      <div className="flex-1 relative bg-[#090d16]">
        <div ref={containerRef} className="w-full h-full" />

        {/* Legend Overlay */}
        <div className="absolute bottom-4 left-4 p-3 bg-[#0f172a]/90 backdrop-blur-md border border-slate-800 rounded-xl text-[11px] space-y-2 pointer-events-none z-10">
          <span className="font-bold text-slate-300 block mb-1">Légende des relations :</span>
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 bg-emerald-500 rounded" />
            <span className="text-slate-300">Documentée (certaine)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 bg-amber-500 rounded border-b border-dashed" />
            <span className="text-slate-300">Déclarée volontairement</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 bg-rose-500 rounded border-b border-dotted" />
            <span className="text-slate-300">Rapprochement incertain</span>
          </div>
        </div>

        {/* Node/Edge Inspector Drawer */}
        {selectedItem && (
          <div className="absolute top-4 right-4 w-80 bg-[#0f172a]/95 backdrop-blur-md border border-slate-700 rounded-2xl p-5 shadow-2xl space-y-4 z-20">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Info size={16} className="text-sky-400" />
                <span>{selectedItem.source ? 'Détail de la Relation' : 'Fiche Entité'}</span>
              </h3>
              <button onClick={() => setSelectedItem(null)} className="text-slate-400 hover:text-white text-xs">
                ✕
              </button>
            </div>

            {selectedItem.source ? (
              // Edge Details
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-500 uppercase tracking-wider font-bold text-[10px]">Type de lien :</span>
                  <p className="text-sky-400 font-bold text-sm mt-0.5">{selectedItem.label}</p>
                </div>
                <div>
                  <span className="text-slate-500 uppercase tracking-wider font-bold text-[10px]">Nature :</span>
                  <p className="text-slate-200 mt-0.5">{selectedItem.nature}</p>
                </div>
                <div>
                  <span className="text-slate-500 uppercase tracking-wider font-bold text-[10px]">Incertitude estimée :</span>
                  <p className="text-slate-200 mt-0.5">{(selectedItem.uncertainty * 100).toFixed(0)}%</p>
                </div>
                <div>
                  <span className="text-slate-500 uppercase tracking-wider font-bold text-[10px]">Preuves associées :</span>
                  <p className="text-slate-200 mt-0.5">{selectedItem.evidenceCount} preuve(s) documentaire(s)</p>
                </div>
              </div>
            ) : (
              // Node Details
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-500 uppercase tracking-wider font-bold text-[10px]">Nom / Titre :</span>
                  <p className="text-white font-bold text-sm mt-0.5">{selectedItem.label}</p>
                </div>
                <div>
                  <span className="text-slate-500 uppercase tracking-wider font-bold text-[10px]">Type d'entité :</span>
                  <span className="inline-block mt-0.5 px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 font-semibold border border-sky-500/20">
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
