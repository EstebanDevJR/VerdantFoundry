import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useStore } from '@/store/useStore';
import { 
  Network, 
  MessageSquare, 
  Activity, 
  ArrowRightLeft, 
  ShieldAlert,
  Bot,
  Database,
  Globe
} from 'lucide-react';

export function NetworkGraph() {
  const { addNotification } = useStore();
  const [activeNode, setActiveNode] = useState<string | null>(null);

  const handleIsolate = () => {
    addNotification({
      title: "Agents Isolated",
      message: "All inter-agent communication channels have been severed.",
      type: "error"
    });
  };

  const handleToggle = (setting: string, e: React.ChangeEvent<HTMLInputElement>) => {
    addNotification({
      title: "Setting Updated",
      message: `${setting} is now ${e.target.checked ? 'enabled' : 'disabled'}.`,
      type: "info"
    });
  };

  const nodes = [
    { id: 'alpha-7', name: 'Alpha-7', role: 'Deep Search', type: 'agent', x: 20, y: 30 },
    { id: 'beta-2', name: 'Beta-2', role: 'Synthesis', type: 'agent', x: 80, y: 30 },
    { id: 'gamma-9', name: 'Gamma-9', role: 'Extraction', type: 'agent', x: 50, y: 70 },
    { id: 'db-1', name: 'Vector DB', role: 'Storage', type: 'resource', x: 50, y: 10 },
    { id: 'web-1', name: 'Web API', role: 'External', type: 'resource', x: 10, y: 80 },
  ];

  const edges = [
    { source: 'alpha-7', target: 'db-1', type: 'query', status: 'active' },
    { source: 'alpha-7', target: 'beta-2', type: 'message', status: 'idle' },
    { source: 'beta-2', target: 'gamma-9', type: 'task', status: 'active' },
    { source: 'gamma-9', target: 'web-1', type: 'request', status: 'active' },
  ];

  return (
    <div className="flex h-full gap-6">
      <div className="flex-1 glass-panel rounded-3xl border border-white/40 overflow-hidden relative bg-slate-50/50 flex flex-col">
        <div className="p-4 border-b border-slate-200/50 flex items-center justify-between bg-white/40 backdrop-blur-md z-10">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Network className="w-5 h-5 text-primary" /> Inter-Agent Communication
          </h2>
          <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Active Channel</span>
            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-slate-300" /> Idle Channel</span>
          </div>
        </div>
        
        <div className="flex-1 relative overflow-hidden">
          {/* Mock Graph Visualization */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <defs>
              <marker id="arrowhead-active" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="var(--color-primary)" />
              </marker>
              <marker id="arrowhead-idle" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="var(--color-slate-300)" />
              </marker>
            </defs>
            {edges.map((edge, i) => {
              const source = nodes.find(n => n.id === edge.source);
              const target = nodes.find(n => n.id === edge.target);
              if (!source || !target) return null;
              
              const isHovered = activeNode === source.id || activeNode === target.id;
              
              return (
                <g key={i}>
                  <line 
                    x1={`${source.x}%`} 
                    y1={`${source.y}%`} 
                    x2={`${target.x}%`} 
                    y2={`${target.y}%`} 
                    stroke={edge.status === 'active' ? 'var(--color-primary)' : 'var(--color-slate-300)'} 
                    strokeWidth={isHovered ? 3 : 2}
                    strokeDasharray={edge.status === 'active' ? '4 4' : 'none'}
                    markerEnd={`url(#arrowhead-${edge.status})`}
                    className={`transition-all duration-300 ${edge.status === 'active' ? 'animate-[dash_1s_linear_infinite]' : ''}`}
                  />
                </g>
              );
            })}
          </svg>

          {nodes.map((node) => (
            <motion.div
              key={node.id}
              className={`absolute w-16 h-16 -ml-8 -mt-8 rounded-2xl flex items-center justify-center cursor-pointer transition-all duration-300 ${
                activeNode === node.id ? 'ring-4 ring-primary/30 scale-110 shadow-lg z-20' : 'hover:scale-105 shadow-md z-10'
              } ${node.type === 'agent' ? 'bg-white border-2 border-primary/20' : 'bg-slate-800 border-2 border-slate-700 text-white'}`}
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
              onMouseEnter={() => setActiveNode(node.id)}
              onMouseLeave={() => setActiveNode(null)}
              whileHover={{ y: -5 }}
            >
              {node.type === 'agent' ? <Bot className="w-6 h-6 text-primary-dark" /> : 
               node.role === 'Storage' ? <Database className="w-6 h-6 text-blue-400" /> : 
               <Globe className="w-6 h-6 text-emerald-400" />}
              
              <div className="absolute top-full mt-2 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-slate-200 shadow-sm whitespace-nowrap text-center pointer-events-none">
                <p className="text-xs font-bold text-slate-900">{node.name}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">{node.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="w-80 flex-shrink-0 flex flex-col gap-4">
        <div className="glass-panel p-5 rounded-3xl border border-white/40 flex-1 flex flex-col min-h-0">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" /> Message Intercept
          </h3>
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
            {[
              { from: 'Alpha-7', to: 'Beta-2', type: 'Task Request', time: '10:02:45', status: 'delivered' },
              { from: 'Beta-2', to: 'Gamma-9', type: 'Data Payload', time: '10:03:12', status: 'processing' },
              { from: 'Gamma-9', to: 'Web API', type: 'HTTP GET', time: '10:03:15', status: 'pending' },
            ].map((msg, i) => (
              <div key={i} className="p-3 bg-white/60 border border-slate-200 rounded-xl hover:border-primary/30 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <span>{msg.from}</span>
                    <ArrowRightLeft className="w-3 h-3 text-slate-400" />
                    <span>{msg.to}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">{msg.time}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-primary-dark bg-primary/10 px-2 py-0.5 rounded-md">{msg.type}</span>
                  <span className={`w-2 h-2 rounded-full ${
                    msg.status === 'delivered' ? 'bg-emerald-500' :
                    msg.status === 'processing' ? 'bg-blue-500 animate-pulse' :
                    'bg-amber-500'
                  }`} title={msg.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel p-5 rounded-3xl border border-white/40 flex-shrink-0">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-primary" /> Channel Controls
          </h3>
          <div className="space-y-2">
            <label className="flex items-center justify-between p-3 bg-white/60 rounded-xl border border-slate-200 cursor-pointer hover:bg-white transition-colors">
              <span className="text-sm font-medium text-slate-700">Allow Global Broadcasts</span>
              <input 
                type="checkbox" 
                defaultChecked 
                onChange={(e) => handleToggle('Global Broadcasts', e)}
                className="w-4 h-4 rounded text-primary focus:ring-primary/50" 
              />
            </label>
            <label className="flex items-center justify-between p-3 bg-white/60 rounded-xl border border-slate-200 cursor-pointer hover:bg-white transition-colors">
              <span className="text-sm font-medium text-slate-700">Log All Payloads</span>
              <input 
                type="checkbox" 
                onChange={(e) => handleToggle('Payload Logging', e)}
                className="w-4 h-4 rounded text-primary focus:ring-primary/50" 
              />
            </label>
            <button 
              onClick={handleIsolate}
              className="w-full py-2.5 mt-2 rounded-xl bg-red-50 text-red-600 text-sm font-bold hover:bg-red-100 transition-colors border border-red-100"
            >
              Isolate All Agents
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
