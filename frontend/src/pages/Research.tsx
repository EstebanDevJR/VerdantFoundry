import { PageWrapper } from '@/components/layout/PageWrapper';
import { Bot, Play, Search, Settings2, SquareTerminal, Download, Copy, CheckCircle2, Pause, Square, FastForward, Rewind, Brain, Clock, History, SlidersHorizontal, FileText, ChevronRight, Sparkles, Edit3, Save, X, FileDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useEffect, useRef } from 'react';
import { ThinkingVisualizer } from '@/components/research/ThinkingVisualizer';
import { ExecutionTimeline } from '@/components/research/ExecutionTimeline';
import { useStore } from '@/store/useStore';
import { research as researchApi, reports as reportsApi, createResearchSocket } from '@/lib/api';

type LogEntry = {
  id: string;
  timestamp: string;
  agent: string;
  message: string;
  type: 'info' | 'action' | 'success' | 'error';
};

type ReasoningEvent = {
  agent: string;
  role?: string;
  status: string;
  thought: string;
};

export default function Research() {
  const { addNotification } = useStore();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'idle' | 'running' | 'paused' | 'completed' | 'replay'>('idle');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [reasoningEvents, setReasoningEvents] = useState<ReasoningEvent[]>([]);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [activeTab, setActiveTab] = useState<'cognitive' | 'timeline'>('cognitive');
  const [showConfig, setShowConfig] = useState(false);
  const [depth, setDepth] = useState<'quick' | 'standard' | 'deep'>('standard');
  const [focus, setFocus] = useState<'general' | 'market' | 'technical'>('general');
  const [researchId, setResearchId] = useState<string | null>(null);
  const [reportContent, setReportContent] = useState<string | null>(null);
  const [pastResearches, setPastResearches] = useState<Array<{ id: string; query: string; depth: string; focus: string; status: string; startedAt: string }>>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    researchApi.list().then(setPastResearches).catch(() => {});
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setStatus('running');
    setShowConfig(false);
    setReportContent(null);
    setReasoningEvents([]);
    setLogs([{
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString(),
      agent: 'System',
      message: `Initializing ${depth} multi-agent research protocol with ${focus} focus...`,
      type: 'info'
    }]);
    try {
      const res = await researchApi.start(query, depth, focus);
      setResearchId(res.id);
    } catch (err) {
      setLogs(prev => [...prev, {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString(),
        agent: 'System',
        message: `Failed to start research: ${(err as Error).message}`,
        type: 'error'
      }]);
      setStatus('completed');
    }
  };

  const handleReplay = () => {
    setStatus('replay');
    setLogs([]);
    let step = 0;
    const interval = setInterval(() => {
      setLogs(prev => {
        if (prev.length > 5) {
          clearInterval(interval);
          setStatus('completed');
          return [...prev, {
            id: Date.now().toString(),
            timestamp: new Date().toLocaleTimeString(),
            agent: 'System',
            message: 'Replay complete.',
            type: 'success'
          }];
        }
        return [...prev, {
          id: Date.now().toString(),
          timestamp: new Date().toLocaleTimeString(),
          agent: 'System',
          message: `Replaying step ${step++}...`,
          type: 'info'
        }];
      });
    }, 1000 / playbackSpeed);
  };

  useEffect(() => {
    if (status !== 'running' || !researchId) return;
    const closeWs = createResearchSocket(researchId, (event, payload: any) => {
      if (event === 'log') {
        setLogs(prev => [...prev, {
          id: Date.now().toString() + Math.random(),
          timestamp: new Date().toLocaleTimeString(),
          agent: payload?.agent || 'System',
          message: payload?.message || '',
          type: payload?.type || 'info'
        }]);
      } else if (event === 'reasoning') {
        setReasoningEvents(prev => [...prev, {
          agent: payload?.agent || 'System',
          role: payload?.role,
          status: payload?.status || 'thinking',
          thought: payload?.thought || '',
        }]);
      } else if (event === 'timeline') {
        // timeline events are handled by ExecutionTimeline
      } else if (event === 'complete') {
        if (payload?.reportContent) setReportContent(payload.reportContent);
        setStatus('completed');
        setLogs(prev => [...prev, {
          id: Date.now().toString(),
          timestamp: new Date().toLocaleTimeString(),
          agent: 'System',
          message: payload?.status === 'failed' ? 'Research failed.' : 'Multi-agent synthesis complete.',
          type: payload?.status === 'failed' ? 'error' : 'success'
        }]);
        researchApi.list().then(setPastResearches).catch(() => {});
      }
    });

    const poll = setInterval(async () => {
      if (!researchId) return;
      try {
        const r = await researchApi.get(researchId) as { status: string; reportContent?: string };
        if (r.status === 'completed' || r.status === 'failed') {
          setStatus('completed');
          if (r.reportContent) setReportContent(r.reportContent);
          const logsData = await researchApi.getLogs(researchId);
          if (logsData.length > 0) {
            setLogs(logsData.map((l: any) => ({
              id: l.id,
              timestamp: new Date(l.timestamp).toLocaleTimeString(),
              agent: l.agent,
              message: l.message,
              type: l.type
            })));
          }
          researchApi.list().then(setPastResearches).catch(() => {});
          clearInterval(poll);
        }
      } catch {}
    }, 3000);

    return () => {
      closeWs();
      clearInterval(poll);
    };
  }, [status, researchId]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleCopy = () => {
    if (reportContent) {
      navigator.clipboard.writeText(reportContent).catch(() => {});
    }
    addNotification({
      title: "Copied to Clipboard",
      message: "The research report has been copied to your clipboard.",
      type: "success"
    });
  };

  const handleExport = async (format: 'pdf' | 'html' | 'markdown' | 'docx') => {
    setShowExportMenu(false);
    if (!researchId) return;

    if (format === 'markdown' && reportContent) {
      const blob = new Blob([reportContent], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `research-${researchId}.md`;
      a.click();
      URL.revokeObjectURL(url);
      addNotification({ title: "Export Complete", message: `Report exported as Markdown.`, type: "success" });
      return;
    }

    try {
      const report = await reportsApi.createFromResearch(researchId);
      const exportUrl = reportsApi.exportUrl(report.id, format);
      window.open(exportUrl, '_blank');
      addNotification({ title: "Export Complete", message: `Report exported as ${format.toUpperCase()}.`, type: "success" });
    } catch (err) {
      addNotification({ title: "Export Failed", message: (err as Error).message, type: "error" });
    }
  };

  const handleSaveEdit = async () => {
    if (!researchId) return;
    try {
      await researchApi.updateReport(researchId, editContent);
      setReportContent(editContent);
      setIsEditing(false);
      addNotification({ title: "Report Updated", message: "Your edits have been saved with version tracking.", type: "success" });
    } catch (err) {
      addNotification({ title: "Save Failed", message: (err as Error).message, type: "error" });
    }
  };

  const startEditing = () => {
    setEditContent(reportContent ?? '');
    setIsEditing(true);
  };

  return (
    <PageWrapper className="max-w-7xl mx-auto h-[calc(100vh-140px)] flex flex-col">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2 flex items-center gap-3">
            Research Intelligence
            {status === 'running' && (
              <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary-dark text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Live
              </span>
            )}
            {status === 'replay' && (
              <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Play className="w-3 h-3 fill-current" />
                Replay {playbackSpeed}x
              </span>
            )}
          </h1>
          <p className="text-slate-500">Multi-agent pipeline: Planner → Researcher → Analyst → Writer</p>
        </div>
        
        <div className="flex gap-2">
          {status === 'completed' && (
            <div className="flex bg-white/50 border border-slate-200 rounded-lg p-1 mr-2 shadow-sm">
              <button onClick={() => setPlaybackSpeed(0.5)} className={`p-1.5 rounded-md text-xs font-bold transition-colors ${playbackSpeed === 0.5 ? 'bg-slate-200 text-slate-800' : 'text-slate-500 hover:bg-slate-100'}`}>0.5x</button>
              <button onClick={() => setPlaybackSpeed(1)} className={`p-1.5 rounded-md text-xs font-bold transition-colors ${playbackSpeed === 1 ? 'bg-slate-200 text-slate-800' : 'text-slate-500 hover:bg-slate-100'}`}>1x</button>
              <button onClick={() => setPlaybackSpeed(2)} className={`p-1.5 rounded-md text-xs font-bold transition-colors ${playbackSpeed === 2 ? 'bg-slate-200 text-slate-800' : 'text-slate-500 hover:bg-slate-100'}`}>2x</button>
              <div className="w-px bg-slate-200 mx-1 my-1" />
              <button onClick={handleReplay} className="p-1.5 rounded-md text-purple-600 hover:bg-purple-50 transition-colors flex items-center gap-1 text-xs font-bold uppercase tracking-wider">
                <Rewind className="w-3.5 h-3.5" />
                Replay
              </button>
            </div>
          )}
          {status !== 'idle' && (
            <>
              {status === 'running' || status === 'replay' ? (
                <button onClick={() => setStatus('paused')} className="p-2 rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors shadow-sm">
                  <Pause className="w-5 h-5" />
                </button>
              ) : status === 'paused' ? (
                <button onClick={() => setStatus('running')} className="p-2 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors shadow-sm">
                  <Play className="w-5 h-5" />
                </button>
              ) : null}
              <button onClick={() => { setStatus('idle'); setLogs([]); setQuery(''); setReasoningEvents([]); setReportContent(null); }} className="p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors shadow-sm">
                <Square className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Left Sidebar: History */}
        <div className="w-64 flex-shrink-0 hidden md:flex flex-col gap-4">
          <div className="glass-panel p-4 rounded-3xl flex-1 flex flex-col min-h-0">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <History className="w-4 h-4" /> Recent Research
            </h3>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
              {pastResearches.map((item) => (
                <div key={item.id} onClick={async () => {
                  setResearchId(item.id);
                  setQuery(item.query);
                  setReasoningEvents([]);
                  try {
                    const report = await researchApi.getReport(item.id);
                    if (report.content) { setReportContent(report.content); setStatus('completed'); }
                    const logsData = await researchApi.getLogs(item.id);
                    if (logsData.length > 0) setLogs(logsData.map((l: any) => ({ id: l.id, timestamp: new Date(l.timestamp).toLocaleTimeString(), agent: l.agent, message: l.message, type: l.type })));
                  } catch {}
                }} className="p-3 rounded-xl border border-transparent hover:border-slate-200 hover:bg-white/60 cursor-pointer transition-all group">
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="text-sm font-semibold text-slate-700 group-hover:text-primary-dark line-clamp-2">{item.query.slice(0, 60)}</h4>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] font-bold uppercase text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{item.depth}</span>
                    <span className="text-[9px] font-bold uppercase text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{item.focus}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-slate-400">{new Date(item.startedAt).toLocaleDateString()}</span>
                    <span className={`w-2 h-2 rounded-full ${item.status === 'completed' ? 'bg-emerald-500' : item.status === 'failed' ? 'bg-red-500' : 'bg-blue-500 animate-pulse'}`} />
                  </div>
                </div>
              ))}
              {pastResearches.length === 0 && (
                <div className="text-xs text-slate-400 text-center py-4">No past research sessions</div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col gap-6 min-h-0">
          
          {/* Search/Prompt Area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-2 rounded-3xl flex-shrink-0 relative z-20"
          >
            <form onSubmit={handleSearch} className="flex flex-col">
              <div className="relative flex items-center">
                <div className="absolute left-4 text-primary">
                  <Sparkles className="w-6 h-6" />
                </div>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  disabled={status !== 'idle' && status !== 'completed'}
                  placeholder="What would you like to research today?"
                  className="w-full bg-transparent border-none py-5 pl-14 pr-32 text-lg font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 disabled:opacity-50"
                />
                <div className="absolute right-2 flex items-center gap-2">
                  <button 
                    type="button" 
                    onClick={() => setShowConfig(!showConfig)}
                    className={`p-2.5 rounded-xl transition-colors ${showConfig ? 'bg-primary/10 text-primary-dark' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                  >
                    <SlidersHorizontal className="w-5 h-5" />
                  </button>
                  <button
                    type="submit"
                    disabled={status === 'running' || status === 'replay' || !query.trim()}
                    className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-medium flex items-center justify-center gap-2 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-md shadow-slate-900/10"
                  >
                    {status === 'running' ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Search className="w-5 h-5" />
                    )}
                    <span className="hidden sm:inline">{status === 'running' ? 'Running' : 'Research'}</span>
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {showConfig && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-t border-slate-100"
                  >
                    <div className="p-4 bg-slate-50/50 rounded-b-2xl flex flex-wrap gap-6">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Research Depth</label>
                        <div className="flex bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
                          {(['quick', 'standard', 'deep'] as const).map((d) => (
                            <button
                              key={d}
                              type="button"
                              onClick={() => setDepth(d)}
                              className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${depth === d ? 'bg-primary/10 text-primary-dark' : 'text-slate-600 hover:bg-slate-50'}`}
                            >
                              {d}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Focus Area</label>
                        <div className="flex bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
                          {(['general', 'market', 'technical'] as const).map((f) => (
                            <button
                              key={f}
                              type="button"
                              onClick={() => setFocus(f)}
                              className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${focus === f ? 'bg-primary/10 text-primary-dark' : 'text-slate-600 hover:bg-slate-50'}`}
                            >
                              {f}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </motion.div>

          {/* Dynamic Content Area */}
          <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
            
            {(status !== 'idle' || logs.length > 0) && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="w-full lg:w-1/3 flex flex-col gap-6 min-h-0"
              >
                <div className="glass-panel p-4 rounded-3xl flex-1 overflow-hidden flex flex-col">
                  <div className="flex gap-2 mb-4 border-b border-slate-100 pb-2">
                    <button 
                      onClick={() => setActiveTab('cognitive')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'cognitive' ? 'bg-primary/10 text-primary-dark' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                      <Brain className="w-4 h-4" /> Trace
                    </button>
                    <button 
                      onClick={() => setActiveTab('timeline')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'timeline' ? 'bg-primary/10 text-primary-dark' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                      <Clock className="w-4 h-4" /> Timeline
                    </button>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    {activeTab === 'cognitive' ? (
                      <ThinkingVisualizer isRunning={status === 'running' || status === 'replay'} logs={logs} reasoningEvents={reasoningEvents} />
                    ) : (
                      <ExecutionTimeline status={status} logs={logs} />
                    )}
                  </div>
                </div>

                <div className="glass-panel p-0 rounded-3xl h-48 flex flex-col bg-[#0A0F1C] text-slate-300 font-mono text-xs overflow-hidden border border-slate-800 shadow-xl flex-shrink-0">
                  <div className="flex items-center justify-between px-4 py-2 bg-[#111827] border-b border-slate-800">
                    <div className="flex items-center gap-2 text-slate-400">
                      <SquareTerminal className="w-3.5 h-3.5" />
                      <span className="font-semibold tracking-wider uppercase">Console</span>
                    </div>
                    <span className="text-[9px] text-slate-600">{logs.length} events</span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
                    <AnimatePresence initial={false}>
                      {logs.map((log) => (
                        <motion.div key={log.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex gap-2">
                          <span className="text-slate-600 shrink-0">[{log.timestamp}]</span>
                          <span className={`shrink-0 font-semibold ${
                            log.agent === 'System' ? 'text-purple-400' :
                            log.agent === 'Planner' ? 'text-cyan-400' :
                            log.agent === 'Researcher' ? 'text-blue-400' :
                            log.agent === 'Analyst' ? 'text-amber-400' :
                            log.agent === 'Writer' ? 'text-emerald-400' :
                            'text-blue-400'
                          }`}>[{log.agent}]</span>
                          <span className={`${log.type === 'error' ? 'text-red-400' : log.type === 'success' ? 'text-emerald-400' : log.type === 'action' ? 'text-amber-300' : 'text-slate-300'}`}>{log.message}</span>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {(status === 'running' || status === 'replay') && (
                      <div className="flex gap-2 animate-pulse text-slate-500">
                        <span>[{new Date().toLocaleTimeString()}]</span>
                        <span>_</span>
                      </div>
                    )}
                    <div ref={logsEndRef} />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Right: Results / Report */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`glass-panel p-8 rounded-3xl flex-1 flex flex-col overflow-hidden relative ${status === 'idle' && logs.length === 0 ? 'lg:col-span-3' : ''}`}
            >
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-6 h-6 text-primary" />
                  Research Report
                </h2>
                <div className="flex gap-2">
                  {reportContent && !isEditing && (
                    <button 
                      onClick={startEditing}
                      className="p-2 rounded-lg text-slate-500 hover:text-primary-dark hover:bg-primary/10 transition-colors" 
                      title="Edit Report"
                    >
                      <Edit3 className="w-5 h-5" />
                    </button>
                  )}
                  {isEditing && (
                    <>
                      <button 
                        onClick={handleSaveEdit}
                        className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors" 
                        title="Save Changes"
                      >
                        <Save className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => setIsEditing(false)}
                        className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors" 
                        title="Cancel Edit"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </>
                  )}
                  <button 
                    onClick={handleCopy}
                    className="p-2 rounded-lg text-slate-500 hover:text-primary-dark hover:bg-primary/10 transition-colors" 
                    title="Copy to Clipboard"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                  <div className="relative">
                    <button 
                      onClick={() => setShowExportMenu(!showExportMenu)}
                      className="p-2 rounded-lg text-slate-500 hover:text-primary-dark hover:bg-primary/10 transition-colors" 
                      title="Export Report"
                    >
                      <FileDown className="w-5 h-5" />
                    </button>
                    {showExportMenu && (
                      <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50 min-w-[160px]">
                        {(['pdf', 'html', 'markdown', 'docx'] as const).map((fmt) => (
                          <button
                            key={fmt}
                            onClick={() => handleExport(fmt)}
                            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                          >
                            <Download className="w-3.5 h-3.5 text-slate-400" />
                            Export as {fmt.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
                {status === 'idle' && logs.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-6">
                      <Search className="w-10 h-10 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">Ready to Research</h3>
                    <p className="text-center max-w-md">Enter a query above to deploy a multi-agent pipeline. Four specialized agents will plan, research, analyze, and write a comprehensive report.</p>
                  </div>
                ) : status === 'running' || status === 'paused' || status === 'replay' ? (
                  <div className="space-y-8 max-w-3xl mx-auto w-full py-8">
                    <div className="space-y-4">
                      <div className="h-10 w-3/4 bg-slate-200 rounded-lg animate-pulse" />
                      <div className="h-4 w-1/4 bg-slate-100 rounded animate-pulse" />
                    </div>
                    <div className="space-y-3">
                      <div className="h-4 w-full bg-slate-100 rounded animate-pulse" />
                      <div className="h-4 w-full bg-slate-100 rounded animate-pulse" />
                      <div className="h-4 w-5/6 bg-slate-100 rounded animate-pulse" />
                    </div>
                    <div className="h-48 w-full bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center gap-4">
                      <div className="relative flex items-center justify-center">
                        <div className="absolute inset-0 border-4 border-primary/20 rounded-full animate-ping" />
                        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin relative z-10" />
                      </div>
                      <p className="text-sm font-medium text-slate-500 animate-pulse">Multi-agent pipeline synthesizing...</p>
                      <div className="flex gap-2 text-xs text-slate-400">
                        {['Planner', 'Researcher', 'Analyst', 'Writer'].map((agent) => (
                          <span key={agent} className="px-2 py-0.5 rounded bg-slate-100">{agent}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : isEditing ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto py-4 h-full">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full h-full min-h-[400px] bg-slate-50 border border-slate-200 rounded-xl p-4 font-mono text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                      placeholder="Edit your research report in Markdown..."
                    />
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="max-w-3xl mx-auto py-4"
                  >
                    {reportContent ? (
                      <div className="prose prose-slate prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: renderMarkdown(reportContent) }} />
                    ) : (
                      <div className="prose prose-slate prose-lg max-w-none">
                        <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-4">{query}</h1>
                        <p className="text-lg text-slate-600 lead">Research completed. No report content was generated (LLM API key may not be configured).</p>
                        <p className="text-slate-500">Check that <code>OPENAI_API_KEY</code> is set in the AI Engine environment variables.</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}

function renderMarkdown(md: string): string {
  return md
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
    .replace(/^- (.*$)/gim, '<li>$1</li>')
    .replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>')
    .replace(/<\/ul>\s*<ul>/g, '')
    .replace(/\n{2,}/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^(.+)$/gm, (m) => m.startsWith('<') ? m : `<p>${m}</p>`);
}
