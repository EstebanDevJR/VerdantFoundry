import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '@/store/useStore';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  Maximize, 
  Settings2,
  BarChart3,
  AlignLeft,
  MessageSquare
} from 'lucide-react';

export function PresentationViewer({ isFullscreen, onExit }: { isFullscreen: boolean, onExit: () => void }) {
  const { addNotification } = useStore();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleSettings = () => {
    addNotification({
      title: "Presentation Settings",
      message: "Opening slide transition and timing settings...",
      type: "info"
    });
  };

  const slides = [
    { id: 's1', type: 'cover', title: 'Q3 Market Analysis', subtitle: 'Strategic Outlook & Recommendations', bg: 'bg-black', text: 'text-white' },
    { id: 's2', type: 'insight', title: 'Market Adoption', content: 'Adoption has increased by 24% quarter-over-quarter, driven by enterprise sector growth.', stat: '+24%', icon: BarChart3, bg: 'bg-white', text: 'text-slate-900' },
    { id: 's3', type: 'insight', title: 'Competitive Landscape', content: 'Feature parity with leading competitors is expected within 6 months based on current development velocity.', stat: '6mo', icon: AlignLeft, bg: 'bg-slate-50', text: 'text-slate-900' },
    { id: 's4', type: 'recommendation', title: 'Strategic Recommendation', content: 'Accelerate deployment of localized data clusters to preempt regulatory friction while maintaining current growth trajectory.', stat: 'Action', icon: MessageSquare, bg: 'bg-primary-dark', text: 'text-white' },
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % slides.length);
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, slides.length]);

  const nextSlide = () => setCurrentSlide(prev => Math.min(prev + 1, slides.length - 1));
  const prevSlide = () => setCurrentSlide(prev => Math.max(prev - 1, 0));

  const containerClasses = isFullscreen 
    ? "fixed inset-0 z-50 bg-black flex flex-col" 
    : "flex flex-col h-full glass-panel rounded-3xl border border-white/40 overflow-hidden relative bg-slate-100/50";

  return (
    <div className={containerClasses}>
      {/* Top Bar */}
      <div className={`p-4 flex items-center justify-between z-20 transition-opacity ${isFullscreen ? 'absolute top-0 left-0 right-0 opacity-0 hover:opacity-100 bg-gradient-to-b from-black/50 to-transparent' : 'border-b border-slate-200/50 bg-white/40 backdrop-blur-md'}`}>
        <div className="flex items-center gap-4">
          <h2 className={`text-lg font-bold ${isFullscreen ? 'text-white' : 'text-slate-900'}`}>
            Presentation Mode
          </h2>
          <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${isFullscreen ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
            Slide {currentSlide + 1} of {slides.length}
          </span>
        </div>
        <div className="flex gap-2">
          {isFullscreen ? (
            <button onClick={onExit} className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors backdrop-blur-md">
              <X className="w-5 h-5" />
            </button>
          ) : (
            <button 
              onClick={handleSettings}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <Settings2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Slide Area */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-black">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className={`absolute inset-0 flex flex-col items-center justify-center p-16 ${slides[currentSlide].bg} ${slides[currentSlide].text}`}
          >
            {slides[currentSlide].type === 'cover' ? (
              <div className="text-center max-w-4xl">
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20">
                  <div className="w-12 h-12 rounded-full bg-white/80" />
                </motion.div>
                <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="text-7xl font-black tracking-tight leading-tight mb-6">
                  {slides[currentSlide].title}
                </motion.h1>
                <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="text-2xl font-medium opacity-80">
                  {slides[currentSlide].subtitle}
                </motion.p>
              </div>
            ) : (
              <div className="w-full max-w-5xl grid grid-cols-12 gap-12 items-center">
                <div className="col-span-8">
                  <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="flex items-center gap-4 mb-8">
                    {React.createElement(slides[currentSlide].icon, { className: "w-8 h-8 opacity-80" })}
                    <h2 className="text-4xl font-bold tracking-tight uppercase opacity-80">{slides[currentSlide].type}</h2>
                  </motion.div>
                  <motion.h1 initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="text-6xl font-black tracking-tight leading-tight mb-8">
                    {slides[currentSlide].title}
                  </motion.h1>
                  <motion.p initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="text-2xl leading-relaxed opacity-90">
                    {slides[currentSlide].content}
                  </motion.p>
                </div>
                <div className="col-span-4 flex justify-center">
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }} 
                    transition={{ delay: 0.5, type: 'spring' }}
                    className={`w-64 h-64 rounded-full border backdrop-blur-md flex items-center justify-center shadow-2xl ${
                      slides[currentSlide].bg === 'bg-white' || slides[currentSlide].bg === 'bg-slate-50'
                        ? 'bg-slate-100 border-slate-200 text-slate-900'
                        : 'bg-white/10 border-white/20 text-white'
                    }`}
                  >
                    <span className="text-6xl font-black tracking-tighter">{slides[currentSlide].stat}</span>
                  </motion.div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Controls */}
      <div className={`p-6 flex items-center justify-center gap-6 z-20 transition-opacity ${isFullscreen ? 'absolute bottom-0 left-0 right-0 opacity-0 hover:opacity-100 bg-gradient-to-t from-black/50 to-transparent' : 'bg-slate-900 border-t border-slate-800'}`}>
        <button 
          onClick={prevSlide} 
          disabled={currentSlide === 0}
          className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors backdrop-blur-md"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        
        <button 
          onClick={() => setIsPlaying(!isPlaying)}
          className="p-4 rounded-full bg-white text-black hover:bg-slate-200 transition-colors shadow-lg"
        >
          {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
        </button>
        
        <button 
          onClick={nextSlide} 
          disabled={currentSlide === slides.length - 1}
          className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors backdrop-blur-md"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
