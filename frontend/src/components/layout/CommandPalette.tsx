import { useEffect, useState, useMemo } from 'react';
import { Command } from 'cmdk';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import {
  Search, Bot, Wrench, Database, Settings, LayoutDashboard, Plus, Play, X,
  Sparkles, FileText, Brain, Cpu, GitBranch, Keyboard, Palette, Moon, Sun,
  Clock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RecentAction {
  label: string;
  icon: typeof Search;
  route: string;
  timestamp: number;
}

const MAX_RECENT = 5;

function getRecentActions(): RecentAction[] {
  try {
    return JSON.parse(localStorage.getItem('vf_recent_actions') || '[]');
  } catch { return []; }
}

function addRecentAction(action: Omit<RecentAction, 'timestamp'>) {
  const recent = getRecentActions().filter(a => a.route !== action.route);
  recent.unshift({ ...action, timestamp: Date.now() });
  localStorage.setItem('vf_recent_actions', JSON.stringify(recent.slice(0, MAX_RECENT)));
}

const contextSuggestions: Record<string, Array<{ label: string; desc: string; icon: typeof Search; route: string }>> = {
  '/dashboard': [
    { label: 'Start New Research', desc: 'Begin a deep research session', icon: Sparkles, route: '/research' },
    { label: 'Deploy Agent', desc: 'Create and deploy a new AI agent', icon: Bot, route: '/agents' },
    { label: 'View Reports', desc: 'Browse generated reports', icon: FileText, route: '/reports' },
  ],
  '/research': [
    { label: 'Memory Search', desc: 'Search the knowledge base', icon: Brain, route: '/memory' },
    { label: 'Tool Registry', desc: 'Manage research tools', icon: Wrench, route: '/tools' },
  ],
  '/agents': [
    { label: 'Run Simulation', desc: 'Test agent in sandbox', icon: Play, route: '/evolution' },
    { label: 'View Kernel', desc: 'Monitor agent processes', icon: Cpu, route: '/kernel' },
  ],
};

export function CommandPalette() {
  const { isCommandPaletteOpen, setCommandPaletteOpen, setShortcutsOpen } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const recentActions = useMemo(() => getRecentActions(), [isCommandPaletteOpen]);
  const suggestions = contextSuggestions[location.pathname] || [];

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandPaletteOpen(!isCommandPaletteOpen);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [isCommandPaletteOpen, setCommandPaletteOpen]);

  const runCommand = (command: () => void, label?: string, icon?: typeof Search, route?: string) => {
    if (label && route) {
      addRecentAction({ label, icon: icon || Search, route });
    }
    setCommandPaletteOpen(false);
    command();
  };

  return (
    <AnimatePresence>
      {isCommandPaletteOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh]" style={{ perspective: '1200px' }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setCommandPaletteOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, rotateX: 8, y: -30 }}
            animate={{ opacity: 1, scale: 1, rotateX: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, rotateX: 8, y: -30 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-2xl relative z-50"
            style={{ transformOrigin: 'top center' }}
          >
            <div className="absolute -inset-px rounded-[18px] bg-gradient-to-b from-white/60 via-white/20 to-white/10 pointer-events-none" />
            <Command
              className="w-full overflow-hidden rounded-2xl bg-white/85 backdrop-blur-3xl border border-white/40 shadow-2xl shadow-slate-900/20"
              label="Global Command Menu"
            >
              <div className="flex items-center border-b border-slate-200/50 px-4">
                <Search className="w-5 h-5 text-slate-400 shrink-0" />
                <Command.Input
                  value={search}
                  onValueChange={setSearch}
                  placeholder="Type a command or search..."
                  className="flex-1 h-14 bg-transparent border-none outline-none px-4 text-slate-900 placeholder:text-slate-400 text-lg"
                />
                <div className="flex items-center gap-2">
                  <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-100 border border-slate-200 rounded text-slate-400">ESC</kbd>
                  <button
                    onClick={() => setCommandPaletteOpen(false)}
                    className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <Command.List className="max-h-[60vh] overflow-y-auto p-2 custom-scrollbar">
                <Command.Empty className="py-6 text-center text-slate-500">No results found.</Command.Empty>

                {!search && suggestions.length > 0 && (
                  <Command.Group heading="Suggested" className="text-xs font-medium text-slate-500 px-2 py-2">
                    {suggestions.map((s) => (
                      <Command.Item
                        key={s.route}
                        onSelect={() => runCommand(() => navigate(s.route), s.label, s.icon, s.route)}
                        className="flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer aria-selected:bg-primary/10 aria-selected:text-primary-dark text-slate-700 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <s.icon className="w-4 h-4 text-primary-dark" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{s.label}</div>
                          <div className="text-xs text-slate-400 truncate">{s.desc}</div>
                        </div>
                        <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                {!search && recentActions.length > 0 && (
                  <Command.Group heading="Recent" className="text-xs font-medium text-slate-500 px-2 py-2">
                    {recentActions.map((action, i) => (
                      <Command.Item
                        key={`${action.route}-${i}`}
                        onSelect={() => runCommand(() => navigate(action.route), action.label, Clock, action.route)}
                        className="flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer aria-selected:bg-primary/10 aria-selected:text-primary-dark text-slate-700 transition-colors"
                      >
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span className="font-medium text-sm">{action.label}</span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                <Command.Group heading="Navigation" className="text-xs font-medium text-slate-500 px-2 py-2">
                  {[
                    { icon: LayoutDashboard, label: 'Dashboard', route: '/dashboard' },
                    { icon: Search, label: 'Research Workspace', route: '/research' },
                    { icon: Bot, label: 'Agents', route: '/agents' },
                    { icon: Wrench, label: 'Tools', route: '/tools' },
                    { icon: Database, label: 'Memory', route: '/memory' },
                    { icon: FileText, label: 'Reports', route: '/reports' },
                    { icon: GitBranch, label: 'Evolution', route: '/evolution' },
                    { icon: Cpu, label: 'Kernel', route: '/kernel' },
                    { icon: Settings, label: 'Settings', route: '/settings' },
                  ].map((item) => (
                    <Command.Item
                      key={item.route}
                      onSelect={() => runCommand(() => navigate(item.route), item.label, item.icon, item.route)}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer aria-selected:bg-primary/10 aria-selected:text-primary-dark text-slate-700 transition-colors"
                    >
                      <item.icon className="w-4 h-4" />
                      <span className="font-medium">{item.label}</span>
                    </Command.Item>
                  ))}
                </Command.Group>

                <Command.Group heading="Quick Actions" className="text-xs font-medium text-slate-500 px-2 py-2 mt-2">
                  <Command.Item
                    onSelect={() => runCommand(() => navigate('/research'), 'New Research Session', Plus, '/research')}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer aria-selected:bg-primary/10 aria-selected:text-primary-dark text-slate-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="font-medium">New Research Session</span>
                  </Command.Item>
                  <Command.Item
                    onSelect={() => runCommand(() => navigate('/agents'), 'Deploy Agent', Play, '/agents')}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer aria-selected:bg-primary/10 aria-selected:text-primary-dark text-slate-700 transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    <span className="font-medium">Deploy Agent</span>
                  </Command.Item>
                  <Command.Item
                    onSelect={() => runCommand(() => setShortcutsOpen(true))}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer aria-selected:bg-primary/10 aria-selected:text-primary-dark text-slate-700 transition-colors"
                  >
                    <Keyboard className="w-4 h-4" />
                    <span className="font-medium">Keyboard Shortcuts</span>
                    <kbd className="ml-auto px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-100 border border-slate-200 rounded text-slate-400">⌘?</kbd>
                  </Command.Item>
                </Command.Group>
              </Command.List>

              <div className="border-t border-slate-200/50 px-4 py-2.5 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 text-[10px] font-mono bg-slate-100 rounded border border-slate-200">↑↓</kbd> navigate</span>
                  <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 text-[10px] font-mono bg-slate-100 rounded border border-slate-200">↵</kbd> select</span>
                </div>
                <span className="font-medium text-primary-dark/60">Verdant OS</span>
              </div>
            </Command>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
