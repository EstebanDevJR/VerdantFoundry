import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { Hexagon, Settings, User, Menu, LogOut, LogIn } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { auth } from '@/lib/api';

const navLinks = [
  { name: 'Dashboard', route: '/dashboard' },
  { name: 'Research', route: '/research' },
  { name: 'Reports', route: '/reports' },
  { name: 'Agents', route: '/agents' },
  { name: 'Tools', route: '/tools' },
  { name: 'Memory', route: '/memory' },
  { name: 'Evolution', route: '/evolution' },
  { name: 'Kernel', route: '/kernel' },
];

export function Navbar() {
  const { setSidebarOpen, addNotification, isAuthenticated, setAuthenticated } = useStore();
  const navigate = useNavigate();

  const handleUserClick = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    navigate('/settings');
  };

  const handleLogout = () => {
    auth.clearToken();
    setAuthenticated(false);
    navigate('/login');
  };

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className="fixed top-0 left-0 right-0 h-[72px] z-40 flex items-center justify-center px-6"
    >
      <div className="w-full max-w-7xl h-14 glass rounded-full flex items-center justify-between px-6">
        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary-soft flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform duration-300">
            <Hexagon className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold tracking-tight text-slate-900 hidden sm:block">Verdant Foundry</span>
        </NavLink>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <NavLink
              key={link.name}
              to={link.route}
              className={({ isActive }) =>
                cn(
                  'px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 relative',
                  isActive
                    ? 'text-primary-dark'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {link.name}
                  {isActive && (
                    <motion.div
                      layoutId="navbar-active"
                      className="absolute inset-0 bg-primary/10 rounded-full -z-10"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              cn(
                'w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-200',
                isActive ? 'bg-primary/10 text-primary-dark' : 'text-slate-600 hover:bg-slate-100/50 hover:text-slate-900'
              )
            }
          >
            <Settings className="w-5 h-5" />
          </NavLink>
          {isAuthenticated ? (
            <>
              <div 
                onClick={handleUserClick}
                className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center cursor-pointer hover:border-primary/30 transition-colors duration-200"
              >
                <User className="w-5 h-5 text-slate-600" />
              </div>
              <button
                onClick={handleLogout}
                className="w-10 h-10 rounded-full flex items-center justify-center text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors duration-200"
                title="Sign out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </>
          ) : (
            <NavLink
              to="/login"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </NavLink>
          )}
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100/50 hover:text-slate-900 transition-colors duration-200 md:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.header>
  );
}
