import { PageWrapper } from '@/components/layout/PageWrapper';
import { Bot, Play, Search, Settings2, SquareTerminal, Download, Copy, CheckCircle2, Pause, Square, FastForward, Rewind, Brain, Clock, History, SlidersHorizontal, FileText, ChevronRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useEffect, useRef } from 'react';
import { ThinkingVisualizer } from '@/components/research/ThinkingVisualizer';
import { ExecutionTimeline } from '@/components/research/ExecutionTimeline';
import { useStore } from '@/store/useStore';

type LogEntry = {
  id: string;
  timestamp: string;
  agent: string;
  message: string;
  type: 'info' | 'action' | 'success' | 'error';
};

export default function Research() {
  const { addNotification } = useStore();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'idle' | 'running' | 'paused' | 'completed' | 'replay'>('idle');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [activeTab, setActiveTab] = useState<'cognitive' | 'timeline'>('cognitive');
  const [showConfig, setShowConfig] = useState(false);
  const [depth, setDepth] = useState<'quick' | 'standard' | 'deep'>('standard');
  const [focus, setFocus] = useState<'general' | 'market' | 'technical'>('general');
  
  const logsEndRef = useRef<HTMLDivElement>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setStatus('running');
    setShowConfig(false);
    setLogs([{
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString(),
      agent: 'System',
      message: `Initializing ${depth} research protocol with ${focus} focus...`,
      type: 'info'
    }]);
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
    if (status === 'running') {
      const interval = setInterval(() => {
        setLogs(prev => {
          if (prev.length > 15) {
            setStatus('completed');
            return [...prev, {
              id: Date.now().toString(),
              timestamp: new Date().toLocaleTimeString(),
              agent: 'System',
              message: 'Research synthesis complete.',
              type: 'success'
            }];
          }
          
          const agents = ['Alpha-7', 'Beta-2', 'Gamma-1'];
          const actions = ['Querying vector store...', 'Extracting entities...', 'Cross-referencing sources...', 'Generating summary...', 'Analyzing sentiment...', 'Verifying citations...'];
          const randomAgent = agents[Math.floor(Math.random() * agents.length)];
          const randomAction = actions[Math.floor(Math.random() * actions.length)];
          
          return [...prev, {
            id: Date.now().toString(),
            timestamp: new Date().toLocaleTimeString(),
            agent: randomAgent,
            message: randomAction,
            type: 'action'
          }];
        });
      }, 1200);
      return () => clearInterval(interval);
    }
  }, [status]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleCopy = () => {
    addNotification({
      title: "Copied to Clipboard",
      message: "The research report has been copied to your clipboard.",
      type: "success"
    });
  };

  const handleExport = () => {
    addNotification({
      title: "Exporting Report",
      message: "Preparing your research report for download...",
      type: "info"
    });
    setTimeout(() => {
      addNotification({
        title: "Export Complete",
        message: "Your report has been successfully exported as a PDF.",
        type: "success"
      });
    }, 2000);
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
          <p className="text-slate-500">Deploy autonomous agents to gather, analyze, and synthesize information.</p>
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
              <button onClick={() => { setStatus('idle'); setLogs([]); setQuery(''); }} className="p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors shadow-sm">
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
              {[
                { title: 'Quantum Computing Market', date: 'Today, 10:42 AM', status: 'completed' },
                { title: 'Competitor Feature Matrix', date: 'Yesterday', status: 'completed' },
                { title: 'Regulatory Compliance Scan', date: 'Oct 24', status: 'failed' },
                { title: 'Q3 Earnings Synthesis', date: 'Oct 22', status: 'completed' },
              ].map((item, i) => (
                <div key={i} className="p-3 rounded-xl border border-transparent hover:border-slate-200 hover:bg-white/60 cursor-pointer transition-all group">
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="text-sm font-semibold text-slate-700 group-hover:text-primary-dark line-clamp-2">{item.title}</h4>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-slate-400">{item.date}</span>
                    <span className={`w-2 h-2 rounded-full ${item.status === 'completed' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  </div>
                </div>
              ))}
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

              {/* Configuration Dropdown */}
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
            
            {/* Left: Cognitive Trace / Terminal (Only show when running or completed) */}
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
                      <ThinkingVisualizer isRunning={status === 'running' || status === 'replay'} logs={logs} />
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
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
                    <AnimatePresence initial={false}>
                      {logs.map((log) => (
                        <motion.div key={log.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex gap-2">
                          <span className="text-slate-600 shrink-0">[{log.timestamp}]</span>
                          <span className={`shrink-0 font-semibold ${log.agent === 'System' ? 'text-purple-400' : 'text-blue-400'}`}>[{log.agent}]</span>
                          <span className={`${log.type === 'error' ? 'text-red-400' : log.type === 'success' ? 'text-emerald-400' : 'text-slate-300'}`}>{log.message}</span>
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
                  <button 
                    onClick={handleCopy}
                    className="p-2 rounded-lg text-slate-500 hover:text-primary-dark hover:bg-primary/10 transition-colors" 
                    title="Copy to Clipboard"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={handleExport}
                    className="p-2 rounded-lg text-slate-500 hover:text-primary-dark hover:bg-primary/10 transition-colors" 
                    title="Export as PDF"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
                {status === 'idle' && logs.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-6">
                      <Search className="w-10 h-10 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">Ready to Research</h3>
                    <p className="text-center max-w-md">Enter a query above to deploy agents. They will gather data, analyze sources, and synthesize a comprehensive report here.</p>
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
                      <p className="text-sm font-medium text-slate-500 animate-pulse">Agents are synthesizing data...</p>
                    </div>
                  </div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="max-w-3xl mx-auto py-4"
                  >
                    <div className="prose prose-slate prose-lg max-w-none">
                      <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-4">{query || 'Quantum Computing Market Analysis'}</h1>
                      <p className="text-lg text-slate-600 lead">A comprehensive overview of recent trends, market adoption, and competitive landscape based on real-time data synthesis.</p>
                      
                      <h3 className="text-2xl font-bold text-slate-900 mt-10 mb-4">Executive Summary</h3>
                      <p>Based on the analysis of recent data streams, the following key insights have been synthesized regarding the current state of the market:</p>
                      <ul className="space-y-2">
                        <li><strong>Market Adoption:</strong> Increased by 24% quarter-over-quarter, driven primarily by enterprise sector investments.</li>
                        <li><strong>Competitive Landscape:</strong> Feature parity among top 3 competitors is expected within 6 months based on current development velocity.</li>
                        <li><strong>Regulatory Environment:</strong> Compliance requires immediate attention regarding data locality and sovereignty laws in the EU.</li>
                      </ul>
                      
                      <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10 my-8">
                        <h4 className="text-primary-dark mt-0 mb-2 flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5" /> Strategic Recommendation
                        </h4>
                        <p className="mb-0 text-slate-800 font-medium">Accelerate deployment of localized data clusters to preempt regulatory friction while maintaining current growth trajectory. Consider partnering with regional cloud providers to expedite this process.</p>
                      </div>

                      <h3 className="text-2xl font-bold text-slate-900 mt-10 mb-4">Sources & Citations</h3>
                      <div className="space-y-3 not-prose">
                        {[
                          { title: 'Global Tech Trends Q3 Report', url: 'research.institute/reports/q3', credibility: 'High' },
                          { title: 'Regulatory Shifts in Cloud Computing', url: 'policy.gov/tech/cloud', credibility: 'Official' },
                          { title: 'Enterprise Adoption Metrics 2026', url: 'data.analytics/enterprise', credibility: 'Medium' }
                        ].map((source, i) => (
                          <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white transition-colors cursor-pointer">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                                {i + 1}
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-slate-900">{source.title}</div>
                                <div className="text-xs text-slate-500">{source.url}</div>
                              </div>
                            </div>
                            <span className="text-xs font-medium px-2 py-1 rounded-md bg-slate-200 text-slate-700">
                              {source.credibility}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
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
