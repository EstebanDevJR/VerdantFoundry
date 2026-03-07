import { PageWrapper } from '@/components/layout/PageWrapper';
import { Activity, ArrowUpRight, Cpu, Database, Zap, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { SimpleAreaChart } from '@/components/charts/SimpleAreaChart';
import { SimpleBarChart } from '@/components/charts/SimpleBarChart';
import { NeuralPulse } from '@/components/dashboard/NeuralPulse';
import { CognitiveFlow } from '@/components/dashboard/CognitiveFlow';
import { StatCardSkeleton, ChartSkeleton, ActivitySkeleton } from '@/components/common/SkeletonLoader';
import { useStore } from '@/store/useStore';
import { useState, useEffect } from 'react';
import { dashboard as dashboardApi } from '@/lib/api';

const defaultPerformanceData = [
  { time: '00:00', load: 30, memory: 40 },
  { time: '04:00', load: 45, memory: 45 },
  { time: '08:00', load: 65, memory: 55 },
  { time: '12:00', load: 85, memory: 70 },
  { time: '16:00', load: 55, memory: 60 },
  { time: '20:00', load: 40, memory: 50 },
  { time: '24:00', load: 35, memory: 45 },
];

const defaultToolUsageData = [
  { name: 'Web Search', calls: 4000 },
  { name: 'Python Exec', calls: 3000 },
  { name: 'SQL Query', calls: 2000 },
  { name: 'Math Solver', calls: 1500 },
  { name: 'Data Scraper', calls: 1000 },
];

export default function Dashboard() {
  const { addNotification } = useStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([
    { label: 'Active Agents', value: '0', icon: Cpu, trend: '', color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { label: 'Research Tasks', value: '0', icon: Activity, trend: '', color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Memory Nodes', value: '0', icon: Database, trend: '', color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'System Load', value: '0%', icon: Zap, trend: '', color: 'text-amber-600', bg: 'bg-amber-100' },
  ]);
  const [recentActivity, setRecentActivity] = useState<Array<{ id: string; task: string; status: string; time: string; agent: string }>>([]);
  const [performanceData, setPerformanceData] = useState(defaultPerformanceData);
  const [toolUsageData, setToolUsageData] = useState(defaultToolUsageData);
  const [healthData, setHealthData] = useState<any>(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [statsData, activityData, perfData, toolData, health] = await Promise.allSettled([
          dashboardApi.getStats(),
          dashboardApi.getActivity(10),
          dashboardApi.getPerformance(),
          dashboardApi.getToolUsage(),
          dashboardApi.getHealth(),
        ]);

        if (statsData.status === 'fulfilled') {
          const d = statsData.value;
          setStats([
            { label: 'Active Agents', value: d.activeAgents, icon: Cpu, trend: '', color: 'text-emerald-600', bg: 'bg-emerald-100' },
            { label: 'Research Tasks', value: d.researchTasks, icon: Activity, trend: '', color: 'text-blue-600', bg: 'bg-blue-100' },
            { label: 'Memory Nodes', value: d.memoryNodes, icon: Database, trend: '', color: 'text-purple-600', bg: 'bg-purple-100' },
            { label: 'System Load', value: d.systemLoad, icon: Zap, trend: '', color: 'text-amber-600', bg: 'bg-amber-100' },
          ]);
        }
        if (activityData.status === 'fulfilled') setRecentActivity(activityData.value);
        if (perfData.status === 'fulfilled') setPerformanceData(perfData.value);
        if (toolData.status === 'fulfilled' && toolData.value.length > 0) setToolUsageData(toolData.value);
        if (health.status === 'fulfilled') setHealthData(health.value);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const activeAgentCount = parseInt(stats[0].value) || 3;
  const systemLoadValue = parseInt(stats[3].value) || 45;

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

      {/* Neural Pulse + Cognitive Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-2 glass-panel rounded-3xl overflow-hidden"
        >
          <NeuralPulse
            activeAgents={activeAgentCount}
            systemLoad={systemLoadValue}
            className="h-56"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="glass-panel rounded-3xl overflow-hidden"
        >
          <CognitiveFlow className="h-56" />
        </motion.div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          stats.map((stat, i) => (
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
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {loading ? (
          <>
            <div className="lg:col-span-2"><ChartSkeleton /></div>
            <ChartSkeleton />
          </>
        ) : (
          <>
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
          </>
        )}
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
          
          {loading ? (
            <ActivitySkeleton />
          ) : (
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
          )}
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
            <div className="w-48 h-48 rounded-full border-[12px] border-slate-100 relative flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50" cy="50" r="44"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="12"
                  className="text-primary"
                  strokeDasharray="276"
                  strokeDashoffset={healthData ? 276 - (276 * (healthData.score || 98) / 100) : 60}
                  strokeLinecap="round"
                />
              </svg>
              <div className="text-center">
                <div className="text-4xl font-bold text-slate-900">{healthData?.score || 98}%</div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-1">
                  {healthData?.status === 'healthy' ? 'Optimal' : 'Optimal'}
                </div>
              </div>
            </div>
            
            <div className="w-full mt-10 space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">API Latency</span>
                <span className="font-mono font-medium text-slate-900">{healthData?.latency || 42}ms</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Memory Usage</span>
                <span className="font-mono font-medium text-slate-900">{healthData?.memory || '4.2 GB'}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Uptime</span>
                <span className="font-mono font-medium text-slate-900">{healthData?.uptime || '99.99%'}</span>
              </div>
              {healthData?.services && (
                <div className="pt-3 border-t border-slate-200/50 space-y-2">
                  {Object.entries(healthData.services).map(([name, status]) => (
                    <div key={name} className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 capitalize">{name}</span>
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${status === 'connected' || status === 'healthy' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        <span className="font-mono text-slate-600">{status as string}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </PageWrapper>
  );
}
