'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/navigation';
import { usePathname, useRouter } from 'next/navigation';
import './globals.css';
import {
  Search, BookOpen, Database, Share2, Sparkles, ShieldAlert,
  FileText, Settings, ShieldCheck, LogOut, Menu, X, User as UserIcon
} from 'lucide-react';
import { api } from '@/lib/api';
import { User } from '@/lib/types';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (pathname.startsWith('/auth/')) {
      setLoading(false);
      return;
    }
    api.getMe()
      .then((user) => {
        setCurrentUser(user);
        if (user.access_status === 'PENDING' && pathname !== '/auth/forbidden') {
          router.push('/auth/forbidden');
        }
      })
      .catch(() => {
        setCurrentUser(null);
      })
      .finally(() => setLoading(false));
  }, [pathname, router]);

  const navItems = [
    { label: 'Dashboard', href: '/', icon: Database },
    { label: 'Nouvelle recherche', href: '/search', icon: Search },
    { label: 'Bibliothèque', href: '/library', icon: BookOpen },
    { label: 'Base de connaissances', href: '/knowledge', icon: Database },
    { label: 'Cartographie', href: '/graph', icon: Share2 },
    { label: 'AI Explorer', href: '/ai', icon: Sparkles },
    { label: 'Exposure Monitor', href: '/exposure', icon: ShieldAlert },
    { label: 'Rapports & Exports', href: '/reports', icon: FileText },
  ];

  if (currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN') {
    navItems.push({ label: 'Administration', href: '/admin', icon: Settings });
  }

  const handleLogout = async () => {
    try {
      await api.logout();
      window.location.href = '/';
    } catch {}
  };

  const isAuthPage = pathname.startsWith('/auth/');

  return (
    <html lang="fr" className="dark">
      <head>
        <title>People OSINT — Plateforme d'Enquête & Graphe de Connaissances</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="bg-[#090d16] text-slate-100 min-h-screen flex flex-col md:flex-row antialiased">
        {isAuthPage ? (
          <main className="flex-1 w-full">{children}</main>
        ) : (
          <>
            {/* Mobile Header */}
            <div className="md:hidden flex items-center justify-between p-4 bg-[#0f172a] border-b border-slate-800 sticky top-0 z-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center font-bold text-white shadow-lg shadow-sky-600/30">
                  PO
                </div>
                <span className="font-semibold text-lg tracking-tight">People OSINT</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-slate-400 hover:text-white"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>

            {/* Sidebar Desktop & Mobile Drawer */}
            <aside className={`
              ${mobileMenuOpen ? 'block' : 'hidden'} md:block
              fixed md:static inset-0 z-40 bg-[#0c1120] md:bg-[#0c1120]/80 backdrop-blur-md
              w-full md:w-64 border-r border-slate-800/80 flex flex-col shrink-0 min-h-screen
            `}>
              <div className="p-5 border-b border-slate-800/80 hidden md:flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 flex items-center justify-center font-bold text-white shadow-lg shadow-sky-500/20">
                  PO
                </div>
                <div>
                  <h1 className="font-bold text-base tracking-tight text-white">People OSINT</h1>
                  <p className="text-xs text-slate-400">people.oussamma.tn</p>
                </div>
              </div>

              {/* Navigation Links */}
              <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`
                        flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                        ${isActive
                          ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                        }
                      `}
                    >
                      <Icon size={18} className={isActive ? 'text-sky-400' : 'text-slate-400'} />
                      <span>{item.label}</span>
                    </a>
                  );
                })}
              </nav>

              {/* User Footer Profile */}
              <div className="p-4 border-t border-slate-800/80 bg-[#090d16]/50">
                {currentUser ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-slate-300">
                          {currentUser.name ? currentUser.name[0].toUpperCase() : 'U'}
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-semibold text-white truncate">{currentUser.name || currentUser.email}</p>
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            currentUser.role === 'SUPER_ADMIN' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                            currentUser.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                            'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                          }`}>
                            {currentUser.role}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={handleLogout}
                        title="Se déconnecter"
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition"
                      >
                        <LogOut size={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <a
                    href="/auth/login"
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold transition shadow-md shadow-sky-600/30"
                  >
                    <ShieldCheck size={16} />
                    <span>Connexion SSO</span>
                  </a>
                )}
              </div>
            </aside>

            {/* Main content page area */}
            <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
              {children}
            </main>
          </>
        )}
      </body>
    </html>
  );
}
