'use client';

import React, { useEffect, useState } from 'react';
import {
  Settings, Users, Shield, Cpu, Activity,
  CheckCircle2, XCircle, AlertTriangle, Trash2, Key, Sliders
} from 'lucide-react';
import { api } from '@/lib/api';
import { User } from '@/lib/types';

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [connectors, setConnectors] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'USERS' | 'CONNECTORS' | 'AUDIT'>('USERS');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [u, c, a, s] = await Promise.all([
        api.listAdminUsers().catch(() => []),
        api.listAdminConnectors().catch(() => []),
        api.getAdminAudit().catch(() => []),
        api.getAdminStats().catch(() => null),
      ]);
      setUsers(u);
      setConnectors(c);
      setAuditLogs(a);
      setStats(s);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStatus = async (user: User, newStatus: string) => {
    try {
      await api.updateUserAccess(user.id, { access_status: newStatus });
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateRole = async (user: User, newRole: string) => {
    try {
      await api.updateUserAccess(user.id, { role: newRole });
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleConnector = async (conn: any) => {
    try {
      await api.updateConnector(conn.id, { is_enabled: !conn.is_enabled });
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleGdprErase = async (userId: string, email: string) => {
    if (!confirm(`Supprimer définitivement l'utilisateur ${email} et TOUTES ses données personnelles associées (droit à l'oubli RGPD) ?`)) {
      return;
    }
    try {
      await api.gdprEraseUser(userId);
      alert('Données supprimées avec succès conformément au RGPD.');
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-6xl mx-auto w-full">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
          Module G — Administration Backoffice
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Gestion des accès SSO, rôles RBAC, gouvernance des connecteurs, audit de conformité et demandes RGPD.
        </p>
      </div>

      {/* Admin Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('USERS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'USERS'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Users size={16} />
          <span>Utilisateurs & Accès ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('CONNECTORS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'CONNECTORS'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Cpu size={16} />
          <span>Connecteurs & Quotas ({connectors.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('AUDIT')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'AUDIT'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Activity size={16} />
          <span>Journal d'Audit ({auditLogs.length})</span>
        </button>
      </div>

      {activeTab === 'USERS' && (
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">
              Comptes SSO Détectés
            </span>
            <span className="text-xs text-slate-500">
              Politique initiale : Accès exclusivement SUPER_ADMIN (par défaut PENDING)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-4">Utilisateur</th>
                  <th className="p-4">SSO Sub</th>
                  <th className="p-4">Rôle</th>
                  <th className="p-4">Statut d'accès</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-900/40 transition">
                    <td className="p-4">
                      <p className="font-bold text-white">{u.name || 'Utilisateur'}</p>
                      <p className="text-[11px] text-slate-500">{u.email}</p>
                    </td>

                    <td className="p-4 font-mono text-slate-400 text-[11px]">
                      {u.sso_sub}
                    </td>

                    <td className="p-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleUpdateRole(u, e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none"
                      >
                        <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                        <option value="ADMIN">ADMIN</option>
                        <option value="USER">USER</option>
                        <option value="DISABLED">DISABLED</option>
                      </select>
                    </td>

                    <td className="p-4">
                      <select
                        value={u.access_status}
                        onChange={(e) => handleUpdateStatus(u, e.target.value)}
                        className={`rounded-lg px-2 py-1 text-xs font-bold border focus:outline-none ${
                          u.access_status === 'ACTIVE' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
                          u.access_status === 'PENDING' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' :
                          'bg-rose-500/15 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        <option value="ACTIVE">ACTIVE (Autorisé)</option>
                        <option value="PENDING">PENDING (En attente)</option>
                        <option value="SUSPENDED">SUSPENDED (Suspendu)</option>
                        <option value="REVOKED">REVOKED (Révoqué)</option>
                      </select>
                    </td>

                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleGdprErase(u.id, u.email)}
                        title="Effacement RGPD (Droit à l'oubli)"
                        className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg text-xs font-semibold transition"
                      >
                        Effacer (RGPD)
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'CONNECTORS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {connectors.map((c) => (
            <div
              key={c.id}
              className="p-5 bg-[#0f172a] border border-slate-800 rounded-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">{c.display_name}</h3>
                  <span className="text-[10px] text-slate-500 font-mono">id : {c.name}</span>
                </div>
                <button
                  onClick={() => handleToggleConnector(c)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                    c.is_enabled
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {c.is_enabled ? 'Activé' : 'Désactivé'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500">Rate Limit :</span>
                  <p className="text-slate-200 font-semibold">{c.rate_limit_per_minute} req/min</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500">Quota Journalier :</span>
                  <p className="text-slate-200 font-semibold">{c.daily_quota} req/jour</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 text-[10px]">
                <span className={`px-2 py-0.5 rounded ${c.allows_search ? 'bg-sky-500/15 text-sky-400' : 'bg-slate-800 text-slate-500'}`}>
                  Recherche
                </span>
                <span className={`px-2 py-0.5 rounded ${c.allows_extract ? 'bg-sky-500/15 text-sky-400' : 'bg-slate-800 text-slate-500'}`}>
                  Extraction
                </span>
                <span className={`px-2 py-0.5 rounded ${c.allows_store ? 'bg-sky-500/15 text-sky-400' : 'bg-slate-800 text-slate-500'}`}>
                  Stockage
                </span>
                <span className={`px-2 py-0.5 rounded ${c.allows_export ? 'bg-sky-500/15 text-sky-400' : 'bg-slate-800 text-slate-500'}`}>
                  Export
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'AUDIT' && (
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 bg-slate-900/60 border-b border-slate-800 text-xs font-bold uppercase text-slate-400">
            Événements d'audit techniques
          </div>
          <div className="divide-y divide-slate-800 text-xs">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-4 flex items-center justify-between hover:bg-slate-900/40 transition">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sky-400">{log.event_type}</span>
                    <span className="text-[10px] text-slate-500 font-mono">user_id: {log.user_id || 'System'}</span>
                  </div>
                  <pre className="text-[11px] text-slate-400 font-mono bg-slate-900/80 p-2 rounded border border-slate-800 max-w-2xl overflow-x-auto">
                    {JSON.stringify(log.details)}
                  </pre>
                </div>
                <span className="text-[11px] text-slate-500">
                  {new Date(log.created_at).toLocaleString('fr-FR')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
