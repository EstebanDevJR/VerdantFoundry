import { motion, AnimatePresence } from 'motion/react';
import { Brain, ChevronRight, ChevronDown, GitBranch, Wrench, CheckCircle2 } from 'lucide-react';
import { useState, useMemo } from 'react';

type ReasoningStep = {
  id: string;
  agent: string;
  action: string;
  details: string;
  type: 'thought' | 'tool' | 'decision' | 'result';
  children?: ReasoningStep[];
};

function ReasoningNode({ step, depth = 0 }: { step: ReasoningStep; depth?: number; key?: string | number }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = step.children && step.children.length > 0;

  const getIcon = () => {
    switch (step.type) {
      case 'thought': return <Brain className="w-3.5 h-3.5 text-purple-500" />;
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
        <div className="flex-shrink-0 mt-0.5 bg-white p-1 rounded-md border border-slate-100 shadow-sm">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">{step.agent}</span>
            <span className="text-xs font-medium text-slate-900">{step.action}</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 truncate">{step.details}</p>
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

export function ThinkingVisualizer({ isRunning, logs }: { isRunning: boolean, logs?: any[] }) {
  const reasoningSteps = useMemo(() => {
    if (!logs || logs.length === 0) return [];
    
    const steps: ReasoningStep[] = [];
    
    if (logs.length > 0) {
      steps.push({
        id: '1',
        agent: 'Alpha-7',
        action: 'Analyze Query',
        details: 'Breaking down the user query into search parameters.',
        type: 'thought',
        children: logs.length > 1 ? [
          { id: '1-1', agent: 'Alpha-7', action: 'Extract Entities', details: 'Identified key parameters.', type: 'thought' },
          { id: '1-2', agent: 'Alpha-7', action: 'Formulate Search', details: 'Created search variants.', type: 'decision' }
        ] : []
      });
    }

    if (logs.length > 5) {
      steps.push({
        id: '2',
        agent: 'Alpha-7',
        action: 'Execute Search',
        details: 'Using Web Search API to gather recent articles.',
        type: 'tool',
        children: logs.length > 6 ? [
          { id: '2-1', agent: 'System', action: 'Web Search API', details: 'Querying data sources...', type: 'tool' },
          { id: '2-2', agent: 'System', action: 'Parse Results', details: 'Retrieved relevant sources.', type: 'result' }
        ] : []
      });
    }

    if (logs.length > 10) {
      steps.push({
        id: '3',
        agent: 'Beta-2',
        action: 'Synthesize Findings',
        details: 'Cross-referencing sources to identify consensus.',
        type: 'thought',
        children: logs.length > 11 ? [
          { id: '3-1', agent: 'Beta-2', action: 'Identify Trend', details: 'Consensus found in data.', type: 'decision' },
          { id: '3-2', agent: 'Beta-2', action: 'Draft Summary', details: 'Generating executive summary points.', type: 'result' }
        ] : []
      });
    }

    return steps;
  }, [logs]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4 px-2">
        <Brain className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Cognitive Trace</h3>
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
            <p>Agent reasoning will appear here during execution.</p>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1">
            {reasoningSteps.map((step, i) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.2 }}
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
