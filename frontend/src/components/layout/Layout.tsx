import { Outlet, useNavigate } from 'react-router-dom';
import { Navbar } from './Navbar';
import { CommandPalette } from './CommandPalette';
import { Sidebar } from './Sidebar';
import { Notifications } from './Notifications';
import { KeyboardShortcuts } from './KeyboardShortcuts';
import { AmbientParticles } from './AmbientParticles';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';

export function Layout() {
  const { isSidebarOpen, setSidebarOpen, setCommandPaletteOpen, isShortcutsOpen, setShortcutsOpen, ambientParticles } = useStore();
  const navigate = useNavigate();
  const goBufferRef = useRef<string | null>(null);
  const goTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const goRoutes: Record<string, string> = {
      d: '/dashboard',
      r: '/research',
      a: '/agents',
      t: '/tools',
      m: '/memory',
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      if (e.metaKey || e.ctrlKey) {
        if (e.key === 'b') {
          e.preventDefault();
          setSidebarOpen(!isSidebarOpen);
        } else if (e.key === 'n') {
          e.preventDefault();
          navigate('/research');
        } else if (e.key === '/') {
          e.preventDefault();
          setCommandPaletteOpen(true);
        } else if (e.key === '?') {
          e.preventDefault();
          setShortcutsOpen(true);
        }
        return;
      }

      if (e.key === 'Escape') {
        setShortcutsOpen(false);
        return;
      }

      if (goBufferRef.current === 'g') {
        const route = goRoutes[e.key.toLowerCase()];
        if (route) {
          e.preventDefault();
          navigate(route);
        }
        goBufferRef.current = null;
        if (goTimerRef.current) clearTimeout(goTimerRef.current);
        return;
      }

      if (e.key.toLowerCase() === 'g') {
        goBufferRef.current = 'g';
        if (goTimerRef.current) clearTimeout(goTimerRef.current);
        goTimerRef.current = setTimeout(() => { goBufferRef.current = null; }, 500);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSidebarOpen, setSidebarOpen, navigate, setCommandPaletteOpen, setShortcutsOpen]);

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <div className="noise-overlay" />
      
      {ambientParticles && <AmbientParticles />}

      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[60%] rounded-full bg-primary-soft/5 blur-[120px]" />
      </div>

      <Navbar />
      <CommandPalette />
      <Sidebar />
      <Notifications />
      <KeyboardShortcuts isOpen={isShortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      
      <main className="flex-1 pt-[100px] pb-12 px-6 w-full max-w-7xl mx-auto relative z-10">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
}
