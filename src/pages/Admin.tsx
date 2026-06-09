import { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthProvider';
import { supabase } from '../lib/supabase';
import { 
  LogOut, ArrowLeft, Check, X, ShieldAlert, Users, Search, Bell, Activity, 
  Smartphone, AlertTriangle, UploadCloud, Send, CheckSquare, Square, Menu,
  Settings, LayoutDashboard, RefreshCw, SmartphoneNfc, Plus, Image as ImageIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';

type AppUpdate = {
  id: string;
  version_code: number;
  version_name: string;
  update_url: string;
  release_notes: string;
  is_mandatory: boolean;
  created_at: string;
};

type Profile = {
  id: string;
  email: string;
  device_name: string | null;
  android_version: string | null;
  is_banned: boolean;
  push_token?: string | null; // To check if push is enabled
  created_at: string;
};

const Admin = () => {
  const { user, signOut } = useAuth();
  const [updates, setUpdates] = useState<AppUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Mobile Menu State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState<'overview' | 'updates' | 'settings'>('overview');

  // Form State for Updates
  const [versionCode, setVersionCode] = useState('');
  const [versionName, setVersionName] = useState('');
  const [updateUrl, setUpdateUrl] = useState('');
  const [releaseNotes, setReleaseNotes] = useState('');
  const [isMandatory, setIsMandatory] = useState(false);

  // Push Notification State
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch Updates
    const { data: updatesData, error: updatesError } = await supabase
      .from('app_updates')
      .select('*')
      .order('version_code', { ascending: false });

    if (updatesError) {
      if (updatesError.code === '42P01') {
        setError("The 'app_updates' table does not exist. Please run the SQL script in your Supabase dashboard.");
      } else {
        console.error('Error fetching updates:', updatesError);
      }
    } else if (updatesData) {
      setUpdates(updatesData);
    }

    // Fetch Profiles
    // Assume we select push_token if it exists. If it fails, it will just omit it.
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (profilesData) setProfiles(profilesData);

    // Fetch Settings
    const { data: settingsData } = await supabase
      .from('app_settings')
      .select('maintenance_mode')
      .eq('id', 1)
      .single();
    if (settingsData) setMaintenanceMode(settingsData.maintenance_mode);

    setLoading(false);
  };

  const isAdmin = user?.email === import.meta.env.VITE_ADMIN_EMAIL || user?.email === 'mojahidgfx@gmail.com';

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const toggleMaintenanceMode = async () => {
    const newVal = !maintenanceMode;
    const { error } = await supabase
      .from('app_settings')
      .update({ maintenance_mode: newVal })
      .eq('id', 1);
    
    if (!error) {
      setMaintenanceMode(newVal);
    } else {
      alert('Failed to update maintenance mode: ' + error.message);
    }
  };

  const toggleBan = async (userId: string, currentStatus: boolean) => {
    const newVal = !currentStatus;
    const { error } = await supabase
      .from('profiles')
      .update({ is_banned: newVal })
      .eq('id', userId);

    if (!error) {
      setProfiles(profiles.map(p => p.id === userId ? { ...p, is_banned: newVal } : p));
    } else {
      alert('Failed to update user status: ' + error.message);
    }
  };

  const handlePublishUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setIsSubmitting(true);
    
    const { error } = await supabase
      .from('app_updates')
      .insert([
        {
          version_code: parseInt(versionCode),
          version_name: versionName,
          update_url: updateUrl,
          release_notes: releaseNotes,
          is_mandatory: isMandatory,
        }
      ]);

    if (error) {
      console.error('Error adding update:', error);
      alert('Failed to add update: ' + error.message);
    } else {
      setVersionCode('');
      setVersionName('');
      setUpdateUrl('');
      setReleaseNotes('');
      setIsMandatory(false);
      fetchData();
      alert('Update published successfully!');
    }
    setIsSubmitting(false);
  };

  // Selection Logic
  const toggleSelectUser = (id: string) => {
    setSelectedUsers(prev => prev.includes(id) ? prev.filter(u => u !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === profiles.length && profiles.length > 0) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(profiles.map(p => p.id));
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const title = formData.get('title') as string;
    const body = formData.get('body') as string;
    const imageUrl = formData.get('imageUrl') as string;
    
    if (!title || !body) {
      alert('Title and body are required.');
      return;
    }

    const isBroadcast = selectedUsers.length === 0;
    const payload = {
      title,
      body,
      imageUrl: imageUrl || undefined,
      userIds: isBroadcast ? 'all' : selectedUsers
    };

    setIsSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke('send_push_notification', {
        body: payload
      });

      if (error) throw error;
      alert(`Push notification sent successfully to ${isBroadcast ? 'ALL users' : `${selectedUsers.length} selected users`}!`);
      setIsNotificationModalOpen(false);
      setSelectedUsers([]);
      (e.target as HTMLFormElement).reset();
    } catch (err: any) {
      console.error(err);
      alert('Failed to send notification: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="bg-[#111] p-8 rounded-3xl shadow-2xl border border-white/5 max-w-md w-full text-center relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-red-500/20 blur-[100px] pointer-events-none"></div>
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
            <ShieldAlert className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">Access Denied</h1>
          <p className="text-gray-400 mb-8 leading-relaxed text-sm">
            You do not have permission to view the Admin Panel. This area is restricted to administrators only.
          </p>
          <Link 
            to="/" 
            className="inline-flex items-center justify-center w-full bg-white hover:bg-gray-100 text-black font-semibold py-3.5 px-4 rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 mr-2" /> Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const totalUsers = profiles.length;
  const bannedUsers = profiles.filter(p => p.is_banned).length;
  const pushEnabledUsers = profiles.filter(p => p.push_token).length;
  const totalUpdates = updates.length;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-200 font-sans selection:bg-indigo-500/30">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute top-1/4 -left-40 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative z-10 flex flex-col md:flex-row min-h-screen">
        {/* Sidebar / Topnav Mobile */}
        <div className="md:w-64 border-b md:border-b-0 md:border-r border-white/10 bg-[#111]/80 backdrop-blur-xl flex-shrink-0 flex flex-col transition-all duration-300">
          <div className="flex h-16 md:h-20 items-center justify-between px-6 border-b border-white/5">
            <div className="flex items-center gap-3 font-bold text-lg text-white tracking-wide">
              <div className="bg-gradient-to-tr from-indigo-500 to-purple-500 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
                <ShieldAlert className="w-5 h-5 text-white" />
              </div>
              DynamQR
            </div>
            <button 
              className="md:hidden text-gray-400 hover:text-white p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          <div className={`${isMobileMenuOpen ? 'flex' : 'hidden'} md:flex flex-col flex-1 p-4 gap-2`}>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-4 px-3">Menu</p>
            <button 
              onClick={() => { setActiveTab('overview'); setIsMobileMenuOpen(false); }} 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${activeTab === 'overview' ? 'bg-white/10 text-white shadow-sm border border-white/5' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              <LayoutDashboard className="w-5 h-5" /> Overview
            </button>
            <button 
              onClick={() => { setActiveTab('updates'); setIsMobileMenuOpen(false); }} 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${activeTab === 'updates' ? 'bg-white/10 text-white shadow-sm border border-white/5' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              <RefreshCw className="w-5 h-5" /> Updates
            </button>
            <button 
              onClick={() => { setActiveTab('settings'); setIsMobileMenuOpen(false); }} 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${activeTab === 'settings' ? 'bg-white/10 text-white shadow-sm border border-white/5' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              <Settings className="w-5 h-5" /> Settings
            </button>

            <div className="mt-auto pt-4 border-t border-white/5">
              <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-gray-400 hover:text-white hover:bg-white/5 font-medium">
                <Home className="w-5 h-5" /> App Dashboard
              </Link>
              <button 
                onClick={signOut}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-red-400 hover:text-red-300 hover:bg-red-500/10 font-medium mt-2"
              >
                <LogOut className="w-5 h-5" /> Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col h-screen overflow-y-auto overflow-x-hidden relative">
          {/* Header */}
          <header className="h-16 md:h-20 flex items-center justify-between px-4 md:px-8 bg-transparent sticky top-0 z-20 backdrop-blur-md border-b border-white/5">
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight capitalize">
              {activeTab}
            </h2>
            <div className="flex items-center space-x-3 md:space-x-4">
              <div className="relative hidden md:flex items-center">
                <Search className="absolute left-3 w-4 h-4 text-gray-500" />
                <input
                  type="search"
                  placeholder="Search users..."
                  className="h-10 w-64 rounded-full bg-white/5 border border-white/10 pl-10 pr-4 text-sm text-white placeholder-gray-500 outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all"
                />
              </div>
              <button className="relative p-2.5 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full border border-[#0a0a0a]"></span>
              </button>
              <div className="hidden md:flex h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border-2 border-[#111] items-center justify-center shadow-lg">
                <span className="text-sm font-bold text-white shadow-sm">{user?.email?.substring(0, 2).toUpperCase()}</span>
              </div>
            </div>
          </header>

          <main className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8 pb-24">
            
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* Metric Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-[#111]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-5 shadow-xl hover:bg-[#151515] transition-colors relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Users className="w-16 h-16 text-indigo-500" />
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl">
                        <Users className="w-5 h-5" />
                      </div>
                      <h3 className="text-gray-400 font-medium text-sm">Total Users</h3>
                    </div>
                    <div className="text-3xl font-bold text-white">{totalUsers}</div>
                  </div>

                  <div className="bg-[#111]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-5 shadow-xl hover:bg-[#151515] transition-colors relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Bell className="w-16 h-16 text-emerald-500" />
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl">
                        <Bell className="w-5 h-5" />
                      </div>
                      <h3 className="text-gray-400 font-medium text-sm">Push Enabled</h3>
                    </div>
                    <div className="text-3xl font-bold text-white">{pushEnabledUsers}</div>
                  </div>

                  <div className="bg-[#111]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-5 shadow-xl hover:bg-[#151515] transition-colors relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <UploadCloud className="w-16 h-16 text-blue-500" />
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-xl">
                        <UploadCloud className="w-5 h-5" />
                      </div>
                      <h3 className="text-gray-400 font-medium text-sm">Total Updates</h3>
                    </div>
                    <div className="text-3xl font-bold text-white">{totalUpdates}</div>
                  </div>

                  <div className="bg-[#111]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-5 shadow-xl hover:bg-[#151515] transition-colors relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Activity className="w-16 h-16 text-purple-500" />
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2.5 bg-purple-500/20 text-purple-400 rounded-xl">
                        <Activity className="w-5 h-5" />
                      </div>
                      <h3 className="text-gray-400 font-medium text-sm">System Status</h3>
                    </div>
                    <div className="text-xl md:text-2xl font-bold text-white truncate">
                      {maintenanceMode ? <span className="text-amber-400">Maintenance</span> : <span className="text-emerald-400">Online</span>}
                    </div>
                  </div>
                </div>

                {/* User Table */}
                <div className="bg-[#111]/80 backdrop-blur-xl border border-white/5 rounded-3xl shadow-xl flex flex-col overflow-hidden">
                  <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        Users Directory
                      </h3>
                      <p className="text-sm text-gray-400 mt-1">Manage users, access, and notifications.</p>
                    </div>
                    <button 
                      onClick={() => setIsNotificationModalOpen(true)}
                      className="inline-flex items-center justify-center gap-2 bg-white text-black hover:bg-gray-200 font-semibold py-2 px-4 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-sm whitespace-nowrap"
                    >
                      <Bell className="w-4 h-4" /> 
                      {selectedUsers.length > 0 ? `Notify ${selectedUsers.length} Users` : 'Broadcast to All'}
                    </button>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-gray-400 uppercase bg-white/5 border-b border-white/5">
                        <tr>
                          <th className="px-6 py-4 w-12">
                            <button onClick={toggleSelectAll} className="text-gray-400 hover:text-white transition-colors">
                              {selectedUsers.length === profiles.length && profiles.length > 0 ? <CheckSquare className="w-5 h-5 text-indigo-400" /> : <Square className="w-5 h-5" />}
                            </button>
                          </th>
                          <th className="px-6 py-4 font-semibold tracking-wider">User details</th>
                          <th className="px-6 py-4 font-semibold tracking-wider">Device</th>
                          <th className="px-6 py-4 font-semibold tracking-wider">Push Status</th>
                          <th className="px-6 py-4 font-semibold tracking-wider text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {profiles.length === 0 && !loading && (
                          <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No users registered yet.</td></tr>
                        )}
                        {profiles.map(p => (
                          <tr key={p.id} className={`hover:bg-white/[0.02] transition-colors ${selectedUsers.includes(p.id) ? 'bg-indigo-500/5 hover:bg-indigo-500/10' : ''}`}>
                            <td className="px-6 py-4">
                              <button onClick={() => toggleSelectUser(p.id)} className="text-gray-400 hover:text-white transition-colors mt-1">
                                {selectedUsers.includes(p.id) ? <CheckSquare className="w-5 h-5 text-indigo-400" /> : <Square className="w-5 h-5" />}
                              </button>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center border border-white/10 shadow-inner">
                                  <span className="text-sm font-bold text-white">{p.email.substring(0, 2).toUpperCase()}</span>
                                </div>
                                <div>
                                  <div className="font-medium text-gray-200">{p.email}</div>
                                  <div className="text-xs text-gray-500">{new Date(p.created_at).toLocaleDateString()}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-gray-400">
                              <div className="flex items-center gap-2">
                                <SmartphoneNfc className="w-4 h-4 text-gray-500" />
                                {p.device_name || 'Unknown'} {p.android_version ? `(A${p.android_version})` : ''}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {p.push_token ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Enabled
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-gray-500/10 text-gray-400 border border-gray-500/20">
                                  <span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span> Disabled
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button 
                                onClick={() => toggleBan(p.id, p.is_banned)}
                                className={`inline-flex items-center justify-center rounded-xl text-xs font-bold transition-all px-3 py-1.5 ${p.is_banned ? 'bg-white text-black hover:bg-gray-200 shadow-lg' : 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20'}`}
                              >
                                {p.is_banned ? 'Unban User' : 'Ban User'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Updates Tab */}
            {activeTab === 'updates' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Publish Form */}
                <div className="bg-[#111]/80 backdrop-blur-xl border border-white/5 rounded-3xl shadow-xl p-6 md:p-8 h-fit">
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <UploadCloud className="w-6 h-6 text-indigo-500" /> Deploy Update
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">Push a new OTA version to mobile clients.</p>
                  </div>
                  
                  <form onSubmit={handlePublishUpdate} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Version Code</label>
                        <input
                          type="number"
                          required
                          value={versionCode}
                          onChange={(e) => setVersionCode(e.target.value)}
                          placeholder="e.g. 5"
                          className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-indigo-500 focus:bg-white/10 transition-all outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Version Name</label>
                        <input
                          type="text"
                          required
                          value={versionName}
                          onChange={(e) => setVersionName(e.target.value)}
                          placeholder="e.g. 1.2.0"
                          className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-indigo-500 focus:bg-white/10 transition-all outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">Update URL (.apk file)</label>
                      <input
                        type="url"
                        required
                        value={updateUrl}
                        onChange={(e) => setUpdateUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-indigo-500 focus:bg-white/10 transition-all outline-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">Release Notes</label>
                      <textarea
                        required
                        value={releaseNotes}
                        onChange={(e) => setReleaseNotes(e.target.value)}
                        placeholder="- New features added...&#10;- Bug fixes..."
                        rows={4}
                        className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-indigo-500 focus:bg-white/10 transition-all outline-none resize-none"
                      />
                    </div>

                    <label className="flex items-center gap-3 p-4 rounded-xl border border-white/5 bg-white/[0.02] cursor-pointer hover:bg-white/[0.04] transition-colors">
                      <input
                        type="checkbox"
                        checked={isMandatory}
                        onChange={(e) => setIsMandatory(e.target.checked)}
                        className="w-5 h-5 rounded bg-white/10 border-white/20 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-gray-900"
                      />
                      <div>
                        <p className="text-sm font-medium text-white">Mandatory Update</p>
                        <p className="text-xs text-gray-500">Force users to install this update to continue using the app.</p>
                      </div>
                    </label>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-indigo-500/25 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none mt-2"
                    >
                      {isSubmitting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
                      Publish Release
                    </button>
                  </form>
                </div>

                {/* Release History */}
                <div className="bg-[#111]/80 backdrop-blur-xl border border-white/5 rounded-3xl shadow-xl flex flex-col h-fit md:max-h-[800px]">
                  <div className="p-6 md:p-8 border-b border-white/5">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <RefreshCw className="w-6 h-6 text-emerald-500" /> Release History
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">Previously published versions.</p>
                  </div>
                  <div className="p-6 md:p-8 overflow-y-auto space-y-4 custom-scrollbar">
                    {updates.length === 0 ? (
                      <div className="text-center py-10 text-gray-500">No updates published yet.</div>
                    ) : (
                      updates.map((update) => (
                        <div key={update.id} className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                              <span className="text-lg font-bold text-white">v{update.version_name}</span>
                              <span className="px-2.5 py-1 bg-white/10 text-gray-300 text-xs font-semibold rounded-md">Build {update.version_code}</span>
                            </div>
                            {update.is_mandatory ? (
                              <span className="px-2.5 py-1 bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-bold rounded-lg flex items-center gap-1.5 uppercase tracking-wider">
                                <AlertTriangle className="w-3.5 h-3.5" /> Mandatory
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 bg-gray-500/10 text-gray-400 border border-gray-500/20 text-xs font-bold rounded-lg flex items-center gap-1.5 uppercase tracking-wider">
                                <Check className="w-3.5 h-3.5" /> Optional
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-400 bg-black/30 p-4 rounded-xl border border-white/5 mb-3 whitespace-pre-wrap font-mono text-xs leading-relaxed">
                            {update.release_notes}
                          </div>
                          <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/5">
                            <a href={update.update_url} target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300 text-sm font-medium flex items-center gap-1">
                              Download APK <ArrowLeft className="w-3 h-3 rotate-135" />
                            </a>
                            <span className="text-xs text-gray-500">{new Date(update.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-[#111]/80 backdrop-blur-xl border border-white/5 rounded-3xl shadow-xl p-6 md:p-8">
                  <div className="mb-8 border-b border-white/5 pb-6">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <Settings className="w-6 h-6 text-gray-400" /> App Configuration
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">Manage global app settings and maintenance.</p>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-5 rounded-2xl border border-red-500/20 bg-red-500/5">
                      <div>
                        <h4 className="text-base font-bold text-white">Maintenance Mode</h4>
                        <p className="text-sm text-gray-400 mt-1">Block all users from accessing the app. Use during critical updates.</p>
                      </div>
                      <button 
                        onClick={toggleMaintenanceMode}
                        className={`relative w-14 h-8 rounded-full transition-colors flex items-center p-1 focus:outline-none ${maintenanceMode ? 'bg-red-500' : 'bg-gray-600'}`}
                      >
                        <span className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${maintenanceMode ? 'translate-x-6' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </main>
        </div>
      </div>

      {/* Push Notification Modal */}
      {isNotificationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsNotificationModalOpen(false)}></div>
          <div className="bg-[#111] border border-white/10 shadow-2xl rounded-3xl w-full max-w-lg overflow-hidden relative z-10 animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-[#111] to-[#151515]">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Send className="w-5 h-5 text-indigo-500" /> 
                  Send Notification
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  {selectedUsers.length > 0 
                    ? `Targeting ${selectedUsers.length} selected user(s)` 
                    : 'Broadcasting to all registered users'}
                </p>
              </div>
              <button onClick={() => setIsNotificationModalOpen(false)} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSendNotification} className="p-6 space-y-5 bg-[#0a0a0a]/50">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Notification Title</label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="e.g. Special Offer Inside!"
                  className="w-full rounded-xl bg-black border border-white/10 px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-indigo-500 focus:bg-[#111] transition-all outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Message Content</label>
                <textarea
                  name="body"
                  required
                  placeholder="Type your message here..."
                  rows={3}
                  className="w-full rounded-xl bg-black border border-white/10 px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-indigo-500 focus:bg-[#111] transition-all outline-none resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-gray-500" /> Image URL <span className="text-gray-600 font-normal">(Optional)</span>
                </label>
                <input
                  type="url"
                  name="imageUrl"
                  placeholder="https://example.com/image.png"
                  className="w-full rounded-xl bg-black border border-white/10 px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-indigo-500 focus:bg-[#111] transition-all outline-none"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsNotificationModalOpen(false)}
                  className="flex-1 py-3 px-4 rounded-xl border border-white/10 text-white font-medium hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-[2] py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-indigo-500/25"
                >
                  {isSubmitting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  Send Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
