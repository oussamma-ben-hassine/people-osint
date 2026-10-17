'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles, Send, Database, Globe, BookOpen,
  CheckCircle2, Bot, User as UserIcon, Loader2, ArrowRight
} from 'lucide-react';
import { api } from '@/lib/api';
import { AIConversation, AIMessage } from '@/lib/types';

export default function AIExplorerPage() {
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [activeConv, setActiveConv] = useState<AIConversation | null>(null);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [inputContent, setInputContent] = useState('');
  const [mode, setMode] = useState<'KNOWLEDGE_ONLY' | 'WEB_ENRICHED'>('KNOWLEDGE_ONLY');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadConversations = async () => {
    try {
      const convs = await api.listConversations();
      setConversations(convs);
      if (convs.length > 0 && !activeConv) {
        selectConversation(convs[0]);
      }
    } catch {}
  };

  useEffect(() => {
    loadConversations();
  }, []);

  const selectConversation = async (conv: AIConversation) => {
    setActiveConv(conv);
    setMode(conv.mode);
    try {
      const msgs = await api.getMessages(conv.id);
      setMessages(msgs);
    } catch {}
  };

  const handleCreateNew = async () => {
    try {
      const newConv = await api.createConversation(
        `Session IA du ${new Date().toLocaleDateString('fr-FR')}`,
        mode
      );
      setConversations([newConv, ...conversations]);
      setActiveConv(newConv);
      setMessages([]);
    } catch {}
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputContent.trim() || sending) return;

    let convId = activeConv?.id;
    if (!convId) {
      const newConv = await api.createConversation('Session IA', mode);
      setConversations([newConv, ...conversations]);
      setActiveConv(newConv);
      convId = newConv.id;
    }

    const text = inputContent.trim();
    setInputContent('');
    setSending(true);

    // Optimistic user message
    const tempUserMsg: AIMessage = {
      id: 'temp-' + Date.now(),
      sender: 'user',
      content: text,
      citations: [],
      tools_used: [],
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const assistantMsg = await api.sendMessage(convId, text);
      setMessages((prev) => [...prev.filter((m) => m.id !== tempUserMsg.id), tempUserMsg, assistantMsg]);
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la réponse IA');
    }
    setSending(false);
  };

  const quickQuestions = [
    "Quelles personnes ont travaillé dans ces organisations ?",
    "Quels projets sont communs entre les profils documentés ?",
    "Compare les informations des différents dossiers de recherche.",
    "Montre les relations professionnelles et leurs preuves documentaires."
  ];

  return (
    <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-60px)] md:h-screen overflow-hidden transition-colors duration-200">
      {/* Left Drawer: Sessions list */}
      <div className="w-full md:w-72 bg-white dark:bg-[#0c1120] border-r border-slate-200/80 dark:border-slate-800 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Sessions IA</span>
          <button
            onClick={handleCreateNew}
            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition shadow-xs"
          >
            + Nouvelle
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => selectConversation(c)}
              className={`w-full text-left p-3 rounded-xl text-xs transition ${
                activeConv?.id === c.id
                  ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200/70 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="truncate">{c.title}</div>
              <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${c.mode === 'KNOWLEDGE_ONLY' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                <span>{c.mode}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-slate-50 dark:bg-[#090d16] overflow-hidden">
        {/* Chat Header with Mode Selector */}
        <div className="p-4 bg-white dark:bg-[#0f172a] border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {activeConv?.title || 'Assistant d’Investigation IA'}
            </h2>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 text-xs">
            <button
              type="button"
              onClick={() => setMode('KNOWLEDGE_ONLY')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition ${
                mode === 'KNOWLEDGE_ONLY'
                  ? 'bg-white dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 shadow-xs border border-slate-200/60 dark:border-emerald-800'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Database size={13} />
              <span>Base Uniquement</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('WEB_ENRICHED')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition ${
                mode === 'WEB_ENRICHED'
                  ? 'bg-white dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 shadow-xs border border-slate-200/60 dark:border-blue-800'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Globe size={13} />
              <span>Web Enrichi</span>
            </button>
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-6">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Sparkles size={28} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Interroger la base d'investigation</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Posez des questions directes sur les entités, comparez des dossiers ou demandez des synthèses sourcées.
                </p>
              </div>

              <div className="w-full space-y-2">
                {quickQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInputContent(q)}
                    className="w-full p-3 bg-white dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-left transition flex items-center justify-between shadow-xs"
                  >
                    <span>{q}</span>
                    <ArrowRight size={12} className="text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot size={16} />
                  </div>
                )}

                <div className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed space-y-3 ${
                  m.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-sm shadow-sm'
                    : 'bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-sm shadow-sm'
                }`}>
                  <p className="whitespace-pre-line">{m.content}</p>

                  {/* Citations and Tools */}
                  {m.citations && m.citations.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400">Citations vérifiées :</span>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {m.citations.map((c: any, i: number) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-blue-600 dark:text-blue-400 font-semibold text-[10px]">
                            {c.title || c.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {m.sender === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                    <UserIcon size={16} />
                  </div>
                )}
              </div>
            ))
          )}
          {sending && (
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 italic">
              <Loader2 className="animate-spin text-blue-600 dark:text-blue-400" size={16} />
              <span>L'assistant analyse la base de connaissances et les graphes...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="p-4 bg-white dark:bg-[#0f172a] border-t border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
          <input
            type="text"
            value={inputContent}
            onChange={(e) => setInputContent(e.target.value)}
            placeholder={
              mode === 'KNOWLEDGE_ONLY'
                ? "Interroger exclusivement les données enregistrées (KNOWLEDGE_ONLY)..."
                : "Poser une question enrichie par le web..."
            }
            className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600 transition"
          />
          <button
            type="submit"
            disabled={sending || !inputContent.trim()}
            className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-md shadow-blue-600/20 transition disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
