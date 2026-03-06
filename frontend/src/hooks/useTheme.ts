import { useState, useEffect } from 'react';

export type Theme = 'default' | 'minimal' | 'dark' | 'presentation';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('vf-theme');
    return (saved as Theme) || 'default';
  });

  useEffect(() => {
    const root = document.documentElement;
    
    // Remove all theme classes
    root.classList.remove('theme-minimal', 'theme-dark', 'theme-presentation');
    
    // Add the selected theme class
    if (theme !== 'default') {
      root.classList.add(`theme-${theme}`);
    }
    
    // Save to localStorage
    localStorage.setItem('vf-theme', theme);
  }, [theme]);

  return { theme, setTheme };
}
