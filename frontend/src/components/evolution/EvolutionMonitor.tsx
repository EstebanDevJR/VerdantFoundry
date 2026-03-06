import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '@/store/useStore';
import { 
  Dna, 
  TrendingUp, 
  Lightbulb, 
  Check, 
  X, 
  GitMerge, 
  Activity, 
  BrainCircuit, 
  ArrowRight,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Bot,
  Wrench
} from 'lucide-react';

export function EvolutionMonitor() {
  const [activeTab, setActiveTab] = useState<'suggestions' | 'training' | 'history'>('suggestions');

  return (
    <div className="flex h-full gap-6">
      {/* Sidebar Navigation */}
      <div className="w-64 flex-shrink-0 flex flex-col gap-4">
        <div className="glass-panel p-4 rounded-3xl border border-white/40">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">Evolution Hub</h3>
          <div className="space-y-1">
            <button 
              onClick={() => setActiveTab('suggestions')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${activeTab === 'suggestions' ? 'bg-primary/10 text-primary-dark' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <span className="flex items-center gap-3"><Lightbulb className="w-4 h-4" /> Suggestions</span>
              <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">3</span>
            </button>
            <button 
              onClick={() => setActiveTab('training')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${activeTab === 'training' ? 'bg-primary/10 text-primary-dark' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <BrainCircuit className="w-4 h-4" /> Training Feedback
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${activeTab === 'history' ? 'bg-primary/10 text-primary-dark' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <GitMerge className="w-4 h-4" /> Version History
            </button>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-3xl border border-white/40 flex-1 flex flex-col">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">System Health</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-600 font-medium">Evolution Rate</span>
                <span className="text-emerald-600 font-bold">+12%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[65%]" />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-600 font-medium">Optimization Score</span>
                <span className="text-primary-dark font-bold">94/100</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary w-[94%]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 glass-panel rounded-3xl border border-white/40 overflow-hidden flex flex-col relative">
        <AnimatePresence mode="wait">
          {activeTab === 'suggestions' && <SuggestionsView key="suggestions" />}
          {activeTab === 'training' && <TrainingView key="training" />}
          {activeTab === 'history' && <HistoryView key="history" />}
        </AnimatePresence>
      </div>
    </div>
  );
}

function SuggestionsView() {
  const { addNotification } = useStore();
  const suggestions = [
    { id: 1, type: 'agent', target: 'Alpha-7', title: 'Optimize Search Depth', description: 'Alpha-7 is consistently hitting timeout limits on deep searches. Suggest reducing default recursion depth from 5 to 3 to improve latency by 40%.', impact: 'High' },
    { id: 2, type: 'tool', target: 'Vector DB Query', title: 'Add Semantic Caching', description: 'Frequent duplicate queries detected. Implementing a semantic cache layer could reduce API costs by 15% and improve response times.', impact: 'Medium' },
    { id: 3, type: 'policy', target: 'Global', title: 'Refine Confidence Threshold', description: 'Agents are requesting human intervention too frequently on low-risk tasks. Suggest lowering the confidence threshold for autonomous action from 90% to 85%.', impact: 'Low' },
  ];

  const handleApprove = (title: string) => {
    addNotification({
      title: "Suggestion Approved",
      message: `Applying changes for: ${title}`,
      type: "success"
    });
  };

  const handleReject = (title: string) => {
    addNotification({
      title: "Suggestion Rejected",
      message: `Dismissed suggestion: ${title}`,
      type: "info"
    });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-full p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Lightbulb className="w-6 h-6 text-amber-500" /> Autonomous Improvement Suggestions
        </h2>
        <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold uppercase tracking-wider rounded-full">3 Pending</span>
      </div>
      
      <div className="space-y-4 overflow-y-auto custom-scrollbar pr-2">
        {suggestions.map(s => (
          <div key={s.id} className="p-5 bg-white/60 border border-slate-200 rounded-2xl hover:border-primary/30 transition-all group">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  s.type === 'agent' ? 'bg-primary/10 text-primary-dark' :
                  s.type === 'tool' ? 'bg-blue-50 text-blue-600' :
                  'bg-purple-50 text-purple-600'
                }`}>
                  {s.type === 'agent' ? <Bot className="w-5 h-5" /> : s.type === 'tool' ? <Wrench className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{s.title}</h3>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Target: {s.target}</p>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                s.impact === 'High' ? 'bg-red-50 text-red-600' :
                s.impact === 'Medium' ? 'bg-amber-50 text-amber-600' :
                'bg-emerald-50 text-emerald-600'
              }`}>
                {s.impact} Impact
              </span>
            </div>
            <p className="text-sm text-slate-600 mb-4">{s.description}</p>
            <div className="flex gap-2">
              <button 
                onClick={() => handleApprove(s.title)}
                className="flex-1 py-2 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shadow-md shadow-slate-900/10"
              >
                <Check className="w-4 h-4" /> Approve & Apply
              </button>
              <button 
                onClick={() => handleReject(s.title)}
                className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <X className="w-4 h-4" /> Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function TrainingView() {
  const { addNotification } = useStore();

  const handleFeedback = (type: 'positive' | 'negative') => {
    addNotification({
      title: "Feedback Submitted",
      message: `Thank you. Your ${type} feedback will be used to train the agent.`,
      type: "success"
    });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-full p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <BrainCircuit className="w-6 h-6 text-primary" /> Agent Training Interface
        </h2>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
        <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
        <p className="text-lg font-medium text-slate-600 mb-2">Awaiting Feedback</p>
        <p className="text-sm max-w-md text-center">Review recent agent decisions and provide positive or negative reinforcement to guide future behavior.</p>
        
        <div className="mt-8 p-6 bg-white border border-slate-200 rounded-2xl shadow-sm max-w-lg w-full">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Recent Decision</span>
            <span className="text-xs text-slate-400">10 mins ago</span>
          </div>
          <p className="text-sm text-slate-900 font-medium mb-2">Alpha-7 chose to summarize a 50-page document instead of extracting specific entities as requested.</p>
          <div className="flex gap-2 mt-4">
            <button 
              onClick={() => handleFeedback('positive')}
              className="flex-1 py-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2 font-medium text-sm"
            >
              <ThumbsUp className="w-4 h-4" /> Good Choice
            </button>
            <button 
              onClick={() => handleFeedback('negative')}
              className="flex-1 py-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors flex items-center justify-center gap-2 font-medium text-sm"
            >
              <ThumbsDown className="w-4 h-4" /> Needs Correction
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function HistoryView() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-full p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <GitMerge className="w-6 h-6 text-primary" /> Version History
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar relative pl-4">
        <div className="absolute left-[23px] top-4 bottom-4 w-0.5 bg-slate-200" />
        
        <div className="space-y-6 relative">
          {[
            { version: 'v2.4.1', date: 'Today, 10:30 AM', author: 'System (Auto-Optimization)', changes: 'Reduced search depth, improved latency.' },
            { version: 'v2.4.0', date: 'Yesterday, 4:15 PM', author: 'Admin', changes: 'Added Vector DB Query tool to Alpha-7.' },
            { version: 'v2.3.5', date: 'Oct 24, 9:00 AM', author: 'System (Training)', changes: 'Adjusted confidence threshold based on user feedback.' },
          ].map((v, i) => (
            <div key={i} className="flex gap-4 relative">
              <div className="relative z-10 flex flex-col items-center mt-1">
                <div className="w-4 h-4 rounded-full bg-primary border-4 border-white shadow-sm" />
              </div>
              <div className="flex-1 p-4 bg-white/60 border border-slate-200 rounded-2xl hover:border-primary/30 transition-all">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-slate-900">{v.version}</h4>
                  <span className="text-xs text-slate-500">{v.date}</span>
                </div>
                <p className="text-xs font-medium text-primary-dark mb-2">By {v.author}</p>
                <p className="text-sm text-slate-600">{v.changes}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
