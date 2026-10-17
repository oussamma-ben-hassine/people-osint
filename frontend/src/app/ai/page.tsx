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
    "Montre les relations professionnelles et leurs preuves."
  ];

  return (
    <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-60px)] md:h-screen overflow-hidden">
      {/* Left Drawer: Sessions list */}
      <div className="w-full md:w-72 bg-[#0c1120] border-r border-slate-800 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Sessions AI Explorer</span>
          <button
            onClick={handleCreateNew}
            className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold transition"
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
                  ? 'bg-sky-500/15 text-white border border-sky-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="font-semibold truncate">{c.title}</div>
              <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${c.mode === 'KNOWLEDGE_ONLY' ? 'bg-emerald-400' : 'bg-sky-400'}`} />
                <span>{c.mode}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-[#090d16] overflow-hidden">
        {/* Chat Header with Mode Selector */}
        <div className="p-4 bg-[#0f172a] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-sky-400" />
            <h2 className="text-sm font-bold text-white">
              {activeConv?.title || 'Assistant d’Investigation'}
            </h2>
          </div>

          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
            <button
              type="button"
              onClick={() => setMode('KNOWLEDGE_ONLY')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition ${
                mode === 'KNOWLEDGE_ONLY'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Database size={13} />
              <span>Knowledge Only</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('WEB_ENRICHED')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition ${
                mode === 'WEB_ENRICHED'
                  ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Globe size={13} />
              <span>Web Enriched</span>
            </button>
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-6">
              <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                <Sparkles size={28} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Interroger la base d'investigation</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Posez des questions directes sur les entités, comparez des dossiers ou demandez des synthèses sourcées.
                </p>
              </div>

              <div className="w-full space-y-2">
                {quickQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInputContent(q)}
                    className="w-full p-2.5 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-800 text-xs text-left transition flex items-center justify-between"
                  >
                    <span>{q}</span>
                    <ArrowRight size={12} className="text-slate-500" />
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
                  <div className="w-8 h-8 rounded-xl bg-sky-600/20 text-sky-400 border border-sky-500/30 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot size={16} />
                  </div>
                )}

                <div className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed space-y-3 ${
                  m.sender === 'user'
                    ? 'bg-sky-600 text-white rounded-tr-sm shadow-md shadow-sky-600/20'
                    : 'bg-[#0f172a] border border-slate-800 text-slate-200 rounded-tl-sm shadow-xl'
                }`}>
                  <p className="whitespace-pre-line">{m.content}</p>

                  {/* Citations and Tools */}
                  {m.citations && m.citations.length > 0 && (
                    <div className="pt-2 border-t border-slate-800 space-y-1 text-[11px] text-slate-400">
                      <span className="font-bold uppercase tracking-wider text-[10px] text-slate-500">Citations vérifiées :</span>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {m.citations.map((c: any, i: number) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-sky-400 font-semibold text-[10px]">
                            {c.title || c.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {m.sender === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                    <UserIcon size={16} />
                  </div>
                )}
              </div>
            ))
          )}
          {sending && (
            <div className="flex items-center gap-2 text-xs text-slate-400 italic">
              <Loader2 className="animate-spin text-sky-400" size={16} />
              <span>L'assistant analyse la base de connaissances et les graphes...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="p-4 bg-[#0f172a] border-t border-slate-800 flex items-center gap-3">
          <input
            type="text"
            value={inputContent}
            onChange={(e) => setInputContent(e.target.value)}
            placeholder={
              mode === 'KNOWLEDGE_ONLY'
                ? "Interroger exclusivement les données enregistrées (KNOWLEDGE_ONLY)..."
                : "Poser une question enrichie par le web..."
            }
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-sky-500 transition"
          />
          <button
            type="submit"
            disabled={sending || !inputContent.trim()}
            className="p-3 bg-sky-600 hover:bg-sky-500 text-white rounded-xl shadow-lg shadow-sky-600/20 transition disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
