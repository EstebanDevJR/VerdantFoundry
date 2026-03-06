import { PageWrapper } from '@/components/layout/PageWrapper';
import { Activity, ArrowUpRight, Cpu, Database, Zap, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { SimpleAreaChart } from '@/components/charts/SimpleAreaChart';
import { SimpleBarChart } from '@/components/charts/SimpleBarChart';
import { useStore } from '@/store/useStore';

const stats = [
  { label: 'Active Agents', value: '12', icon: Cpu, trend: '+3', color: 'text-emerald-600', bg: 'bg-emerald-100' },
  { label: 'Research Tasks', value: '1,492', icon: Activity, trend: '+12%', color: 'text-blue-600', bg: 'bg-blue-100' },
  { label: 'Memory Nodes', value: '8.4M', icon: Database, trend: '+2.1M', color: 'text-purple-600', bg: 'bg-purple-100' },
  { label: 'System Load', value: '24%', icon: Zap, trend: '-4%', color: 'text-amber-600', bg: 'bg-amber-100' },
];

const recentActivity = [
  { id: 1, task: 'Quantum Computing Market Analysis', status: 'Completed', time: '2m ago', agent: 'Alpha-7' },
  { id: 2, task: 'Synthesize Q3 Earnings Reports', status: 'In Progress', time: '15m ago', agent: 'Beta-2' },
  { id: 3, task: 'Competitor Feature Matrix', status: 'Completed', time: '1h ago', agent: 'Gamma-1' },
  { id: 4, task: 'Regulatory Compliance Scan', status: 'Failed', time: '3h ago', agent: 'Delta-9' },
];

const performanceData = [
  { time: '00:00', load: 30, memory: 40 },
  { time: '04:00', load: 45, memory: 45 },
  { time: '08:00', load: 65, memory: 55 },
  { time: '12:00', load: 85, memory: 70 },
  { time: '16:00', load: 55, memory: 60 },
  { time: '20:00', load: 40, memory: 50 },
  { time: '24:00', load: 35, memory: 45 },
];

const toolUsageData = [
  { name: 'Web Search', calls: 4000 },
  { name: 'Python Exec', calls: 3000 },
  { name: 'SQL Query', calls: 2000 },
  { name: 'Math Solver', calls: 1500 },
  { name: 'Data Scraper', calls: 1000 },
];

export default function Dashboard() {
  const { addNotification } = useStore();

  const handleActivityClick = (task: string) => {
    addNotification({
      title: "Activity Details",
      message: `Viewing details for task: ${task}`,
      type: "info"
    });
  };

  return (
    <PageWrapper className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Dashboard</h1>
          <p className="text-slate-500">System overview and active research metrics.</p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/research"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 text-white font-medium text-sm hover:bg-slate-800 transition-colors shadow-md shadow-slate-900/10"
          >
            New Research
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            className="glass-panel p-6 rounded-2xl flex flex-col"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-100 text-slate-600 flex items-center gap-1">
                {stat.trend}
                <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-1">{stat.value}</div>
            <div className="text-sm text-slate-500 font-medium">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* System Load Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-2 glass-panel rounded-3xl p-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-900">System Performance</h2>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-slate-600">CPU Load</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-slate-600">Memory</span>
              </div>
            </div>
          </div>
          <div className="h-64 w-full flex items-end">
            <SimpleAreaChart data={performanceData} width={600} height={256} />
          </div>
          <div className="flex justify-between mt-1 px-1 text-xs text-slate-500">
            {performanceData.map((d) => (
              <span key={d.time}>{d.time}</span>
            ))}
          </div>
        </motion.div>

        {/* Tool Usage Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="glass-panel rounded-3xl p-8"
        >
          <h2 className="text-xl font-semibold text-slate-900 mb-6">Tool Usage</h2>
          <div className="h-64 w-full">
            <SimpleBarChart data={toolUsageData} />
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="lg:col-span-2 glass-panel rounded-3xl p-8"
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-semibold text-slate-900">Recent Activity</h2>
            <Link to="/research" className="text-sm font-medium text-primary-dark hover:text-primary transition-colors">
              View All
            </Link>
          </div>
          
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                onClick={() => handleActivityClick(activity.task)}
                className="group flex items-center justify-between p-4 rounded-2xl hover:bg-white/60 transition-colors border border-transparent hover:border-white/40 cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.status === 'Completed' ? 'bg-emerald-500' :
                    activity.status === 'In Progress' ? 'bg-blue-500 animate-pulse' :
                    'bg-red-500'
                  }`} />
                  <div>
                    <div className="font-medium text-slate-900 group-hover:text-primary-dark transition-colors">{activity.task}</div>
                    <div className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                      <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">{activity.agent}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {activity.time}</span>
                    </div>
                  </div>
                </div>
                <div className="text-sm font-medium text-slate-400 group-hover:text-slate-600 transition-colors">
                  {activity.status}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* System Health */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="glass-panel rounded-3xl p-8 flex flex-col"
        >
          <h2 className="text-xl font-semibold text-slate-900 mb-8">System Health</h2>
          
          <div className="flex-1 flex flex-col justify-center items-center relative">
            {/* Circular Progress Mock */}
            <div className="w-48 h-48 rounded-full border-[12px] border-slate-100 relative flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50" cy="50" r="44"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="12"
                  className="text-primary"
                  strokeDasharray="276"
                  strokeDashoffset="60"
                  strokeLinecap="round"
                />
              </svg>
              <div className="text-center">
                <div className="text-4xl font-bold text-slate-900">98%</div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-1">Optimal</div>
              </div>
            </div>
            
            <div className="w-full mt-10 space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">API Latency</span>
                <span className="font-mono font-medium text-slate-900">42ms</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Memory Usage</span>
                <span className="font-mono font-medium text-slate-900">4.2 GB</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Uptime</span>
                <span className="font-mono font-medium text-slate-900">99.99%</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </PageWrapper>
  );
}
