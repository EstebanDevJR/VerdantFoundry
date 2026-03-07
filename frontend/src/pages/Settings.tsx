import { PageWrapper } from '@/components/layout/PageWrapper';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme, Theme } from '@/hooks/useTheme';
import { useStore } from '@/store/useStore';
import { users } from '@/lib/api';
import { 
  User, 
  Bell, 
  Shield, 
  Key, 
  Monitor, 
  Moon, 
  Sun,
  CreditCard,
  Users,
  Save,
  Plus,
  Trash2,
  Copy,
  CheckCircle2,
  Eye,
  EyeOff,
  Settings2
} from 'lucide-react';

type Tab = 'profile' | 'preferences' | 'api-keys' | 'team' | 'privacy';

export default function Settings() {
  const { addNotification, ambientParticles, setAmbientParticles } = useStore();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [showKey, setShowKey] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const { theme, setTheme } = useTheme();
  const [apiKeys, setApiKeys] = useState<Array<{ id: string; name: string; key: string; lastUsed: string | null; createdAt: string }>>([]);
  const [apiKeysLoading, setApiKeysLoading] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (useStore.getState().isAuthenticated) {
      setProfileLoading(true);
      users.getProfile()
        .then((profile) => {
          setFirstName(profile.firstName ?? '');
          setLastName(profile.lastName ?? '');
          setEmail(profile.email ?? '');
        })
        .catch(() => {})
        .finally(() => setProfileLoading(false));
    } else {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'api-keys' && useStore.getState().isAuthenticated) {
      setApiKeysLoading(true);
      users.getApiKeys().then(setApiKeys).catch(() => setApiKeys([])).finally(() => setApiKeysLoading(false));
    }
  }, [activeTab]);

  const handleCreateApiKey = async () => {
    try {
      const res = await users.createApiKey('New API Key', 'vf_test');
      setNewKey(res.key);
      addNotification({ title: 'API Key Created', message: res.message, type: 'success' });
      users.getApiKeys().then(setApiKeys);
    } catch (e) {
      addNotification({ title: 'Error', message: (e as Error).message, type: 'error' });
    }
  };

  const handleRevokeApiKey = async (id: string) => {
    try {
      await users.revokeApiKey(id);
      setApiKeys((prev) => prev.filter((k) => k.id !== id));
      addNotification({ title: 'Key Revoked', message: 'API key revoked successfully.', type: 'success' });
    } catch (e) {
      addNotification({ title: 'Error', message: (e as Error).message, type: 'error' });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = await users.updateProfile({ firstName, lastName });
      setFirstName(updated.firstName ?? '');
      setLastName(updated.lastName ?? '');
      addNotification({
        title: "Settings Saved",
        message: "Your profile information has been updated successfully.",
        type: "success"
      });
    } catch (err) {
      addNotification({
        title: "Error",
        message: (err as Error).message,
        type: "error"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    addNotification({
      title: "Copied to Clipboard",
      message: "API Key copied to clipboard.",
      type: "success"
    });
    setTimeout(() => setCopied(null), 2000);
  };

  const handleAction = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    addNotification({ title, message, type });
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'preferences', label: 'Preferences', icon: Monitor },
    { id: 'api-keys', label: 'API Keys', icon: Key },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'privacy', label: 'Data & Privacy', icon: Shield },
  ] as const;

  return (
    <PageWrapper className="max-w-6xl mx-auto h-[calc(100vh-140px)] flex flex-col">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Settings</h1>
        <p className="text-slate-500">Manage your account, preferences, and system configurations.</p>
      </div>

      <div className="flex flex-1 gap-8 min-h-0">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0 flex flex-col gap-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id 
                  ? 'bg-white text-primary-dark shadow-sm border border-slate-200/60' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-white/50 border border-transparent'
              }`}
            >
              <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-primary' : 'text-slate-400'}`} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div className="flex-1 glass-panel rounded-3xl border border-white/40 overflow-hidden flex flex-col bg-white/50">
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <div className="max-w-2xl">
              <AnimatePresence mode="wait">
                {activeTab === 'profile' && (
                  <motion.div
                    key="profile"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-8"
                  >
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 mb-1">Profile Information</h2>
                      <p className="text-sm text-slate-500 mb-6">Update your account's profile information and email address.</p>
                      
                      <div className="flex items-center gap-6 mb-8">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                          {(firstName?.[0] ?? '').toUpperCase()}{(lastName?.[0] ?? '').toUpperCase() || '?'}
                        </div>
                        <div className="flex gap-3">
                          <button 
                            onClick={() => handleAction("Change Avatar", "Opening file picker to select a new avatar...")}
                            className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm"
                          >
                            Change Avatar
                          </button>
                          <button 
                            onClick={() => handleAction("Avatar Removed", "Your avatar has been reset to default.", "success")}
                            className="px-4 py-2 rounded-xl text-slate-500 text-sm font-medium hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      {profileLoading ? (
                        <div className="flex items-center gap-3 py-8 justify-center">
                          <div className="w-5 h-5 border-2 border-slate-300 border-t-primary rounded-full animate-spin" />
                          <span className="text-sm text-slate-500">Loading profile...</span>
                        </div>
                      ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">First Name</label>
                            <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-primary/50 outline-none transition-all text-slate-900" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Last Name</label>
                            <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-primary/50 outline-none transition-all text-slate-900" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
                          <input type="email" value={email} readOnly className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 outline-none transition-all cursor-not-allowed" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1.5">Role / Title</label>
                          <input type="text" defaultValue="Lead AI Researcher" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-primary/50 outline-none transition-all text-slate-900" />
                        </div>
                      </div>
                      )}
                    </div>

                    <div className="pt-6 border-t border-slate-200">
                      <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-6 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors shadow-md shadow-slate-900/10 flex items-center gap-2 disabled:opacity-70"
                      >
                        {isSaving ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'preferences' && (
                  <motion.div
                    key="preferences"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-8"
                  >
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 mb-1">System Preferences</h2>
                      <p className="text-sm text-slate-500 mb-6">Customize your workspace experience.</p>
                      
                      <div className="space-y-6">
                        <div className="flex flex-col gap-4 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
                          <div>
                            <h3 className="font-semibold text-slate-900">Interface Theme</h3>
                            <p className="text-sm text-slate-500">Select your preferred visual style for the Verdant Foundry application.</p>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              { id: 'default', name: 'Verdant Glass', desc: 'Light, airy, and modern' },
                              { id: 'minimal', name: 'Executive Minimal', desc: 'Clean, high-contrast, professional' },
                              { id: 'dark', name: 'Dark Executive', desc: 'Sleek, low-light environment' },
                              { id: 'presentation', name: 'Presentation', desc: 'Bold, high-impact colors' },
                            ].map((t) => (
                              <button
                                key={t.id}
                                onClick={() => setTheme(t.id as Theme)}
                                className={`flex flex-col items-start p-4 rounded-xl border-2 transition-all text-left ${
                                  theme === t.id 
                                    ? 'border-primary bg-primary/5 shadow-sm' 
                                    : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                <span className={`font-semibold ${theme === t.id ? 'text-primary-dark' : 'text-slate-900'}`}>
                                  {t.name}
                                </span>
                                <span className="text-xs text-slate-500 mt-1">{t.desc}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                          <div>
                            <h3 className="font-semibold text-slate-900">Desktop Notifications</h3>
                            <p className="text-sm text-slate-500">Receive alerts when long-running tasks complete.</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                          <div>
                            <h3 className="font-semibold text-slate-900">Ambient Particles</h3>
                            <p className="text-sm text-slate-500">Floating reactive particles that respond to mouse movement.</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={ambientParticles}
                              onChange={(e) => setAmbientParticles(e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                          <div>
                            <h3 className="font-semibold text-slate-900">Compact Mode</h3>
                            <p className="text-sm text-slate-500">Reduce whitespace to fit more content on screen.</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'api-keys' && (
                  <motion.div
                    key="api-keys"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-8"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h2 className="text-xl font-bold text-slate-900 mb-1">API Keys</h2>
                          <p className="text-sm text-slate-500">Manage keys for programmatic access to Verdant Foundry.</p>
                        </div>
                        <button 
                          onClick={handleCreateApiKey}
                          disabled={apiKeysLoading}
                          className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors shadow-md shadow-slate-900/10 flex items-center gap-2 disabled:opacity-50"
                        >
                          <Plus className="w-4 h-4" /> Create Key
                        </button>
                      </div>
                      
                      {newKey && (
                        <div className="p-4 mb-4 rounded-xl bg-emerald-50 border border-emerald-200">
                          <p className="text-sm font-medium text-emerald-800 mb-2">Store this key securely. It will not be shown again.</p>
                          <code className="block px-3 py-2 bg-white rounded-lg text-sm font-mono break-all">{newKey}</code>
                          <button onClick={() => { copyToClipboard(newKey, 'new'); setNewKey(null); }} className="mt-2 text-sm text-emerald-600 hover:underline">Copy & Dismiss</button>
                        </div>
                      )}
                      <div className="space-y-4">
                        {apiKeysLoading ? (
                          <p className="text-slate-500">Loading API keys...</p>
                        ) : apiKeys.length === 0 && !newKey ? (
                          <p className="text-slate-500">No API keys yet. Create one to get started.</p>
                        ) : (
                        apiKeys.map(apiKey => (
                          <div key={apiKey.id} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="font-semibold text-slate-900">{apiKey.name}</h3>
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => handleAction("Key Settings", "Opening API key configuration...")}
                                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                                >
                                  <Settings2 className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleRevokeApiKey(apiKey.id)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 mb-4">
                              <code className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono text-slate-600">
                                {apiKey.key}
                              </code>
                              <button 
                                onClick={() => copyToClipboard(apiKey.key, apiKey.id)}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                                title="Copy key prefix"
                              >
                                {copied === apiKey.id ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                              </button>
                            </div>
                            <div className="flex items-center gap-6 text-xs text-slate-500">
                              <span>Created: {new Date(apiKey.createdAt).toLocaleDateString()}</span>
                              <span>Last used: {apiKey.lastUsed ? new Date(apiKey.lastUsed).toLocaleString() : 'Never'}</span>
                            </div>
                          </div>
                        )))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'team' && (
                  <motion.div
                    key="team"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-8"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h2 className="text-xl font-bold text-slate-900 mb-1">Team Members</h2>
                          <p className="text-sm text-slate-500">Manage who has access to this workspace.</p>
                        </div>
                        <button 
                          onClick={() => handleAction("Invite Member", "Opening invitation dialog...")}
                          className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors shadow-md shadow-slate-900/10 flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" /> Invite Member
                        </button>
                      </div>
                      
                      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="divide-y divide-slate-100">
                          {[
                            { name: 'Jane Doe', email: 'jane@example.com', role: 'Owner', initials: 'JD', color: 'bg-blue-500' },
                            { name: 'Alex Smith', email: 'alex@example.com', role: 'Admin', initials: 'AS', color: 'bg-emerald-500' },
                            { name: 'Sam Wilson', email: 'sam@example.com', role: 'Viewer', initials: 'SW', color: 'bg-amber-500' },
                          ].map((member, i) => (
                            <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                              <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full ${member.color} flex items-center justify-center text-white font-bold text-sm shadow-sm`}>
                                  {member.initials}
                                </div>
                                <div>
                                  <div className="font-semibold text-slate-900">{member.name}</div>
                                  <div className="text-sm text-slate-500">{member.email}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                                  member.role === 'Owner' ? 'bg-purple-100 text-purple-700' :
                                  member.role === 'Admin' ? 'bg-blue-100 text-blue-700' :
                                  'bg-slate-100 text-slate-600'
                                }`}>
                                  {member.role}
                                </span>
                                {member.role !== 'Owner' && (
                                  <button 
                                    onClick={() => handleAction("Remove Member", `${member.name} has been removed from the workspace.`, "warning")}
                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'privacy' && (
                  <motion.div
                    key="privacy"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-8"
                  >
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 mb-1">Data & Privacy</h2>
                      <p className="text-sm text-slate-500 mb-6">Manage your data retention and account security.</p>
                      
                      <div className="space-y-6">
                        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
                          <h3 className="font-semibold text-slate-900 mb-2">Data Retention</h3>
                          <p className="text-sm text-slate-500 mb-4">Choose how long agent memory and logs are stored before automatic deletion.</p>
                          <select className="w-full max-w-xs text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-medium focus:ring-2 focus:ring-primary/50 outline-none">
                            <option>30 Days</option>
                            <option>90 Days</option>
                            <option>1 Year</option>
                            <option>Indefinitely</option>
                          </select>
                        </div>

                        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
                          <h3 className="font-semibold text-slate-900 mb-2">Export Data</h3>
                          <p className="text-sm text-slate-500 mb-4">Download a complete archive of your workspace, including all agent memories, logs, and configurations.</p>
                          <button 
                            onClick={() => handleAction("Data Export Requested", "We are preparing your data archive. You will receive an email when it's ready.", "success")}
                            className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm"
                          >
                            Request Data Export
                          </button>
                        </div>

                        <div className="p-5 bg-red-50 rounded-2xl border border-red-100">
                          <h3 className="font-semibold text-red-900 mb-2">Danger Zone</h3>
                          <p className="text-sm text-red-700/80 mb-4">Permanently delete your account and all associated data. This action cannot be undone.</p>
                          <button 
                            onClick={() => handleAction("Delete Account", "Account deletion process initiated. Please check your email to confirm.", "error")}
                            className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors shadow-sm"
                          >
                            Delete Account
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
