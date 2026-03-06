import { PageWrapper } from "@/components/layout/PageWrapper";
import {
  Wrench,
  Plus,
  Search,
  Terminal,
  Globe,
  Database,
  Code,
  X,
  Play,
  Activity,
  Edit3
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { ToolEditor } from "@/components/tools/ToolEditor";
import { useStore } from "@/store/useStore";

const tools = [
  {
    id: "web-search",
    name: "Web Search API",
    type: "External",
    icon: Globe,
    calls: "12.4k",
    status: "Healthy",
    description:
      "Searches the web for real-time information using Google Search API.",
    latency: "120ms",
    successRate: "99.2%",
  },
  {
    id: "code-exec",
    name: "Python Sandbox",
    type: "Execution",
    icon: Terminal,
    calls: "3.2k",
    status: "Healthy",
    description:
      "Executes Python code in a secure, isolated sandbox environment.",
    latency: "450ms",
    successRate: "95.8%",
  },
  {
    id: "sql-query",
    name: "Database Connector",
    type: "Internal",
    icon: Database,
    calls: "8.9k",
    status: "Warning",
    description:
      "Connects to internal PostgreSQL databases to retrieve structured data.",
    latency: "850ms",
    successRate: "88.4%",
  },
  {
    id: "math-solver",
    name: "Symbolic Math",
    type: "Compute",
    icon: Code,
    calls: "1.1k",
    status: "Healthy",
    description: "Solves complex symbolic math equations using SymPy.",
    latency: "45ms",
    successRate: "99.9%",
  },
];

export default function Tools() {
  const { addNotification } = useStore();
  const [selectedTool, setSelectedTool] = useState<(typeof tools)[0] | null>(
    null,
  );
  const [isEditing, setIsEditing] = useState(false);

  const handleAddTool = () => {
    addNotification({
      title: "Add Tool",
      message: "Opening tool creation wizard...",
      type: "info"
    });
  };

  const handleRunTool = () => {
    addNotification({
      title: "Executing Tool",
      message: `Running ${selectedTool?.name} in isolated environment...`,
      type: "info"
    });
  };

  const handleViewActivity = () => {
    addNotification({
      title: "Activity Log",
      message: `Fetching recent execution logs for ${selectedTool?.name}...`,
      type: "info"
    });
  };

  return (
    <PageWrapper className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Wrench className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">
              Tool Registry
            </h1>
          </div>
          <p className="text-slate-500 font-medium max-w-xl">
            Equip your agents with specialized capabilities, external API integrations, and secure execution environments.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search tools..."
              className="pl-10 pr-4 py-2.5 rounded-xl bg-white/60 backdrop-blur-md border border-slate-200/60 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 w-64 shadow-sm placeholder:text-slate-400 transition-all"
            />
          </div>
          <button 
            onClick={handleAddTool}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition-all shadow-md hover:shadow-lg"
          >
            <Plus className="w-4 h-4 text-primary-400" />
            Add Tool
          </button>
        </div>
      </div>

      <div className="flex gap-6 relative">
        <div
          className={`glass-panel rounded-3xl overflow-hidden border border-white/40 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] bg-white/60 ${selectedTool ? "w-2/3" : "w-full"}`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/60 bg-white/40 backdrop-blur-md">
                  <th className="py-4 px-6 font-bold text-slate-500 text-[10px] uppercase tracking-widest">
                    Tool Name
                  </th>
                  <th className="py-4 px-6 font-bold text-slate-500 text-[10px] uppercase tracking-widest">
                    Type
                  </th>
                  <th className="py-4 px-6 font-bold text-slate-500 text-[10px] uppercase tracking-widest">
                    Total Calls
                  </th>
                  <th className="py-4 px-6 font-bold text-slate-500 text-[10px] uppercase tracking-widest">
                    Status
                  </th>
                  <th className="py-4 px-6 font-bold text-slate-500 text-[10px] uppercase tracking-widest text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {tools.map((tool, i) => (
                  <motion.tr
                    key={tool.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    onClick={() => setSelectedTool(tool)}
                    className={`border-b border-slate-100/50 transition-all group cursor-pointer ${selectedTool?.id === tool.id ? "bg-white shadow-sm ring-1 ring-slate-900/5 relative z-10" : "hover:bg-white/80"}`}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${selectedTool?.id === tool.id ? "bg-primary text-primary-dark shadow-md shadow-primary/20 scale-110" : "bg-slate-100 text-slate-500 group-hover:bg-primary/10 group-hover:text-primary-dark"}`}
                        >
                          <tool.icon className="w-5 h-5" />
                        </div>
                        <span className={`font-semibold transition-colors ${selectedTool?.id === tool.id ? "text-slate-900" : "text-slate-700 group-hover:text-slate-900"}`}>
                          {tool.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded-md bg-slate-100/80 border border-slate-200/50 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                        {tool.type}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-mono text-sm font-medium text-slate-600">
                      {tool.calls}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full shadow-sm ${tool.status === "Healthy" ? "bg-emerald-500 shadow-emerald-500/20" : "bg-amber-500 shadow-amber-500/20"}`}
                        />
                        <span className="text-sm font-semibold text-slate-600">
                          {tool.status}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button className="text-sm font-bold text-primary-dark hover:text-primary transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                        Inspect →
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <AnimatePresence>
          {selectedTool && (
            <motion.div
              initial={{ opacity: 0, x: 20, width: 0 }}
              animate={{ opacity: 1, x: 0, width: "33.333333%" }}
              exit={{ opacity: 0, x: 20, width: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="glass-panel rounded-3xl border border-white/40 overflow-hidden flex flex-col bg-white/80 shadow-xl"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white/40 backdrop-blur-md">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary text-primary-dark flex items-center justify-center shadow-md shadow-primary/20">
                    <selectedTool.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900 text-lg">
                      {selectedTool.name}
                    </h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: {selectedTool.id}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                    title="Edit Tool Code"
                  >
                    <Edit3 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setSelectedTool(null)}
                    className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
                <div className="mb-8">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5" /> Description
                  </h3>
                  <p className="text-sm text-slate-700 leading-relaxed font-medium">
                    {selectedTool.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-white rounded-2xl p-4 border border-slate-200/60 shadow-sm">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                      Avg Latency
                    </div>
                    <div className="font-mono font-bold text-slate-900 text-lg">
                      {selectedTool.latency}
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl p-4 border border-slate-200/60 shadow-sm">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                      Success Rate
                    </div>
                    <div className="font-mono font-bold text-slate-900 text-lg">
                      {selectedTool.successRate}
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Code className="w-3.5 h-3.5" /> Schema Definition
                  </h3>
                  <div className="bg-slate-900 rounded-2xl p-4 overflow-x-auto shadow-inner border border-slate-800">
                    <pre className="text-xs font-mono text-slate-300 leading-relaxed">
                      {`{
  "name": "${selectedTool.id}",
  "description": "...",
  "parameters": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string"
      }
    },
    "required": ["query"]
  }
}`}
                    </pre>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 bg-white/40 backdrop-blur-md flex gap-3">
                <button 
                  onClick={() => setIsEditing(true)}
                  className="flex-1 py-3 rounded-xl bg-slate-900 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-md hover:shadow-lg"
                >
                  <Edit3 className="w-4 h-4 text-primary-400" />
                  Edit Implementation
                </button>
                <button 
                  onClick={handleRunTool}
                  className="p-3 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                >
                  <Play className="w-5 h-5 fill-current" />
                </button>
                <button 
                  onClick={handleViewActivity}
                  className="p-3 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                >
                  <Activity className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <AnimatePresence>
        {isEditing && selectedTool && (
          <ToolEditor tool={selectedTool} onClose={() => setIsEditing(false)} />
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}
