import { Outlet, useNavigate } from 'react-router-dom';
import { Navbar } from './Navbar';
import { CommandPalette } from './CommandPalette';
import { Sidebar } from './Sidebar';
import { Notifications } from './Notifications';
import { useEffect } from 'react';
import { useStore } from '@/store/useStore';

export function Layout() {
  const { isSidebarOpen, setSidebarOpen, setCommandPaletteOpen } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSidebarOpen, setSidebarOpen, navigate, setCommandPaletteOpen]);

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <div className="noise-overlay" />
      
      {/* Background ambient gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[60%] rounded-full bg-primary-soft/5 blur-[120px]" />
      </div>

      <Navbar />
      <CommandPalette />
      <Sidebar />
      <Notifications />
      
      <main className="flex-1 pt-[100px] pb-12 px-6 w-full max-w-7xl mx-auto relative z-10">
        <Outlet />
      </main>
    </div>
  );
}
