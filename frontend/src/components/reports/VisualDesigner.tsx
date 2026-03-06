import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useStore } from '@/store/useStore';
import { 
  LayoutTemplate, 
  Palette, 
  Type, 
  Image as ImageIcon,
  Columns,
  Maximize,
  CheckCircle2,
  Layers,
  MousePointer2,
  MonitorPlay,
  Download
} from 'lucide-react';

export function VisualDesigner() {
  const { addNotification } = useStore();
  const [activeTheme, setActiveTheme] = useState('verdant');
  const [activeLayout, setActiveLayout] = useState('standard');

  const handlePresent = () => {
    addNotification({
      title: "Presentation Mode",
      message: "Switch to the Presentation tab to view your slides.",
      type: "info"
    });
  };

  const themes = [
    { id: 'verdant', name: 'Verdant Glass', colors: ['bg-emerald-500', 'bg-slate-900', 'bg-white'] },
    { id: 'minimal', name: 'Executive Minimal', colors: ['bg-slate-900', 'bg-slate-500', 'bg-slate-100'] },
    { id: 'dark', name: 'Dark Executive', colors: ['bg-slate-900', 'bg-indigo-500', 'bg-slate-800'] },
    { id: 'presentation', name: 'Presentation', colors: ['bg-blue-600', 'bg-amber-500', 'bg-white'] },
  ];

  const layouts = [
    { id: 'standard', name: 'Standard Report', icon: LayoutTemplate },
    { id: 'two-column', name: 'Two Column', icon: Columns },
    { id: 'visual-heavy', name: 'Visual Heavy', icon: ImageIcon },
    { id: 'fullscreen', name: 'Fullscreen Slides', icon: Maximize },
  ];

  return (
    <div className="flex h-full gap-6">
      {/* Sidebar: Design Controls */}
      <div className="w-80 flex-shrink-0 flex flex-col gap-4">
        <div className="glass-panel p-5 rounded-3xl border border-white/40 flex-1 flex flex-col min-h-0 bg-white/60">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-200/50">
            <Layers className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-bold text-slate-800">Design System</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Palette className="w-3.5 h-3.5" /> Color Theme
            </h3>
            
            <div className="space-y-2 mb-8">
              {themes.map(theme => (
                <button
                  key={theme.id}
                  onClick={() => setActiveTheme(theme.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all group ${
                    activeTheme === theme.id 
                      ? 'bg-white border-primary/30 shadow-sm' 
                      : 'bg-transparent border-transparent hover:bg-white/60 hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-1.5">
                      {theme.colors.map((color, i) => (
                        <div key={i} className={`w-5 h-5 rounded-full border-2 border-white shadow-sm ${color} group-hover:scale-110 transition-transform`} style={{ zIndex: 3 - i }} />
                      ))}
                    </div>
                    <span className={`text-sm font-medium ${activeTheme === theme.id ? 'text-primary-dark font-semibold' : 'text-slate-600'}`}>
                      {theme.name}
                    </span>
                  </div>
                  {activeTheme === theme.id && <CheckCircle2 className="w-4 h-4 text-primary" />}
                </button>
              ))}
            </div>

            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <LayoutTemplate className="w-3.5 h-3.5" /> Page Layout
            </h3>
            
            <div className="grid grid-cols-2 gap-2 mb-8">
              {layouts.map(layout => (
                <button
                  key={layout.id}
                  onClick={() => setActiveLayout(layout.id)}
                  className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all ${
                    activeLayout === layout.id 
                      ? 'bg-white border-primary/30 shadow-sm text-primary-dark' 
                      : 'bg-white/40 border-transparent hover:bg-white/80 hover:border-slate-200 text-slate-500'
                  }`}
                >
                  <layout.icon className={`w-6 h-6 ${activeLayout === layout.id ? 'text-primary' : 'text-slate-400'}`} />
                  <span className="text-[11px] font-semibold text-center">{layout.name}</span>
                </button>
              ))}
            </div>
            
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Type className="w-3.5 h-3.5" /> Typography
            </h3>
            <div className="space-y-4 p-4 rounded-xl bg-white/40 border border-slate-100">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Heading Font</label>
                <select className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-medium focus:ring-2 focus:ring-primary/50 outline-none shadow-sm cursor-pointer">
                  <option>Inter (Default)</option>
                  <option>Playfair Display</option>
                  <option>Space Grotesk</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Body Font</label>
                <select className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-medium focus:ring-2 focus:ring-primary/50 outline-none shadow-sm cursor-pointer">
                  <option>Inter (Default)</option>
                  <option>Roboto</option>
                  <option>Georgia</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: Live Preview */}
      <div className="flex-1 glass-panel rounded-3xl border border-white/40 overflow-hidden flex flex-col bg-slate-100/50 relative">
        <div className="px-6 py-3 border-b border-slate-200/50 flex items-center justify-between bg-white/60 backdrop-blur-md z-10">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-slate-200 shadow-sm">
              <MousePointer2 className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-600">Select</span>
            </div>
            <div className="h-4 w-px bg-slate-300" />
            <span className="text-sm font-bold text-slate-800">Live Preview</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Zoom</span>
              <select className="text-xs bg-transparent border-none text-slate-700 font-bold focus:outline-none cursor-pointer">
                <option>Fit</option>
                <option>100%</option>
                <option>75%</option>
                <option>50%</option>
              </select>
            </div>
            <button 
              onClick={handlePresent}
              className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-primary hover:border-primary/30 transition-colors shadow-sm"
            >
              <MonitorPlay className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar flex justify-center items-start bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed">
          {/* Mock Document Preview */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`w-full max-w-3xl shadow-2xl rounded-sm overflow-hidden transition-all duration-500 ring-1 ring-slate-900/5 ${
              activeTheme === 'dark' ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'
            }`}
            style={{ minHeight: '1056px' }} // A4 approx
          >
            {/* Cover Page Mock */}
            <div className={`h-full flex flex-col justify-center p-16 relative ${
              activeTheme === 'verdant' ? 'bg-gradient-to-br from-emerald-50 to-white' :
              activeTheme === 'dark' ? 'bg-gradient-to-br from-slate-800 to-slate-900' :
              'bg-white'
            }`}>
              <div className="absolute top-16 left-16 w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-primary" />
              </div>
              
              <div className="mt-32">
                <p className={`text-sm font-bold uppercase tracking-widest mb-4 ${
                  activeTheme === 'dark' ? 'text-primary-400' : 'text-primary'
                }`}>Confidential Research Report</p>
                <h1 className={`text-6xl font-black tracking-tight leading-tight mb-6 ${
                  activeTheme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}>
                  Q3 Market Analysis &<br />Strategic Outlook
                </h1>
                <p className={`text-xl max-w-xl leading-relaxed ${
                  activeTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  An executive summary of competitive dynamics, regulatory shifts, and recommended strategic positioning for the upcoming fiscal year.
                </p>
              </div>
              
              <div className="mt-auto pt-16 border-t border-slate-200/50 flex justify-between items-end">
                <div>
                  <p className="font-bold">Prepared by</p>
                  <p className={activeTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>Alpha-7 Synthesis Agent</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">Date</p>
                  <p className={activeTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>October 24, 2023</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
