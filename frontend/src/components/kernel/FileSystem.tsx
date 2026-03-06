import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useStore } from '@/store/useStore';
import { 
  HardDrive, 
  Folder, 
  FileText, 
  FileJson, 
  FileCode, 
  MoreVertical,
  Plus,
  Search,
  ChevronRight,
  Database,
  Bot,
  Wrench,
  Clock
} from 'lucide-react';

export function FileSystem() {
  const { addNotification } = useStore();
  const [currentPath, setCurrentPath] = useState(['/']);
  
  const handleNewFile = () => {
    addNotification({
      title: "New File",
      message: "Opening new file dialog...",
      type: "info"
    });
  };

  const handleFileAction = (fileName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    addNotification({
      title: "File Options",
      message: `Opening options for ${fileName}`,
      type: "info"
    });
  };

  const handleFolderAction = (folderName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    addNotification({
      title: "Folder Options",
      message: `Opening options for ${folderName}`,
      type: "info"
    });
  };
  
  const folders = [
    { name: 'agents', icon: Bot, items: 12, size: '24 MB', date: 'Oct 24, 2023' },
    { name: 'tools', icon: Wrench, items: 8, size: '5 MB', date: 'Oct 23, 2023' },
    { name: 'memory', icon: Database, items: 145, size: '1.2 GB', date: 'Today, 10:15 AM' },
    { name: 'sessions', icon: Clock, items: 34, size: '120 MB', date: 'Yesterday, 4:30 PM' },
    { name: 'logs', icon: FileText, items: 256, size: '4.5 GB', date: 'Today, 10:05 AM' },
  ];

  const files = [
    { name: 'alpha-7.json', type: 'json', size: '12 KB', date: 'Oct 24, 2023' },
    { name: 'beta-2.json', type: 'json', size: '15 KB', date: 'Oct 22, 2023' },
    { name: 'web-search.ts', type: 'code', size: '4 KB', date: 'Oct 20, 2023' },
    { name: 'system.log', type: 'text', size: '2.1 MB', date: 'Today, 10:00 AM' },
  ];

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex items-center justify-between glass-panel p-4 rounded-3xl border border-white/40 flex-shrink-0">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
          <HardDrive className="w-5 h-5 text-primary mr-2" />
          <span className="hover:text-primary-dark cursor-pointer transition-colors" onClick={() => setCurrentPath(['/'])}>root</span>
          {currentPath.map((path, i) => path !== '/' && (
            <React.Fragment key={i}>
              <ChevronRight className="w-4 h-4 text-slate-400" />
              <span className="hover:text-primary-dark cursor-pointer transition-colors">{path}</span>
            </React.Fragment>
          ))}
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search files..." 
              className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary/50 outline-none transition-all text-sm w-64"
            />
          </div>
          <button 
            onClick={handleNewFile}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors shadow-md shadow-slate-900/10 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> New File
          </button>
        </div>
      </div>

      <div className="flex-1 glass-panel rounded-3xl border border-white/40 overflow-hidden flex flex-col min-h-0">
        <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-100 bg-slate-50/50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <div className="col-span-5">Name</div>
          <div className="col-span-2">Date Modified</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-2 text-right">Size</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar space-y-1">
          {currentPath.length === 1 && folders.map((folder, i) => (
            <motion.div 
              key={folder.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setCurrentPath([...currentPath, folder.name])}
              className="grid grid-cols-12 gap-4 px-4 py-3 items-center bg-white/40 border border-transparent rounded-2xl hover:bg-white hover:border-slate-200 hover:shadow-sm cursor-pointer transition-all group"
            >
              <div className="col-span-5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 group-hover:bg-blue-100 transition-colors">
                  <folder.icon className="w-5 h-5" />
                </div>
                <span className="font-semibold text-slate-900 group-hover:text-primary-dark transition-colors">{folder.name}</span>
              </div>
              <div className="col-span-2 text-sm text-slate-500">{folder.date}</div>
              <div className="col-span-2 text-sm text-slate-500">Folder</div>
              <div className="col-span-2 text-sm text-slate-500 text-right">{folder.items} items</div>
              <div className="col-span-1 flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={(e) => handleFolderAction(folder.name, e)}
                  className="p-1.5 rounded-md text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}

          {files.map((file, i) => (
            <motion.div 
              key={file.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (folders.length + i) * 0.05 }}
              className="grid grid-cols-12 gap-4 px-4 py-3 items-center bg-white/40 border border-transparent rounded-2xl hover:bg-white hover:border-slate-200 hover:shadow-sm cursor-pointer transition-all group"
            >
              <div className="col-span-5 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  file.type === 'json' ? 'bg-amber-50 text-amber-500 group-hover:bg-amber-100' :
                  file.type === 'code' ? 'bg-emerald-50 text-emerald-500 group-hover:bg-emerald-100' :
                  'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                }`}>
                  {file.type === 'json' ? <FileJson className="w-5 h-5" /> :
                   file.type === 'code' ? <FileCode className="w-5 h-5" /> :
                   <FileText className="w-5 h-5" />}
                </div>
                <span className="font-medium text-slate-700 group-hover:text-primary-dark transition-colors">{file.name}</span>
              </div>
              <div className="col-span-2 text-sm text-slate-500">{file.date}</div>
              <div className="col-span-2 text-sm text-slate-500 uppercase">{file.type}</div>
              <div className="col-span-2 text-sm text-slate-500 text-right">{file.size}</div>
              <div className="col-span-1 flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={(e) => handleFileAction(file.name, e)}
                  className="p-1.5 rounded-md text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
