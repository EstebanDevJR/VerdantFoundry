import { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { Search, Bot, Wrench, Database, Settings, LayoutDashboard, Plus, Play, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function CommandPalette() {
  const { isCommandPaletteOpen, setCommandPaletteOpen } = useStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

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

  const runCommand = (command: () => void) => {
    setCommandPaletteOpen(false);
    command();
  };

  return (
    <AnimatePresence>
      {isCommandPaletteOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setCommandPaletteOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="w-full max-w-2xl relative z-50"
          >
            <Command
              className="w-full overflow-hidden rounded-2xl bg-white/80 backdrop-blur-3xl border border-white/40 shadow-2xl"
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
                <button
                  onClick={() => setCommandPaletteOpen(false)}
                  className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <Command.List className="max-h-[60vh] overflow-y-auto p-2 custom-scrollbar">
                <Command.Empty className="py-6 text-center text-slate-500">No results found.</Command.Empty>

                <Command.Group heading="Navigation" className="text-xs font-medium text-slate-500 px-2 py-2">
                  <Command.Item
                    onSelect={() => runCommand(() => navigate('/dashboard'))}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer aria-selected:bg-primary/10 aria-selected:text-primary-dark text-slate-700 transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span className="font-medium">Dashboard</span>
                  </Command.Item>
                  <Command.Item
                    onSelect={() => runCommand(() => navigate('/research'))}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer aria-selected:bg-primary/10 aria-selected:text-primary-dark text-slate-700 transition-colors"
                  >
                    <Search className="w-4 h-4" />
                    <span className="font-medium">Research Workspace</span>
                  </Command.Item>
                  <Command.Item
                    onSelect={() => runCommand(() => navigate('/agents'))}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer aria-selected:bg-primary/10 aria-selected:text-primary-dark text-slate-700 transition-colors"
                  >
                    <Bot className="w-4 h-4" />
                    <span className="font-medium">Agents</span>
                  </Command.Item>
                  <Command.Item
                    onSelect={() => runCommand(() => navigate('/tools'))}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer aria-selected:bg-primary/10 aria-selected:text-primary-dark text-slate-700 transition-colors"
                  >
                    <Wrench className="w-4 h-4" />
                    <span className="font-medium">Tools</span>
                  </Command.Item>
                  <Command.Item
                    onSelect={() => runCommand(() => navigate('/memory'))}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer aria-selected:bg-primary/10 aria-selected:text-primary-dark text-slate-700 transition-colors"
                  >
                    <Database className="w-4 h-4" />
                    <span className="font-medium">Memory</span>
                  </Command.Item>
                  <Command.Item
                    onSelect={() => runCommand(() => navigate('/settings'))}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer aria-selected:bg-primary/10 aria-selected:text-primary-dark text-slate-700 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    <span className="font-medium">Settings</span>
                  </Command.Item>
                </Command.Group>

                <Command.Group heading="Quick Actions" className="text-xs font-medium text-slate-500 px-2 py-2 mt-2">
                  <Command.Item
                    onSelect={() => runCommand(() => navigate('/research'))}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer aria-selected:bg-primary/10 aria-selected:text-primary-dark text-slate-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="font-medium">New Research Session</span>
                  </Command.Item>
                  <Command.Item
                    onSelect={() => runCommand(() => navigate('/agents'))}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer aria-selected:bg-primary/10 aria-selected:text-primary-dark text-slate-700 transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    <span className="font-medium">Deploy Agent</span>
                  </Command.Item>
                </Command.Group>
              </Command.List>
            </Command>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
