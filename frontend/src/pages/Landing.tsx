import { PageWrapper } from '@/components/layout/PageWrapper';
import { ArrowRight, Sparkles, Activity, Layers, Cpu, Brain, GitBranch, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { NeuralPulse } from '@/components/dashboard/NeuralPulse';

export default function Landing() {
  return (
    <PageWrapper className="flex flex-col items-center text-center pt-20 pb-32">
      {/* Hero Section */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="max-w-4xl mx-auto flex flex-col items-center"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border-primary/20 text-primary-dark font-medium text-sm mb-8 shadow-sm shadow-primary/10">
          <Sparkles className="w-4 h-4" />
          <span>Verdant Foundry v2.0 is now live</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 mb-6 leading-[1.1]">
          Autonomous Research for the <br className="hidden md:block" />
          <span className="text-gradient">Next Intelligence Era</span>
        </h1>

        <p className="text-lg md:text-xl text-slate-600 max-w-2xl mb-10 leading-relaxed">
          Deploy specialized AI agents to conduct deep, multi-layered research. 
          Synthesize complex data into actionable intelligence with unprecedented speed and clarity.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link
            to="/dashboard"
            className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-slate-900 text-white font-medium text-lg overflow-hidden transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary-soft opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <span className="relative z-10">Launch Dashboard</span>
            <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            to="/research"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full glass text-slate-700 font-medium text-lg hover:bg-slate-50 transition-colors"
          >
            Start Research
          </Link>
        </div>
      </motion.div>

      {/* Neural Network Visualization */}
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
        className="w-full max-w-5xl mt-24 glass-panel rounded-3xl p-2 border-white/40 overflow-hidden relative"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent pointer-events-none z-10" />
        <div className="bg-slate-50/80 rounded-[22px] border border-slate-200/50 shadow-inner overflow-hidden">
          <NeuralPulse activeAgents={6} systemLoad={65} className="h-72" />
        </div>
      </motion.div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mt-24 text-left">
        {[
          { icon: Activity, title: 'Real-time Synthesis', desc: 'Watch as agents gather, analyze, and synthesize data streams instantly.' },
          { icon: Layers, title: 'Deep Memory', desc: 'A persistent vector store that remembers past research to inform future queries.' },
          { icon: Cpu, title: 'Tool Registry', desc: 'Equip your agents with custom tools, APIs, and execution environments.' },
          { icon: Brain, title: 'Neural Intelligence', desc: 'Visualize AI cognition with real-time neural activity maps and cognitive flow analysis.' },
          { icon: GitBranch, title: 'Agent Evolution', desc: 'Run simulations, A/B experiments, and evolve agent capabilities over time.' },
          { icon: Shield, title: 'Genome Profiling', desc: 'Unique DNA-like signatures for each agent revealing cognitive traits and strengths.' },
        ].map((feature, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
            className="glass-panel p-8 rounded-2xl hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
              <feature.icon className="w-6 h-6 text-primary-dark" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-3">{feature.title}</h3>
            <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
          </motion.div>
        ))}
      </div>
    </PageWrapper>
  );
}
