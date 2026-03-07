import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { useStore } from '@/store/useStore';
import { reports as reportsApi } from '@/lib/api';
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
  MoreHorizontal,
  Save,
  RefreshCw,
  Download,
  Code,
  Heading
} from 'lucide-react';

type Block = {
  type: string;
  content: string;
  meta?: Record<string, unknown>;
};

type Report = {
  id: string;
  title: string;
  blocks: Block[];
  themeId: string | null;
  layoutId: string | null;
};

export function ReportBuilder() {
  const { addNotification } = useStore();
  const [reportList, setReportList] = useState<Array<{ id: string; title: string; updatedAt: string }>>([]);
  const [activeReport, setActiveReport] = useState<Report | null>(null);
  const [activeBlockIndex, setActiveBlockIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const list = await reportsApi.list();
      setReportList(list.map((r: any) => ({ id: r.id, title: r.title, updatedAt: r.updatedAt || r.createdAt })));
      if (list.length > 0 && !activeReport) {
        const full = await reportsApi.get(list[0].id) as Report;
        setActiveReport(full);
      }
    } catch {
      // fallback
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectReport = async (id: string) => {
    try {
      const full = await reportsApi.get(id) as Report;
      setActiveReport(full);
      setActiveBlockIndex(0);
    } catch (err) {
      addNotification({ title: 'Error', message: (err as Error).message, type: 'error' });
    }
  };

  const handleAddBlock = async (type = 'markdown') => {
    if (!activeReport) return;
    try {
      const updated = await reportsApi.addBlock(activeReport.id, {
        type,
        content: '',
        afterIndex: activeBlockIndex,
      }) as Report;
      setActiveReport(updated);
      setActiveBlockIndex(activeBlockIndex + 1);
    } catch (err) {
      addNotification({ title: 'Error', message: (err as Error).message, type: 'error' });
    }
  };

  const handleDeleteBlock = async (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeReport) return;
    try {
      const updated = await reportsApi.removeBlock(activeReport.id, index) as Report;
      setActiveReport(updated);
      if (activeBlockIndex >= updated.blocks.length) {
        setActiveBlockIndex(Math.max(0, updated.blocks.length - 1));
      }
    } catch (err) {
      addNotification({ title: 'Error', message: (err as Error).message, type: 'error' });
    }
  };

  const handleUpdateBlock = useCallback(async (index: number, content: string) => {
    if (!activeReport) return;
    const block = activeReport.blocks[index];
    if (!block) return;

    const updatedBlocks = [...activeReport.blocks];
    updatedBlocks[index] = { ...block, content };
    setActiveReport({ ...activeReport, blocks: updatedBlocks });
  }, [activeReport]);

  const handleSave = async () => {
    if (!activeReport) return;
    setIsSaving(true);
    try {
      await reportsApi.update(activeReport.id, {
        title: activeReport.title,
        blocks: activeReport.blocks,
      });
      addNotification({ title: 'Saved', message: 'Report saved successfully.', type: 'success' });
    } catch (err) {
      addNotification({ title: 'Save Failed', message: (err as Error).message, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = (format: 'pdf' | 'html' | 'markdown' | 'docx') => {
    if (!activeReport) return;
    const url = reportsApi.exportUrl(activeReport.id, format);
    window.open(url, '_blank');
    addNotification({ title: 'Export Started', message: `Exporting as ${format.toUpperCase()}...`, type: 'info' });
  };

  const handleCreateReport = async () => {
    try {
      const newReport = await reportsApi.create({
        title: 'Untitled Report',
        blocks: [{ type: 'heading', content: 'New Report', meta: { level: 1 } }],
      }) as Report;
      await loadReports();
      setActiveReport(newReport);
    } catch (err) {
      addNotification({ title: 'Error', message: (err as Error).message, type: 'error' });
    }
  };

  const handleUpdateTitle = (title: string) => {
    if (!activeReport) return;
    setActiveReport({ ...activeReport, title });
  };

  const getBlockIcon = (type: string) => {
    switch (type) {
      case 'heading': return <Heading className="w-3.5 h-3.5" />;
      case 'markdown': return <AlignLeft className="w-3.5 h-3.5" />;
      case 'code': return <Code className="w-3.5 h-3.5" />;
      case 'image': return <ImageIcon className="w-3.5 h-3.5" />;
      case 'chart': return <BarChart3 className="w-3.5 h-3.5" />;
      default: return <FileText className="w-3.5 h-3.5" />;
    }
  };

  const getBlockColor = (type: string) => {
    switch (type) {
      case 'heading': return 'bg-purple-100 text-purple-600';
      case 'markdown': return 'bg-blue-100 text-blue-600';
      case 'code': return 'bg-slate-100 text-slate-600';
      case 'image': return 'bg-amber-100 text-amber-600';
      case 'chart': return 'bg-emerald-100 text-emerald-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-full gap-6">
      {/* Sidebar */}
      <div className="w-72 flex-shrink-0 flex flex-col gap-4">
        <div className="glass-panel p-4 rounded-3xl border border-white/40 flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Reports</h3>
            <button onClick={handleCreateReport} className="p-1.5 rounded-lg text-slate-400 hover:text-primary-dark hover:bg-primary/10 transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1.5 pr-2 mb-4">
            {reportList.map((report) => (
              <div
                key={report.id}
                onClick={() => handleSelectReport(report.id)}
                className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                  activeReport?.id === report.id
                    ? 'bg-white border-primary/30 shadow-sm'
                    : 'bg-transparent border-transparent hover:bg-white/60 hover:border-slate-200'
                }`}
              >
                <h4 className="text-sm font-medium text-slate-700 truncate">{report.title}</h4>
                <span className="text-[10px] text-slate-400">{new Date(report.updatedAt).toLocaleDateString()}</span>
              </div>
            ))}
            {reportList.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-4">No reports yet. Create one or generate from research.</p>
            )}
          </div>

          {activeReport && (
            <>
              <div className="border-t border-slate-100 pt-3 mb-3">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">Blocks</h3>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1.5 pr-2">
                {activeReport.blocks.map((block, i) => (
                  <div
                    key={i}
                    onClick={() => setActiveBlockIndex(i)}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all group ${
                      activeBlockIndex === i
                        ? 'bg-white border-primary/30 shadow-sm'
                        : 'bg-transparent border-transparent hover:bg-white/60 hover:border-slate-200'
                    }`}
                  >
                    <div className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      <GripVertical className="w-4 h-4" />
                    </div>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${getBlockColor(block.type)}`}>
                      {getBlockIcon(block.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-slate-700 truncate">
                        {block.content.slice(0, 40) || `${block.type} block`}
                      </h4>
                    </div>
                    <button
                      onClick={(e) => handleDeleteBlock(i, e)}
                      className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => handleAddBlock()}
                  className="w-full p-2.5 rounded-xl border border-dashed border-slate-200 text-slate-400 hover:border-primary hover:text-primary-dark transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" /> Add Block
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Editor */}
      <div className="flex-1 glass-panel rounded-3xl border border-white/40 overflow-hidden flex flex-col bg-white/60">
        {activeReport ? (
          <>
            <div className="px-8 py-4 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                  {activeReport.blocks[activeBlockIndex]?.type || 'empty'} Block
                </span>
                <span className="text-sm text-slate-400">Block {activeBlockIndex + 1} of {activeReport.blocks.length}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save
                </button>
                <div className="relative group">
                  <button className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors flex items-center gap-2">
                    <Download className="w-4 h-4" /> Export
                  </button>
                  <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50 min-w-[140px] hidden group-hover:block">
                    {(['pdf', 'html', 'markdown', 'docx'] as const).map((fmt) => (
                      <button
                        key={fmt}
                        onClick={() => handleExport(fmt)}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        {fmt.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
              <div className="max-w-3xl mx-auto">
                <div className="group relative">
                  <input
                    type="text"
                    value={activeReport.title}
                    onChange={(e) => handleUpdateTitle(e.target.value)}
                    placeholder="Untitled Report"
                    className="w-full bg-transparent border-none focus:ring-0 outline-none text-4xl font-black tracking-tight text-slate-900 placeholder:text-slate-300 mb-8"
                  />
                </div>

                {activeReport.blocks.map((block, i) => (
                  <div
                    key={i}
                    className={`group relative mb-4 rounded-xl transition-all ${
                      activeBlockIndex === i ? 'ring-2 ring-primary/20' : ''
                    }`}
                    onClick={() => setActiveBlockIndex(i)}
                  >
                    <div className="absolute -left-12 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      <button
                        onClick={() => { setActiveBlockIndex(i); handleAddBlock(); }}
                        className="p-1 rounded text-slate-300 hover:text-slate-600 hover:bg-slate-100"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                      <button className="p-1 rounded text-slate-300 hover:text-slate-600 hover:bg-slate-100 cursor-grab">
                        <GripVertical className="w-5 h-5" />
                      </button>
                    </div>

                    {block.type === 'heading' ? (
                      <input
                        type="text"
                        value={block.content}
                        onChange={(e) => handleUpdateBlock(i, e.target.value)}
                        placeholder="Heading..."
                        className={`w-full bg-transparent border-none focus:ring-0 outline-none font-bold text-slate-900 placeholder:text-slate-300 ${
                          (block.meta?.level as number) === 1 ? 'text-3xl' :
                          (block.meta?.level as number) === 2 ? 'text-2xl' : 'text-xl'
                        }`}
                      />
                    ) : block.type === 'code' ? (
                      <textarea
                        value={block.content}
                        onChange={(e) => handleUpdateBlock(i, e.target.value)}
                        placeholder="// Code block..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-mono text-sm text-slate-800 focus:ring-2 focus:ring-primary/30 outline-none resize-none min-h-[80px]"
                      />
                    ) : (
                      <textarea
                        value={block.content}
                        onChange={(e) => handleUpdateBlock(i, e.target.value)}
                        placeholder="Type your content here..."
                        rows={Math.max(3, Math.ceil(block.content.length / 80))}
                        className="w-full bg-transparent border-none focus:ring-0 outline-none resize-none text-lg text-slate-700 leading-relaxed placeholder:text-slate-300"
                      />
                    )}
                  </div>
                ))}

                {activeReport.blocks.length === 0 && (
                  <div className="text-center py-12 text-slate-400">
                    <p className="mb-4">This report is empty.</p>
                    <button
                      onClick={() => handleAddBlock()}
                      className="px-4 py-2 rounded-xl bg-primary/10 text-primary-dark font-medium hover:bg-primary/20 transition-colors"
                    >
                      Add First Block
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            <div className="text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="font-medium text-slate-600 mb-2">No report selected</p>
              <p className="text-sm mb-4">Select a report from the sidebar or create a new one.</p>
              <button
                onClick={handleCreateReport}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors"
              >
                Create Report
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
