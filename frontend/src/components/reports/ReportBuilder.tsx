import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useStore } from '@/store/useStore';
import { 
  FileText, 
  List, 
  AlignLeft, 
  BarChart3, 
  Image as ImageIcon,
  MessageSquare,
  Plus,
  GripVertical,
  Trash2,
  Settings2,
  ChevronDown,
  Type,
  MoreHorizontal
} from 'lucide-react';

export function ReportBuilder() {
  const { addNotification } = useStore();
  const [sections, setSections] = useState([
    { id: 's1', type: 'cover', title: 'Cover Page', content: 'Q3 Market Analysis' },
    { id: 's2', type: 'summary', title: 'Executive Summary', content: 'Market adoption has increased by 24% quarter-over-quarter.' },
    { id: 's3', type: 'insights', title: 'Key Insights', content: 'Competitor feature parity is expected within 6 months.' },
    { id: 's4', type: 'chart', title: 'Growth Trajectory', content: 'Line chart showing user acquisition.' },
    { id: 's5', type: 'recommendations', title: 'Recommendations', content: 'Accelerate deployment of localized data clusters.' },
  ]);

  const [activeSection, setActiveSection] = useState('s2');
  const [activeFormats, setActiveFormats] = useState<string[]>([]);

  const handleAddBlock = () => {
    const newId = `s${Date.now()}`;
    setSections([...sections, { id: newId, type: 'text', title: 'New Section', content: '' }]);
    setActiveSection(newId);
  };

  const handleDeleteBlock = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSections = sections.filter(s => s.id !== id);
    setSections(newSections);
    if (activeSection === id && newSections.length > 0) {
      setActiveSection(newSections[0].id);
    }
  };

  const updateSection = (id: string, field: 'title' | 'content', value: string) => {
    setSections(sections.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const toggleFormat = (format: string) => {
    setActiveFormats(prev => 
      prev.includes(format) ? prev.filter(f => f !== format) : [...prev, format]
    );
  };

  const showToast = (title: string, message: string) => {
    addNotification({ title, message, type: 'info' });
  };

  return (
    <div className="flex h-full gap-6">
      {/* Sidebar: Section List */}
      <div className="w-72 flex-shrink-0 flex flex-col gap-4">
        <div className="glass-panel p-4 rounded-3xl border border-white/40 flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Document Outline</h3>
            <button 
              onClick={handleAddBlock}
              className="p-1.5 rounded-lg text-slate-400 hover:text-primary-dark hover:bg-primary/10 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1.5 pr-2">
            {sections.map((section, i) => (
              <div 
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all group ${
                  activeSection === section.id 
                    ? 'bg-white border-primary/30 shadow-sm' 
                    : 'bg-transparent border-transparent hover:bg-white/60 hover:border-slate-200'
                }`}
              >
                <div className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical className="w-4 h-4" />
                </div>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  section.type === 'cover' ? 'bg-purple-100 text-purple-600' :
                  section.type === 'summary' ? 'bg-blue-100 text-blue-600' :
                  section.type === 'insights' ? 'bg-amber-100 text-amber-600' :
                  section.type === 'chart' ? 'bg-emerald-100 text-emerald-600' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {section.type === 'cover' ? <ImageIcon className="w-3.5 h-3.5" /> :
                   section.type === 'summary' ? <AlignLeft className="w-3.5 h-3.5" /> :
                   section.type === 'insights' ? <MessageSquare className="w-3.5 h-3.5" /> :
                   section.type === 'chart' ? <BarChart3 className="w-3.5 h-3.5" /> :
                   <List className="w-3.5 h-3.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={`text-sm font-medium truncate ${activeSection === section.id ? 'text-primary-dark font-semibold' : 'text-slate-700'}`}>
                    {section.title}
                  </h4>
                  {/* Removed the subtitle for a cleaner look */}
                </div>
                {activeSection === section.id && (
                  <button 
                    onClick={(e) => handleDeleteBlock(section.id, e)}
                    className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content: Section Editor */}
      <div className="flex-1 glass-panel rounded-3xl border border-white/40 overflow-hidden flex flex-col bg-white/60">
        <div className="px-8 py-4 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
              {sections.find(s => s.id === activeSection)?.type} Block
            </span>
            <span className="text-sm text-slate-400">Last edited just now</span>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => showToast("Options", "Opening block options menu...")}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
            <button 
              onClick={() => showToast("Settings", "Opening block settings panel...")}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors flex items-center gap-2"
            >
              <Settings2 className="w-4 h-4" /> Block Settings
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
          <div className="max-w-3xl mx-auto">
            {/* Notion-like Editor Interface */}
            <div className="group relative">
              <div className="absolute -left-12 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                <button className="p-1 rounded text-slate-300 hover:text-slate-600 hover:bg-slate-100">
                  <Plus className="w-5 h-5" />
                </button>
                <button className="p-1 rounded text-slate-300 hover:text-slate-600 hover:bg-slate-100 cursor-grab">
                  <GripVertical className="w-5 h-5" />
                </button>
              </div>
              <input 
                type="text" 
                value={sections.find(s => s.id === activeSection)?.title || ''}
                onChange={(e) => updateSection(activeSection, 'title', e.target.value)}
                placeholder="Untitled"
                className="w-full bg-transparent border-none focus:ring-0 outline-none text-4xl font-black tracking-tight text-slate-900 placeholder:text-slate-300 mb-6" 
              />
            </div>
            
            {/* Formatting Toolbar (Floating) */}
            <div className="sticky top-0 z-10 mb-6 flex items-center gap-1 p-1.5 bg-white border border-slate-200 shadow-sm rounded-xl w-max">
              <button 
                onClick={() => showToast("Text Style", "Opening text style dropdown...")}
                className="px-3 py-1.5 rounded-lg flex items-center gap-2 text-slate-700 hover:bg-slate-100 text-sm font-medium transition-colors"
              >
                <Type className="w-4 h-4 text-slate-400" /> Text <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
              <div className="w-px h-5 bg-slate-200 mx-1" />
              {['B', 'I', 'U', 'S'].map(format => (
                <button 
                  key={format} 
                  onClick={() => toggleFormat(format)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-serif font-bold transition-colors ${
                    activeFormats.includes(format) ? 'bg-primary/10 text-primary-dark' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {format}
                </button>
              ))}
              <div className="w-px h-5 bg-slate-200 mx-1" />
              <button 
                onClick={() => toggleFormat('align')}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                  activeFormats.includes('align') ? 'bg-primary/10 text-primary-dark' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <AlignLeft className="w-4 h-4" />
              </button>
            </div>

            <div className="group relative">
              <div className="absolute -left-12 top-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                <button className="p-1 rounded text-slate-300 hover:text-slate-600 hover:bg-slate-100">
                  <Plus className="w-5 h-5" />
                </button>
                <button className="p-1 rounded text-slate-300 hover:text-slate-600 hover:bg-slate-100 cursor-grab">
                  <GripVertical className="w-5 h-5" />
                </button>
              </div>
              <textarea 
                rows={1} 
                value={sections.find(s => s.id === activeSection)?.content || ''}
                onChange={(e) => updateSection(activeSection, 'content', e.target.value)}
                placeholder="Type '/' for commands"
                className="w-full bg-transparent border-none focus:ring-0 outline-none resize-none text-lg text-slate-700 leading-relaxed placeholder:text-slate-300 min-h-[100px]" 
              />
            </div>

            {sections.find(s => s.id === activeSection)?.type === 'chart' && (
              <div className="group relative mt-4">
                <div className="absolute -left-12 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  <button className="p-1 rounded text-slate-300 hover:text-slate-600 hover:bg-slate-100">
                    <Plus className="w-5 h-5" />
                  </button>
                  <button className="p-1 rounded text-slate-300 hover:text-slate-600 hover:bg-slate-100 cursor-grab">
                    <GripVertical className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 flex flex-col items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer group/chart">
                  <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center mb-4 group-hover/chart:scale-110 transition-transform">
                    <BarChart3 className="w-8 h-8 text-primary" />
                  </div>
                  <p className="font-semibold text-slate-700 mb-1">Data Visualization Block</p>
                  <p className="text-sm text-slate-400 mb-6">Connect to a data source or paste CSV data to generate a chart.</p>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => showToast("Data Source", "Opening data source selector...")}
                      className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                    >
                      Select Data Source
                    </button>
                    <button 
                      onClick={() => showToast("AI Generation", "Analyzing context to generate chart...")}
                      className="px-5 py-2.5 rounded-xl bg-primary text-primary-dark text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm"
                    >
                      Generate with AI
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Empty Block Placeholder */}
            <div className="group relative mt-4">
              <div className="absolute -left-12 top-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                <button className="p-1 rounded text-slate-300 hover:text-slate-600 hover:bg-slate-100">
                  <Plus className="w-5 h-5" />
                </button>
                <button className="p-1 rounded text-slate-300 hover:text-slate-600 hover:bg-slate-100 cursor-grab">
                  <GripVertical className="w-5 h-5" />
                </button>
              </div>
              <input 
                type="text" 
                placeholder="Type '/' for commands"
                className="w-full bg-transparent border-none focus:ring-0 outline-none text-lg text-slate-700 leading-relaxed placeholder:text-slate-300" 
              />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
