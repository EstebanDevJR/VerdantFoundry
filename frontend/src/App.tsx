/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { useTheme } from './hooks/useTheme';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Research from './pages/Research';
import Agents from './pages/Agents';
import Tools from './pages/Tools';
import Memory from './pages/Memory';
import Settings from './pages/Settings';
import Evolution from './pages/Evolution';
import Kernel from './pages/Kernel';
import Reports from './pages/Reports';

export default function App() {
  // Initialize theme globally
  useTheme();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Landing />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="research" element={<Research />} />
          <Route path="agents" element={<Agents />} />
          <Route path="tools" element={<Tools />} />
          <Route path="memory" element={<Memory />} />
          <Route path="evolution" element={<Evolution />} />
          <Route path="kernel" element={<Kernel />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
