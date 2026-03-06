import { PageWrapper } from "@/components/layout/PageWrapper";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Dna, 
  Beaker, 
  TestTube2, 
  Wrench, 
  Bot, 
  GitMerge, 
  Activity,
  Plus,
  Play,
  Settings,
  BrainCircuit,
  Microscope,
  History
} from "lucide-react";
import { AgentStudio } from "@/components/evolution/AgentStudio";
import { SimulationSandbox } from "@/components/evolution/SimulationSandbox";
import { EvolutionMonitor } from "@/components/evolution/EvolutionMonitor";
import { ExperimentLab } from "@/components/evolution/ExperimentLab";

type Tab = 'studio' | 'simulation' | 'evolution' | 'lab';

export default function Evolution() {
  const [activeTab, setActiveTab] = useState<Tab>('studio');

  const tabs = [
    { id: 'studio', label: 'Agent Studio', icon: Bot, description: 'Create and edit agents' },
    { id: 'simulation', label: 'Simulation Sandbox', icon: TestTube2, description: 'Test in isolated environments' },
    { id: 'evolution', label: 'Evolution Monitor', icon: Dna, description: 'Track self-improvement' },
    { id: 'lab', label: 'Experiment Lab', icon: Microscope, description: 'Run controlled experiments' },
  ] as const;

  return (
    <PageWrapper className="max-w-7xl mx-auto h-[calc(100vh-140px)] flex flex-col">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2 flex items-center gap-3">
            <Dna className="w-8 h-8 text-primary" />
            Evolution & Engineering
          </h1>
          <p className="text-slate-500">
            Design, simulate, and evolve autonomous agents and tools.
          </p>
        </div>
        
        <div className="flex bg-white/50 border border-slate-200 rounded-xl p-1 shadow-sm">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id 
                  ? 'bg-white text-primary-dark shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden md:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 relative">
        <AnimatePresence mode="wait">
          {activeTab === 'studio' && (
            <motion.div key="studio" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-full">
              <AgentStudio />
            </motion.div>
          )}
          {activeTab === 'simulation' && (
            <motion.div key="simulation" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-full">
              <SimulationSandbox />
            </motion.div>
          )}
          {activeTab === 'evolution' && (
            <motion.div key="evolution" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-full">
              <EvolutionMonitor />
            </motion.div>
          )}
          {activeTab === 'lab' && (
            <motion.div key="lab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-full">
              <ExperimentLab />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageWrapper>
  );
}
