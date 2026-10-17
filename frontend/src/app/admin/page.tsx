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
    <div className="p-6 md:p-8 space-y-8 max-w-6xl mx-auto w-full transition-colors duration-200">
      <div className="pb-4 border-b border-slate-200/80 dark:border-slate-800/80">
        <span className="text-xs font-bold tracking-wider uppercase text-blue-600 dark:text-blue-400">
          Module G — Administration Backoffice
        </span>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
          Gouvernance, Droits d'Accès & Conformité RGPD
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Gestion des accès SSO, rôles RBAC, gouvernance des connecteurs, audit de conformité et demandes RGPD.
        </p>
      </div>

      {/* Admin Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('USERS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'USERS'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users size={16} />
          <span>Utilisateurs & Accès ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('CONNECTORS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'CONNECTORS'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Cpu size={16} />
          <span>Connecteurs & Quotas ({connectors.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('AUDIT')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'AUDIT'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Activity size={16} />
          <span>Journal d'Audit ({auditLogs.length})</span>
        </button>
      </div>

      {activeTab === 'USERS' && (
        <div className="bg-white dark:bg-[#0f172a] border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-700 dark:text-slate-400 tracking-wider">
              Comptes SSO Détectés
            </span>
            <span className="text-xs text-slate-500">
              Accès sous contrôle SUPER_ADMIN
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-4">Utilisateur</th>
                  <th className="p-4">SSO Sub</th>
                  <th className="p-4">Rôle</th>
                  <th className="p-4">Statut d'accès</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition">
                    <td className="p-4">
                      <p className="font-bold text-slate-900 dark:text-white">{u.name || 'Utilisateur'}</p>
                      <p className="text-[11px] text-slate-400">{u.email}</p>
                    </td>

                    <td className="p-4 font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                      {u.sso_sub}
                    </td>

                    <td className="p-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleUpdateRole(u, e.target.value)}
                        className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
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
                          u.access_status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800' :
                          u.access_status === 'PENDING' ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800' :
                          'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800'
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
                        className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 rounded-lg text-xs font-semibold transition"
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
              className="p-5 bg-white dark:bg-[#0f172a] border border-slate-200/90 dark:border-slate-800 rounded-2xl space-y-4 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{c.display_name}</h3>
                  <span className="text-[10px] text-slate-400 font-mono">id : {c.name}</span>
                </div>
                <button
                  onClick={() => handleToggleConnector(c)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                    c.is_enabled
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                      : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800'
                  }`}
                >
                  {c.is_enabled ? 'Activé' : 'Désactivé'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Rate Limit :</span>
                  <p className="text-slate-800 dark:text-slate-200 font-semibold">{c.rate_limit_per_minute} req/min</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Quota Journalier :</span>
                  <p className="text-slate-800 dark:text-slate-200 font-semibold">{c.daily_quota} req/jour</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 text-[10px]">
                <span className={`px-2 py-0.5 rounded font-semibold ${c.allows_search ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                  Recherche
                </span>
                <span className={`px-2 py-0.5 rounded font-semibold ${c.allows_extract ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                  Extraction
                </span>
                <span className={`px-2 py-0.5 rounded font-semibold ${c.allows_store ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                  Stockage
                </span>
                <span className={`px-2 py-0.5 rounded font-semibold ${c.allows_export ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                  Export
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'AUDIT' && (
        <div className="bg-white dark:bg-[#0f172a] border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-xs font-bold uppercase text-slate-700 dark:text-slate-400">
            Événements d'audit techniques
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-blue-600 dark:text-blue-400">{log.event_type}</span>
                    <span className="text-[10px] text-slate-400 font-mono">user_id: {log.user_id || 'System'}</span>
                  </div>
                  <pre className="text-[11px] text-slate-600 dark:text-slate-300 font-mono bg-slate-50 dark:bg-slate-900/80 p-2 rounded-lg border border-slate-200 dark:border-slate-800 max-w-2xl overflow-x-auto">
                    {JSON.stringify(log.details)}
                  </pre>
                </div>
                <span className="text-[11px] text-slate-400">
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
