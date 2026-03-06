import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Save, Play, Terminal, CheckCircle2 } from 'lucide-react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-python';
import 'prismjs/themes/prism-tomorrow.css';
import { useStore } from '@/store/useStore';

interface ToolEditorProps {
  tool: any;
  onClose: () => void;
}

const defaultCode = `// Tool Implementation: Web Search API
export async function execute(params) {
  const { query } = params;
  
  console.log(\`Searching for: \${query}\`);
  
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1200));
  
  return {
    success: true,
    results: [
      { title: "Result 1", url: "https://example.com/1" },
      { title: "Result 2", url: "https://example.com/2" }
    ]
  };
}
`;

export function ToolEditor({ tool, onClose }: ToolEditorProps) {
  const { addNotification } = useStore();
  const [code, setCode] = useState(defaultCode);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setIsSaved(true);
      addNotification({
        title: "Tool Saved",
        message: `${tool.name} implementation has been saved successfully.`,
        type: "success"
      });
      setTimeout(() => setIsSaved(false), 2000);
    }, 800);
  };

  const handleRun = () => {
    setIsRunning(true);
    setLogs(['> Initializing sandbox environment...', '> Compiling tool code...', '> Executing...']);
    addNotification({
      title: "Running Tool",
      message: `Executing ${tool.name} in sandbox environment...`,
      type: "info"
    });
    
    setTimeout(() => {
      setLogs(prev => [...prev, `> Searching for: test query`]);
    }, 500);

    setTimeout(() => {
      setLogs(prev => [...prev, '> Execution completed successfully in 1.2s.', '> Return value:', JSON.stringify({ success: true, results: [] }, null, 2)]);
      setIsRunning(false);
      addNotification({
        title: "Execution Complete",
        message: `${tool.name} executed successfully.`,
        type: "success"
      });
    }, 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm"
    >
      <div className="bg-[#0A0F1C] w-full max-w-6xl h-[85vh] rounded-3xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#111827]">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
              <tool.icon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-100">{tool.name}</h2>
              <p className="text-xs text-slate-400 font-mono">ID: {tool.id} • Type: {tool.type}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={handleRun}
              disabled={isRunning}
              className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium disabled:opacity-50"
            >
              {isRunning ? <div className="w-4 h-4 border-2 border-slate-400 border-t-white rounded-full animate-spin" /> : <Play className="w-4 h-4" />}
              Run Test
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving || isSaved}
              className="px-4 py-2 rounded-lg bg-primary text-primary-dark hover:bg-primary/90 transition-colors flex items-center gap-2 text-sm font-medium font-bold disabled:opacity-50"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-primary-dark/30 border-t-primary-dark rounded-full animate-spin" />
              ) : isSaved ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isSaving ? 'Saving...' : isSaved ? 'Saved' : 'Save Changes'}
            </button>
            <div className="w-px h-6 bg-slate-700 mx-1" />
            <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 flex min-h-0">
          {/* Editor */}
          <div className="flex-1 border-r border-slate-800 overflow-y-auto custom-scrollbar relative bg-[#1E1E1E]">
            <Editor
              value={code}
              onValueChange={code => setCode(code)}
              highlight={code => Prism.highlight(code, Prism.languages.javascript, 'javascript')}
              padding={24}
              style={{
                fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                fontSize: 14,
                backgroundColor: 'transparent',
                color: '#d4d4d4',
                minHeight: '100%'
              }}
              className="editor-container"
            />
          </div>

          {/* Sidebar / Logs */}
          <div className="w-96 flex flex-col bg-[#0A0F1C]">
            <div className="px-4 py-3 border-b border-slate-800 bg-[#111827] flex items-center gap-2 text-slate-400">
              <Terminal className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Execution Logs</span>
            </div>
            <div className="flex-1 p-4 overflow-y-auto custom-scrollbar font-mono text-xs space-y-2">
              {logs.length === 0 ? (
                <div className="text-slate-600 italic">No logs yet. Click "Run Test" to execute the tool.</div>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className={log.includes('successfully') ? 'text-emerald-400' : log.includes('Error') ? 'text-red-400' : 'text-slate-300 whitespace-pre-wrap'}>
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
