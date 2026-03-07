import { motion, AnimatePresence } from 'motion/react';
import { X, Keyboard } from 'lucide-react';

interface KeyboardShortcutsProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcuts = [
  { keys: ['⌘', 'K'], description: 'Command palette' },
  { keys: ['⌘', 'B'], description: 'Toggle sidebar' },
  { keys: ['⌘', 'N'], description: 'New research' },
  { keys: ['⌘', '/'], description: 'Command palette (alt)' },
  { keys: ['⌘', '?'], description: 'Keyboard shortcuts' },
  { keys: ['Esc'], description: 'Close dialog / palette' },
];

const navShortcuts = [
  { keys: ['G', 'D'], description: 'Go to Dashboard' },
  { keys: ['G', 'R'], description: 'Go to Research' },
  { keys: ['G', 'A'], description: 'Go to Agents' },
  { keys: ['G', 'T'], description: 'Go to Tools' },
  { keys: ['G', 'M'], description: 'Go to Memory' },
];

export function KeyboardShortcuts({ isOpen, onClose }: KeyboardShortcutsProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="relative z-50 w-full max-w-lg bg-white/90 backdrop-blur-3xl rounded-2xl shadow-2xl border border-white/40 overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Keyboard className="w-4 h-4 text-primary-dark" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">Keyboard Shortcuts</h2>
              </div>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">General</h3>
                <div className="space-y-2">
                  {shortcuts.map((s, i) => (
                    <div key={i} className="flex items-center justify-between py-2">
                      <span className="text-sm text-slate-600">{s.description}</span>
                      <div className="flex items-center gap-1">
                        {s.keys.map((key, j) => (
                          <span key={j}>
                            <kbd className="px-2 py-1 text-xs font-mono font-bold bg-slate-100 border border-slate-200 rounded-md text-slate-700 shadow-sm">
                              {key}
                            </kbd>
                            {j < s.keys.length - 1 && <span className="text-slate-300 mx-0.5">+</span>}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Navigation</h3>
                <div className="space-y-2">
                  {navShortcuts.map((s, i) => (
                    <div key={i} className="flex items-center justify-between py-2">
                      <span className="text-sm text-slate-600">{s.description}</span>
                      <div className="flex items-center gap-1">
                        {s.keys.map((key, j) => (
                          <span key={j}>
                            <kbd className="px-2 py-1 text-xs font-mono font-bold bg-slate-100 border border-slate-200 rounded-md text-slate-700 shadow-sm">
                              {key}
                            </kbd>
                            {j < s.keys.length - 1 && <span className="text-slate-300 mx-0.5">then</span>}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
