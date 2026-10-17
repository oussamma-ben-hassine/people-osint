'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import './globals.css';
import {
  Search, BookOpen, Database, Share2, Sparkles, ShieldAlert,
  FileText, Settings, ShieldCheck, LogOut, Menu, X, Sun, Moon,
  ChevronRight
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
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Check saved theme in localStorage; default to light
    const saved = localStorage.getItem('people_theme') as 'light' | 'dark' | null;
    const initialTheme = saved === 'dark' ? 'dark' : 'light';
    setTheme(initialTheme);
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('people_theme', next);
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

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
    { label: 'Tableau de bord', href: '/', icon: Database },
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
    <html lang="fr" suppressHydrationWarning>
      <head>
        <title>People OSINT — Plateforme d'Enquête & Graphe de Connaissances</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="min-h-screen flex flex-col md:flex-row antialiased transition-colors duration-200">
        {isAuthPage ? (
          <main className="flex-1 w-full bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100">{children}</main>
        ) : (
          <>
            {/* Mobile Header */}
            <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-[#0f172a] border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-sm">
                  PO
                </div>
                <div>
                  <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">People OSINT</span>
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-medium -mt-1">people.oussamma.tn</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={toggleTheme}
                  aria-label="Basculer le mode sombre / clair"
                  className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  {theme === 'dark' ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-slate-600" />}
                </button>
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                </button>
              </div>
            </div>

            {/* Sidebar Desktop & Mobile Drawer */}
            <aside className={`
              ${mobileMenuOpen ? 'block' : 'hidden'} md:block
              fixed md:static inset-0 z-40 bg-white/95 md:bg-white dark:bg-[#0c1120]/95 md:dark:bg-[#0c1120]
              backdrop-blur-md w-full md:w-64 border-r border-slate-200/90 dark:border-slate-800/80
              flex flex-col shrink-0 min-h-screen transition-colors duration-200
            `}>
              <div className="p-5 border-b border-slate-200/80 dark:border-slate-800/80 hidden md:flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-md shadow-blue-500/20">
                    PO
                  </div>
                  <div>
                    <h1 className="font-bold text-sm tracking-tight text-slate-900 dark:text-white">People OSINT</h1>
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">people.oussamma.tn</p>
                  </div>
                </div>
              </div>

              {/* Navigation Links */}
              <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Navigation
                </div>
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`
                        flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                        ${isActive
                          ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200/70 shadow-xs dark:bg-blue-600/15 dark:text-blue-400 dark:border-blue-500/30'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/50'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={17} className={isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'} />
                        <span>{item.label}</span>
                      </div>
                      {isActive && <ChevronRight size={14} className="text-blue-600 dark:text-blue-400" />}
                    </a>
                  );
                })}
              </nav>

              {/* Theme Toggle & User Footer */}
              <div className="p-4 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/70 dark:bg-[#090d16]/50 space-y-3">
                {/* Theme Switcher Button */}
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-xs"
                >
                  <div className="flex items-center gap-2">
                    {theme === 'dark' ? (
                      <Moon size={15} className="text-amber-400" />
                    ) : (
                      <Sun size={15} className="text-amber-500" />
                    )}
                    <span>Mode {theme === 'dark' ? 'Sombre' : 'Clair'}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                    Basculer
                  </span>
                </button>

                {currentUser ? (
                  <div className="pt-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-slate-800 border border-blue-200 dark:border-slate-700 flex items-center justify-center text-xs font-bold text-blue-700 dark:text-slate-300">
                          {currentUser.name ? currentUser.name[0].toUpperCase() : 'U'}
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{currentUser.name || currentUser.email}</p>
                          <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold ${
                            currentUser.role === 'SUPER_ADMIN' ? 'bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30' :
                            currentUser.role === 'ADMIN' ? 'bg-purple-100 text-purple-800 border border-purple-200 dark:bg-purple-500/20 dark:text-purple-400 dark:border-purple-500/30' :
                            'bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30'
                          }`}>
                            {currentUser.role}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={handleLogout}
                        title="Se déconnecter"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition"
                      >
                        <LogOut size={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <a
                    href="/auth/login"
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition shadow-sm"
                  >
                    <ShieldCheck size={16} />
                    <span>Connexion SSO</span>
                  </a>
                )}
              </div>
            </aside>

            {/* Main content page area */}
            <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#f8fafc] dark:bg-[#090d16] text-slate-900 dark:text-slate-100">
              {children}
            </main>
          </>
        )}
      </body>
    </html>
  );
}
