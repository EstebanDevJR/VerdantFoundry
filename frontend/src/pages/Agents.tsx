import { PageWrapper } from "@/components/layout/PageWrapper";
import {
  Bot,
  Plus,
  Settings,
  Activity,
  Cpu,
  Power,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { AgentInspector } from "@/components/agents/AgentInspector";
import { useStore } from "@/store/useStore";

type AgentStatus = "Active" | "Idle" | "Offline" | "Error";

interface Agent {
  id: string;
  name: string;
  role: string;
  status: AgentStatus;
  tasks: number;
  uptime: string;
}

const initialAgents: Agent[] = [
  {
    id: "alpha-7",
    name: "Alpha-7",
    role: "Deep Search",
    status: "Active",
    tasks: 142,
    uptime: "99.9%",
  },
  {
    id: "beta-2",
    name: "Beta-2",
    role: "Synthesis & Analysis",
    status: "Idle",
    tasks: 89,
    uptime: "100%",
  },
  {
    id: "gamma-1",
    name: "Gamma-1",
    role: "Fact Checking",
    status: "Active",
    tasks: 210,
    uptime: "99.8%",
  },
  {
    id: "delta-9",
    name: "Delta-9",
    role: "Data Extraction",
    status: "Error",
    tasks: 45,
    uptime: "85.2%",
  },
];

export default function Agents() {
  const { addNotification } = useStore();
  const [agents, setAgents] = useState<Agent[]>(initialAgents);
  const [inspectingAgent, setInspectingAgent] = useState<Agent | null>(null);

  const toggleStatus = (id: string) => {
    setAgents(
      agents.map((agent) => {
        if (agent.id === id) {
          const newStatus =
            agent.status === "Active"
              ? "Idle"
              : agent.status === "Idle"
                ? "Offline"
                : "Active";
          
          addNotification({
            title: "Agent Status Changed",
            message: `${agent.name} is now ${newStatus}.`,
            type: newStatus === "Active" ? "success" : newStatus === "Offline" ? "error" : "info"
          });
          
          return { ...agent, status: newStatus };
        }
        return agent;
      }),
    );
  };

  const handleDeployAgent = () => {
    const newAgent: Agent = {
      id: `agent-${Date.now()}`,
      name: `Sigma-${Math.floor(Math.random() * 100)}`,
      role: "Data Processing",
      status: "Active",
      tasks: 0,
      uptime: "100%",
    };
    setAgents([...agents, newAgent]);
    addNotification({
      title: "Agent Deployed",
      message: `${newAgent.name} has been successfully deployed and is now active.`,
      type: "success"
    });
  };

  return (
    <PageWrapper className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">
              Agent Fleet
            </h1>
          </div>
          <p className="text-slate-500 font-medium max-w-xl">
            Deploy, monitor, and manage your specialized AI agents across various cognitive tasks.
          </p>
        </div>
        <button 
          onClick={handleDeployAgent}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition-all shadow-md hover:shadow-lg"
        >
          <Plus className="w-4 h-4 text-primary-400" />
          Deploy Agent
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent, i) => (
          <motion.div
            key={agent.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            className="glass-panel p-6 rounded-3xl flex flex-col hover:shadow-xl transition-all duration-500 group border border-white/40 hover:border-primary/30 relative overflow-hidden bg-white/60"
          >
            {agent.status === "Active" && (
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none group-hover:bg-primary/20 transition-colors duration-700" />
            )}
            {agent.status === "Error" && (
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
            )}

            <div className="flex items-start justify-between mb-6 relative z-10">
              <div className="flex items-center gap-4">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                    agent.status === "Active"
                      ? "bg-emerald-100 text-emerald-600 shadow-lg shadow-emerald-500/20 scale-105"
                      : agent.status === "Idle"
                        ? "bg-blue-100 text-blue-600 shadow-sm"
                        : agent.status === "Error"
                          ? "bg-red-100 text-red-600 shadow-sm"
                          : "bg-slate-100 text-slate-400"
                  }`}
                >
                  <Bot className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg group-hover:text-primary-dark transition-colors">
                    {agent.name}
                  </h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">{agent.role}</p>
                </div>
              </div>
              <button 
                onClick={() => setInspectingAgent(agent)}
                className="p-2 rounded-xl hover:bg-white/80 text-slate-400 hover:text-slate-600 transition-colors shadow-sm border border-transparent hover:border-slate-200/60"
                title="Inspect Agent"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
              <div className="bg-white/80 rounded-2xl p-4 border border-slate-200/60 shadow-sm">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" /> Tasks
                </div>
                <div className="font-mono font-bold text-slate-900 text-xl">
                  {agent.tasks}
                </div>
              </div>
              <div className="bg-white/80 rounded-2xl p-4 border border-slate-200/60 shadow-sm">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5" /> Uptime
                </div>
                <div className="font-mono font-bold text-slate-900 text-xl">
                  {agent.uptime}
                </div>
              </div>
            </div>

            <div className="mt-auto flex items-center justify-between pt-5 border-t border-slate-200/60 relative z-10">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${
                    agent.status === "Active"
                      ? "bg-emerald-500 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.8)]"
                      : agent.status === "Idle"
                        ? "bg-blue-500 shadow-sm"
                        : agent.status === "Error"
                          ? "bg-red-500 shadow-sm"
                          : "bg-slate-300"
                  }`}
                />
                <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
                  {agent.status}
                </span>
              </div>
              <div className="flex gap-2">
                {agent.status === "Error" ? (
                  <button
                    onClick={() => toggleStatus(agent.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors border border-transparent hover:border-primary/20"
                    title="Restart"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => toggleStatus(agent.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors border border-transparent hover:border-red-100"
                    title="Power"
                  >
                    <Power className="w-4 h-4" />
                  </button>
                )}
                <button 
                  onClick={() => setInspectingAgent(agent)}
                  className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest text-primary-dark hover:text-primary transition-colors bg-primary/5 hover:bg-primary/10 border border-primary/10"
                >
                  Logs
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {inspectingAgent && (
          <AgentInspector 
            agent={inspectingAgent} 
            onClose={() => setInspectingAgent(null)} 
          />
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}
