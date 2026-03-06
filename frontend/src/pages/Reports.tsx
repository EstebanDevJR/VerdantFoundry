import { PageWrapper } from "@/components/layout/PageWrapper";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useStore } from "@/store/useStore";
import { 
  FileText, 
  LayoutTemplate, 
  Presentation, 
  Download, 
  Play,
  Wand2,
  Palette,
  Share2
} from "lucide-react";
import { ReportBuilder } from "@/components/reports/ReportBuilder";
import { VisualDesigner } from "@/components/reports/VisualDesigner";
import { PresentationViewer } from "@/components/reports/PresentationViewer";

type Tab = 'builder' | 'designer' | 'presentation';

export default function Reports() {
  const [activeTab, setActiveTab] = useState<Tab>('builder');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { addNotification } = useStore();

  const tabs = [
    { id: 'builder', label: 'Report Builder', icon: FileText },
    { id: 'designer', label: 'Visual Designer', icon: LayoutTemplate },
    { id: 'presentation', label: 'Presentation', icon: Presentation },
  ] as const;

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      addNotification({
        title: "Report Generated",
        message: "AI has successfully generated the report content based on recent research.",
        type: "success"
      });
    }, 2000);
  };

  const handleExport = () => {
    addNotification({
      title: "Exporting Report",
      message: "Preparing your document for download. This may take a moment...",
      type: "info"
    });
    setTimeout(() => {
      addNotification({
        title: "Export Complete",
        message: "Your report has been successfully exported as a PDF.",
        type: "success"
      });
    }, 2500);
  };

  if (isFullscreen && activeTab === 'presentation') {
    return <PresentationViewer isFullscreen={true} onExit={() => setIsFullscreen(false)} />;
  }

  return (
    <PageWrapper className="max-w-7xl mx-auto h-[calc(100vh-140px)] flex flex-col">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">
              Executive Reports
            </h1>
            <span className="px-2.5 py-1 rounded-md bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest shadow-sm">
              Studio
            </span>
          </div>
          <p className="text-slate-500 font-medium max-w-xl">
            Transform raw research into polished, executive-grade reports and presentations with AI-assisted design.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex bg-white/60 backdrop-blur-md border border-slate-200/60 rounded-xl p-1 shadow-sm">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === tab.id 
                    ? 'bg-white text-primary-dark shadow-sm ring-1 ring-slate-900/5' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                }`}
              >
                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-primary' : ''}`} />
                <span className="hidden md:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={handleGenerate}
              disabled={isGenerating}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-all shadow-md hover:shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:hover:shadow-md"
            >
              {isGenerating ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Wand2 className="w-4 h-4 text-primary-400" />
              )}
              Auto-Generate
            </button>
            
            {activeTab === 'presentation' ? (
              <button 
                onClick={() => setIsFullscreen(true)}
                className="px-4 py-2 rounded-xl bg-primary text-primary-dark text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                Present
              </button>
            ) : (
              <button 
                onClick={handleExport}
                className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm flex items-center gap-2"
              >
                <Download className="w-4 h-4 text-slate-400" />
                Export
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 relative">
        <AnimatePresence mode="wait">
          {activeTab === 'builder' && (
            <motion.div key="builder" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-full">
              <ReportBuilder />
            </motion.div>
          )}
          {activeTab === 'designer' && (
            <motion.div key="designer" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-full">
              <VisualDesigner />
            </motion.div>
          )}
          {activeTab === 'presentation' && (
            <motion.div key="presentation" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-full">
              <PresentationViewer isFullscreen={false} onExit={() => {}} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageWrapper>
  );
}
