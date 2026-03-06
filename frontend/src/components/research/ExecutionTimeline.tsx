import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Clock, CheckCircle2, Circle, Play, Pause, FastForward, Rewind } from 'lucide-react';

interface TimelineEvent {
  id: string;
  time: string;
  title: string;
  description: string;
  status: 'completed' | 'active' | 'pending';
  agent?: string;
}

interface ExecutionTimelineProps {
  status: 'idle' | 'running' | 'paused' | 'completed' | 'replay';
  logs: any[];
}

export function ExecutionTimeline({ status, logs }: ExecutionTimelineProps) {
  const events = useMemo(() => {
    if (status === 'idle' && logs.length === 0) {
      return [
        { id: '1', time: '--:--', title: 'Research Initiated', description: 'Waiting for query...', status: 'pending' as const },
        { id: '2', time: '--:--', title: 'Data Gathering', description: 'Search and retrieval.', status: 'pending' as const },
        { id: '3', time: '--:--', title: 'Data Synthesis', description: 'Analysis and aggregation.', status: 'pending' as const },
        { id: '4', time: '--:--', title: 'Report Generation', description: 'Drafting final output.', status: 'pending' as const },
      ];
    }

    const logCount = logs.length;
    
    return [
      { 
        id: '1', 
        time: logs[0]?.timestamp || '--:--', 
        title: 'Research Initiated', 
        description: 'User requested analysis.', 
        status: logCount > 0 ? 'completed' as const : 'pending' as const,
        agent: 'System'
      },
      { 
        id: '2', 
        time: logs[2]?.timestamp || '--:--', 
        title: 'Data Gathering', 
        description: 'Executing web searches and database queries.', 
        status: logCount > 5 ? 'completed' as const : logCount > 0 ? 'active' as const : 'pending' as const,
        agent: 'Alpha-7'
      },
      { 
        id: '3', 
        time: logs[8]?.timestamp || '--:--', 
        title: 'Data Synthesis', 
        description: 'Aggregating and analyzing gathered data.', 
        status: logCount > 12 ? 'completed' as const : logCount > 5 ? 'active' as const : 'pending' as const,
        agent: 'Beta-2'
      },
      { 
        id: '4', 
        time: logs[14]?.timestamp || '--:--', 
        title: 'Report Generation', 
        description: 'Drafting final research report.', 
        status: status === 'completed' ? 'completed' as const : logCount > 12 ? 'active' as const : 'pending' as const,
        agent: 'Gamma-1'
      },
    ];
  }, [status, logs]);

  return (
    <div className="flex flex-col h-full bg-white/50 rounded-3xl border border-white/40 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Execution Timeline
        </h3>
        <div className="flex items-center gap-2 bg-slate-100 rounded-full p-1">
          <button className="p-1.5 rounded-full hover:bg-white text-slate-500 transition-colors"><Rewind className="w-4 h-4" /></button>
          <button className="p-1.5 rounded-full bg-white shadow-sm text-primary-dark transition-colors"><Pause className="w-4 h-4" /></button>
          <button className="p-1.5 rounded-full hover:bg-white text-slate-500 transition-colors"><Play className="w-4 h-4" /></button>
          <button className="p-1.5 rounded-full hover:bg-white text-slate-500 transition-colors"><FastForward className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar relative">
        <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-slate-200" />
        
        <div className="space-y-6 relative">
          {events.map((event, index) => (
            <motion.div 
              key={event.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex gap-4 relative"
            >
              <div className="relative z-10 flex flex-col items-center mt-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-white border-2 ${
                  event.status === 'completed' ? 'border-emerald-500 text-emerald-500' :
                  event.status === 'active' ? 'border-primary text-primary animate-pulse' :
                  'border-slate-300 text-slate-300'
                }`}>
                  {event.status === 'completed' ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-3 h-3 fill-current" />}
                </div>
              </div>
              
              <div className={`flex-1 p-4 rounded-2xl border transition-all ${
                event.status === 'active' ? 'bg-primary/5 border-primary/30 shadow-sm' :
                'bg-white/60 border-slate-100'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <h4 className={`font-semibold ${event.status === 'active' ? 'text-primary-dark' : 'text-slate-900'}`}>
                    {event.title}
                  </h4>
                  <span className="text-xs font-medium text-slate-500">{event.time}</span>
                </div>
                <p className="text-sm text-slate-600 mb-2">{event.description}</p>
                {event.agent && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium">
                    Agent: {event.agent}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
