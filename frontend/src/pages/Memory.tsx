import { PageWrapper } from "@/components/layout/PageWrapper";
import {
  Database,
  Search,
  Tag,
  Clock,
  HardDrive,
  Filter,
  FileText,
  Code,
  Image as ImageIcon,
  Trash2,
  Download,
  List,
  Network,
  Plus,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { MemoryGraph } from "@/components/memory/MemoryGraph";
import { useStore } from "@/store/useStore";
import { memory as memoryApi } from "@/lib/api";

export default function Memory() {
  const { addNotification } = useStore();
  const [memories, setMemories] = useState<any[]>([]);
  const [selectedMemory, setSelectedMemory] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'graph'>('list');
  const [stats, setStats] = useState<{ nodeCount: number; sizeBytes: number; sizeMB: string } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ title: '', type: 'document', content: '', tags: '' });
  const [isCreating, setIsCreating] = useState(false);

  const loadMemories = () => {
    memoryApi.list().then((data: any) => {
      if (Array.isArray(data)) setMemories(data);
    }).catch(() => {});
  };

  useEffect(() => {
    loadMemories();
    memoryApi.getStats().then(setStats).catch(() => {});
  }, []);

  const handleDownload = () => {
    addNotification({
      title: "Download Started",
      message: `Downloading ${selectedMemory?.title}...`,
      type: "info"
    });
  };

  const handleDelete = async () => {
    if (!selectedMemory) return;
    try {
      await memoryApi.remove(selectedMemory.id);
      setMemories(prev => prev.filter(m => m.id !== selectedMemory.id));
      addNotification({ title: "Memory Deleted", message: `${selectedMemory.title} removed.`, type: "warning" });
      setSelectedMemory(null);
    } catch (err) {
      addNotification({ title: "Error", message: (err as Error).message, type: "error" });
    }
  };

  const handleFilter = () => {
    addNotification({
      title: "Advanced Filters",
      message: "Opening advanced filter options...",
      type: "info"
    });
  };

  const handleCreateDocument = async () => {
    if (!createForm.title.trim() || !createForm.content.trim()) return;
    setIsCreating(true);
    try {
      const tags = createForm.tags.split(',').map(t => t.trim()).filter(Boolean);
      await memoryApi.createDocument({
        title: createForm.title,
        type: createForm.type,
        content: createForm.content,
        tags: tags.length > 0 ? tags : undefined,
      });
      addNotification({ title: "Document Created", message: `"${createForm.title}" added to memory.`, type: "success" });
      setShowCreateModal(false);
      setCreateForm({ title: '', type: 'document', content: '', tags: '' });
      loadMemories();
      memoryApi.getStats().then(setStats).catch(() => {});
    } catch (err) {
      addNotification({ title: "Error", message: (err as Error).message, type: "error" });
    } finally {
      setIsCreating(false);
    }
  };

  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    const timeout = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await memoryApi.search(searchQuery, activeTag ? [activeTag] : undefined, 20) as any[];
        setSearchResults(Array.isArray(results) ? results : []);
      } catch {
        setSearchResults(null);
      } finally {
        setIsSearching(false);
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchQuery, activeTag]);

  const allTags = Array.from(new Set(memories.flatMap((m) => m.tags ?? [])));

  const filteredMemories = searchResults ?? memories.filter((m) => {
    const matchesTag = activeTag ? m.tags?.includes(activeTag) : true;
    return matchesTag;
  });

  const getIconForType = (type: string) => {
    switch (type) {
      case "document":
        return FileText;
      case "code":
        return Code;
      case "image":
        return ImageIcon;
      default:
        return Database;
    }
  };

  return (
    <PageWrapper className="max-w-6xl mx-auto h-[calc(100vh-140px)] flex flex-col">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">
            Memory Bank
          </h1>
          <p className="text-slate-500">
            Long-term storage and retrieval for agent knowledge.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="flex bg-white/50 border border-slate-200 rounded-full p-1 shadow-sm mr-2">
            <button 
              onClick={() => setViewMode('list')} 
              className={`p-2 rounded-full transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-primary-dark' : 'text-slate-500 hover:text-slate-700'}`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('graph')} 
              className={`p-2 rounded-full transition-colors ${viewMode === 'graph' ? 'bg-white shadow-sm text-primary-dark' : 'text-slate-500 hover:text-slate-700'}`}
              title="Graph View"
            >
              <Network className="w-4 h-4" />
            </button>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search memories..."
              className="pl-9 pr-4 py-2.5 rounded-full bg-white/50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 w-64"
            />
          </div>
          <button 
            onClick={handleFilter}
            className="p-2.5 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        <div className="w-64 flex-shrink-0 flex flex-col gap-6">
          <div className="glass-panel p-6 rounded-3xl border border-white/40">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <HardDrive className="w-4 h-4" />
              Storage Overview
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-500">Used Space</span>
                  <span className="font-medium text-slate-900">{stats?.sizeMB ?? '—'}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-[45%]" />
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-500">Vector Index</span>
                  <span className="font-medium text-slate-900">
                    {stats ? `${stats.nodeCount.toLocaleString()} nodes` : '—'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Sync Status</span>
                  <span className="font-medium text-emerald-600">
                    Up to date
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors shadow-md"
              >
                <Plus className="w-4 h-4" />
                Create Document
              </button>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-white/40 flex-1 overflow-y-auto custom-scrollbar">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveTag(null)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeTag === null
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                All
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(tag)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    activeTag === tag
                      ? "bg-primary text-white"
                      : "bg-primary/10 text-primary-dark hover:bg-primary/20"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div
          className={`glass-panel rounded-3xl border border-white/40 flex flex-col overflow-hidden transition-all duration-300 ${selectedMemory && viewMode === 'list' ? "w-1/2" : "flex-1"}`}
        >
          {viewMode === 'list' ? (
            <>
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">
                  {filteredMemories.length} items found
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                <div className="space-y-2">
                  <AnimatePresence>
                    {filteredMemories.map((memory, i) => {
                      const Icon = getIconForType(memory.type);
                      return (
                        <motion.div
                          key={memory.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.2, delay: i * 0.05 }}
                          onClick={() => setSelectedMemory(memory)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer group flex flex-col ${
                            selectedMemory?.id === memory.id
                              ? "bg-primary/5 border-primary/30 shadow-sm"
                              : "bg-white/40 border-slate-100 hover:bg-white/80 hover:border-slate-200 hover:shadow-sm"
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div
                                className={`p-2 rounded-xl ${
                                  selectedMemory?.id === memory.id
                                    ? "bg-primary/20 text-primary-dark"
                                    : "bg-slate-100 text-slate-500 group-hover:bg-primary/10 group-hover:text-primary-dark"
                                } transition-colors`}
                              >
                                <Icon className="w-5 h-5" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-slate-900 group-hover:text-primary-dark transition-colors">
                                  {memory.title}
                                </h3>
                                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> {memory.date}
                                  </span>
                                  <span>•</span>
                                  <span>{memory.size}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-3 pl-12">
                            {memory.tags.map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-1 rounded-md bg-slate-100 text-slate-500 text-[10px] uppercase font-bold tracking-wider"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                  {filteredMemories.length === 0 && (
                    <div className="p-8 text-center text-slate-500">
                      <Database className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p>No memories found matching your criteria.</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 p-2">
              <MemoryGraph />
            </div>
          )}
        </div>

        <AnimatePresence>
          {selectedMemory && viewMode === 'list' && (
            <motion.div
              initial={{ opacity: 0, x: 20, width: 0 }}
              animate={{ opacity: 1, x: 0, width: "50%" }}
              exit={{ opacity: 0, x: 20, width: 0 }}
              className="glass-panel rounded-3xl border border-white/40 overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary-dark">
                    {(() => {
                      const Icon = getIconForType(selectedMemory.type);
                      return <Icon className="w-5 h-5" />;
                    })()}
                  </div>
                  <div>
                    <h2 className="font-semibold text-slate-900">
                      {selectedMemory.title}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {selectedMemory.date} • {selectedMemory.size}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleDownload}
                    className="p-2 rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleDelete}
                    className="p-2 rounded-full hover:bg-red-50 text-red-500 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSelectedMemory(null)}
                    className="p-2 rounded-full hover:bg-slate-200 text-slate-500 transition-colors ml-2"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-6 flex-1 overflow-y-auto custom-scrollbar bg-white/30">
                <div className="flex gap-2 mb-6">
                  {selectedMemory.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-md bg-primary/10 text-primary-dark text-xs font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                    Content Preview
                  </h3>
                  {selectedMemory.type === "code" ||
                  selectedMemory.type === "data" ? (
                    <div className="bg-slate-900 rounded-xl p-4 overflow-x-auto">
                      <pre className="text-sm font-mono text-slate-300">
                        {selectedMemory.content}
                      </pre>
                    </div>
                  ) : selectedMemory.type === "image" ? (
                    <div className="w-full h-64 bg-slate-200 rounded-xl flex items-center justify-center border border-slate-300 border-dashed">
                      <ImageIcon className="w-12 h-12 text-slate-400" />
                    </div>
                  ) : (
                    <div className="prose prose-slate prose-sm max-w-none">
                      <p>{selectedMemory.content}</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showCreateModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-40"
              onClick={() => setShowCreateModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-slate-900">Create Document</h2>
                  <button onClick={() => setShowCreateModal(false)} className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Title</label>
                    <input
                      type="text"
                      value={createForm.title}
                      onChange={(e) => setCreateForm(f => ({ ...f, title: e.target.value }))}
                      placeholder="Document title"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Type</label>
                    <select
                      value={createForm.type}
                      onChange={(e) => setCreateForm(f => ({ ...f, type: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all text-slate-900"
                    >
                      <option value="document">Document</option>
                      <option value="code">Code</option>
                      <option value="data">Data</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Content</label>
                    <textarea
                      value={createForm.content}
                      onChange={(e) => setCreateForm(f => ({ ...f, content: e.target.value }))}
                      placeholder="Enter content..."
                      rows={5}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all text-slate-900 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Tags (comma-separated)</label>
                    <input
                      type="text"
                      value={createForm.tags}
                      onChange={(e) => setCreateForm(f => ({ ...f, tags: e.target.value }))}
                      placeholder="e.g. research, api, notes"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all text-slate-900"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateDocument}
                    disabled={isCreating || !createForm.title.trim() || !createForm.content.trim()}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors shadow-md disabled:opacity-50 flex items-center gap-2"
                  >
                    {isCreating && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                    {isCreating ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}
