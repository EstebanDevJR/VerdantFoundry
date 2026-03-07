import { motion, AnimatePresence } from 'motion/react';
import { Brain, ChevronRight, ChevronDown, GitBranch, Wrench, CheckCircle2, Search, FileText, BarChart3, PenTool } from 'lucide-react';
import { useState, useMemo } from 'react';

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

type ReasoningStep = {
  id: string;
  agent: string;
  action: string;
  details: string;
  type: 'thought' | 'tool' | 'decision' | 'result';
  status?: 'thinking' | 'complete';
  children?: ReasoningStep[];
};

const AGENT_ICONS: Record<string, typeof Brain> = {
  Planner: Search,
  Researcher: FileText,
  Analyst: BarChart3,
  Writer: PenTool,
  System: Brain,
};

function ReasoningNode({ step, depth = 0 }: { step: ReasoningStep; depth?: number; key?: string | number }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = step.children && step.children.length > 0;

  const getIcon = () => {
    const Icon = AGENT_ICONS[step.agent] || Brain;
    switch (step.type) {
      case 'thought': return <Icon className="w-3.5 h-3.5 text-purple-500" />;
      case 'tool': return <Wrench className="w-3.5 h-3.5 text-blue-500" />;
      case 'decision': return <GitBranch className="w-3.5 h-3.5 text-amber-500" />;
      case 'result': return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
    }
  };

  return (
    <div className="flex flex-col">
      <div 
        className={`flex items-start gap-2 p-2 rounded-lg hover:bg-slate-50 transition-colors ${hasChildren ? 'cursor-pointer' : ''}`}
        onClick={() => hasChildren && setIsExpanded(!isExpanded)}
        style={{ marginLeft: `${depth * 16}px` }}
      >
        <div className="mt-0.5 flex-shrink-0">
          {hasChildren ? (
            isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />
          ) : (
            <div className="w-4 h-4" />
          )}
        </div>
        <div className={`flex-shrink-0 mt-0.5 bg-white p-1 rounded-md border border-slate-100 shadow-sm ${step.status === 'thinking' ? 'animate-pulse ring-2 ring-primary/30' : ''}`}>
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">{step.agent}</span>
            <span className="text-xs font-medium text-slate-900">{step.action}</span>
            {step.status === 'thinking' && (
              <span className="ml-auto flex items-center gap-1 text-[9px] uppercase font-bold text-primary-dark tracking-wider">
                <span className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                Active
              </span>
            )}
            {step.status === 'complete' && (
              <CheckCircle2 className="ml-auto w-3 h-3 text-emerald-500" />
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{step.details}</p>
        </div>
      </div>
      
      <AnimatePresence>
        {isExpanded && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {step.children?.map(child => (
              <ReasoningNode key={child.id} step={child} depth={depth + 1} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface ThinkingVisualizerProps {
  isRunning: boolean;
  logs?: LogEntry[];
  reasoningEvents?: ReasoningEvent[];
}

export function ThinkingVisualizer({ isRunning, logs, reasoningEvents }: ThinkingVisualizerProps) {
  const reasoningSteps = useMemo(() => {
    const steps: ReasoningStep[] = [];

    if (reasoningEvents && reasoningEvents.length > 0) {
      const agentGroups = new Map<string, ReasoningEvent[]>();
      for (const evt of reasoningEvents) {
        const group = agentGroups.get(evt.agent) ?? [];
        group.push(evt);
        agentGroups.set(evt.agent, group);
      }

      let idx = 0;
      for (const [agent, events] of agentGroups) {
        const latestEvent = events[events.length - 1];
        const children: ReasoningStep[] = events.map((evt, i) => ({
          id: `${idx}-${i}`,
          agent: evt.agent,
          action: evt.status === 'thinking' ? 'Processing...' : 'Completed',
          details: evt.thought,
          type: evt.status === 'thinking' ? 'thought' as const : 'result' as const,
          status: evt.status as 'thinking' | 'complete',
        }));

        steps.push({
          id: `agent-${idx}`,
          agent,
          action: latestEvent.role ?? agent,
          details: latestEvent.thought,
          type: latestEvent.status === 'complete' ? 'result' : 'thought',
          status: latestEvent.status as 'thinking' | 'complete',
          children: children.length > 1 ? children : undefined,
        });
        idx++;
      }
      return steps;
    }

    if (!logs || logs.length === 0) return [];
    
    const agentLogs = new Map<string, LogEntry[]>();
    for (const log of logs) {
      const group = agentLogs.get(log.agent) ?? [];
      group.push(log);
      agentLogs.set(log.agent, group);
    }

    let stepIdx = 0;
    for (const [agent, agentLogEntries] of agentLogs) {
      const isComplete = agentLogEntries.some(l => l.type === 'success');
      const lastLog = agentLogEntries[agentLogEntries.length - 1];

      const children: ReasoningStep[] = agentLogEntries.map((l, i) => ({
        id: `${stepIdx}-${i}`,
        agent: l.agent,
        action: l.type === 'action' ? 'Processing' : l.type === 'success' ? 'Done' : l.type === 'error' ? 'Error' : 'Info',
        details: l.message,
        type: l.type === 'error' ? 'decision' as const : l.type === 'success' ? 'result' as const : l.type === 'action' ? 'tool' as const : 'thought' as const,
      }));

      steps.push({
        id: `step-${stepIdx}`,
        agent,
        action: agent === 'System' ? 'Pipeline Orchestration' :
               agent === 'Planner' ? 'Research Planning' :
               agent === 'Researcher' ? 'Information Gathering' :
               agent === 'Analyst' ? 'Critical Analysis' :
               agent === 'Writer' ? 'Report Synthesis' :
               'Processing',
        details: lastLog.message,
        type: isComplete ? 'result' : 'thought',
        status: isComplete ? 'complete' : isRunning ? 'thinking' : undefined,
        children: children.length > 1 ? children : undefined,
      });
      stepIdx++;
    }

    return steps;
  }, [logs, reasoningEvents, isRunning]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4 px-2">
        <Brain className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Multi-Agent Trace</h3>
        {isRunning && (
          <span className="ml-auto flex items-center gap-1.5 text-[10px] uppercase font-bold text-primary-dark tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Thinking
          </span>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-1">
        {!isRunning && (!logs || logs.length === 0) ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm text-center px-4">
            <Brain className="w-8 h-8 mb-3 opacity-20" />
            <p>Multi-agent reasoning will appear here.</p>
            <p className="text-xs mt-1 opacity-60">Planner → Researcher → Analyst → Writer</p>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1">
            {reasoningSteps.map((step, i) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.15 }}
              >
                <ReasoningNode step={step} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
