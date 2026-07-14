import { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthProvider';
import { supabase } from '../lib/supabase';
import { 
  LogOut, ArrowLeft, Check, X, ShieldAlert, Users, Search, Bell, Activity, 
  AlertTriangle, UploadCloud, Send, CheckSquare, Square, Menu,
  Settings, LayoutDashboard, RefreshCw, SmartphoneNfc, Image as ImageIcon,
  Home, X as CloseIcon, History, Trash2
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
  push_token?: string | null;
  created_at: string;
};

type NotificationHistory = {
  id: string;
  title: string;
  body: string;
  image_url: string | null;
  target_users: string[];
  created_at: string;
};

const Admin = () => {
  const { user, signOut } = useAuth();
  const [updates, setUpdates] = useState<AppUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [notificationHistory, setNotificationHistory] = useState<NotificationHistory[]>([]);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Mobile Menu State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState<'overview' | 'notifications' | 'updates' | 'settings'>('overview');

  // Form State for Updates
  const [versionCode, setVersionCode] = useState('');
  const [versionName, setVersionName] = useState('');
  const [updateUrl, setUpdateUrl] = useState('');
  const [releaseNotes, setReleaseNotes] = useState('');
  const [isMandatory, setIsMandatory] = useState(false);

  // Push Notification State
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  
  const [previewTitle, setPreviewTitle] = useState('');
  const [previewBody, setPreviewBody] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch Updates
    const { data: updatesData, error: updatesError } = await supabase
      .from('app_updates')
      .select('*')
      .order('version_code', { ascending: false });

    if (updatesError) {
      if (updatesError.code === '42P01') {
        console.error("The 'app_updates' table does not exist.");
      } else {
        console.error('Error fetching updates:', updatesError);
      }
    } else if (updatesData) {
      setUpdates(updatesData);
    }

    // Fetch Profiles
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

    // Fetch Notification History
    const { data: historyData } = await supabase
      .from('notifications_history')
      .select('*')
      .order('created_at', { ascending: false });
    if (historyData) setNotificationHistory(historyData);

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!previewTitle || !previewBody) {
      alert('Title and body are required.');
      return;
    }

    setIsSubmitting(true);
    let finalImageUrl: string | undefined = undefined;

    try {
      if (selectedImageFile) {
        const fileExt = selectedImageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('notifications')
          .upload(filePath, selectedImageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('notifications')
          .getPublicUrl(filePath);

        finalImageUrl = publicUrl;
      }

      const isBroadcast = selectedUsers.length === 0;
      let tokens: string[] = [];
      let targetEmails: string[] = [];
      
      if (!isBroadcast) {
        const selectedProfiles = profiles.filter(p => selectedUsers.includes(p.id));
        tokens = selectedProfiles.map(p => p.push_token).filter(Boolean) as string[];
        targetEmails = selectedProfiles.map(p => p.email);
        
        if (tokens.length === 0) {
          throw new Error('None of the selected users have Push Enabled. Please select users with valid push tokens.');
        }
      }

      const payload = {
        title: previewTitle,
        body: previewBody,
        imageUrl: finalImageUrl,
        tokens: isBroadcast ? undefined : tokens
      };

      const { data, error } = await supabase.functions.invoke('send_push_notification', {
        body: payload
      });

      if (error) throw error;
      
      if (data?.failedTokens && data.failedTokens.length > 0) {
         for (const deadToken of data.failedTokens) {
           await supabase.from('profiles').update({ push_token: null }).eq('push_token', deadToken);
         }
      }

      await supabase.from('notifications_history').insert([{
        title: previewTitle,
        body: previewBody,
        image_url: finalImageUrl,
        target_users: isBroadcast ? ['All Users'] : targetEmails
      }]);

      alert(`Push notification sent successfully!`);
      
      setIsNotificationModalOpen(false);
      setSelectedUsers([]);
      setPreviewTitle('');
      setPreviewBody('');
      setPreviewImage(null);
      setSelectedImageFile(null);
      fetchData(); 
    } catch (err: any) {
      console.error(err);
      alert('Failed to send notification: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card p-8 rounded-3xl shadow-2xl border border-border max-w-md w-full text-center relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-red-500/20 blur-[100px] pointer-events-none"></div>
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
            <ShieldAlert className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-3 tracking-tight">Access Denied</h1>
          <p className="text-muted-foreground mb-8 leading-relaxed text-sm">
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
  const pushEnabledUsers = profiles.filter(p => p.push_token).length;
  const totalUpdates = updates.length;

  return (
    <div className="min-h-screen bg-background text-gray-200 font-sans selection:bg-indigo-500/30">
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute top-1/4 -left-40 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative z-10 flex flex-col md:flex-row min-h-screen">
        <div className="md:w-64 border-b md:border-b-0 md:border-r border-border bg-card/80 backdrop-blur-xl flex-shrink-0 flex flex-col transition-all duration-300">
          <div className="flex h-16 md:h-20 items-center justify-between px-6 border-b border-border">
            <div className="flex items-center gap-3 font-bold text-lg text-foreground tracking-wide">
              <div className="bg-gradient-to-tr from-indigo-500 to-purple-500 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
                <ShieldAlert className="w-5 h-5 text-foreground" />
              </div>
              DynamQR
            </div>
            <button 
              className="md:hidden text-muted-foreground hover:text-foreground p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          <div className={`${isMobileMenuOpen ? 'flex' : 'hidden'} md:flex flex-col flex-1 p-4 gap-2`}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-4 px-3">Menu</p>
            <button 
              onClick={() => { setActiveTab('overview'); setIsMobileMenuOpen(false); }} 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${activeTab === 'overview' ? 'bg-white/10 text-foreground shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}
            >
              <LayoutDashboard className="w-5 h-5" /> Overview
            </button>
            <button 
              onClick={() => { setActiveTab('notifications'); setIsMobileMenuOpen(false); }} 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${activeTab === 'notifications' ? 'bg-white/10 text-foreground shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}
            >
              <History className="w-5 h-5" /> Notifications
            </button>
            <button 
              onClick={() => { setActiveTab('updates'); setIsMobileMenuOpen(false); }} 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${activeTab === 'updates' ? 'bg-white/10 text-foreground shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}
            >
              <RefreshCw className="w-5 h-5" /> Updates
            </button>
            <button 
              onClick={() => { setActiveTab('settings'); setIsMobileMenuOpen(false); }} 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${activeTab === 'settings' ? 'bg-white/10 text-foreground shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}
            >
              <Settings className="w-5 h-5" /> Settings
            </button>

            <div className="mt-auto pt-4 border-t border-border">
              <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-white/5 font-medium">
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

        <div className="flex-1 flex flex-col h-screen overflow-y-auto overflow-x-hidden relative">
          <header className="h-16 md:h-20 flex items-center justify-between px-4 md:px-8 bg-transparent sticky top-0 z-20 backdrop-blur-md border-b border-border">
            <h2 className="text-xl md:text-2xl font-bold text-foreground tracking-tight capitalize">
              {activeTab}
            </h2>
            <div className="flex items-center space-x-3 md:space-x-4">
              <div className="relative hidden md:flex items-center">
                <Search className="absolute left-3 w-4 h-4 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="Search users..."
                  className="h-10 w-64 rounded-full bg-white/5 border border-border pl-10 pr-4 text-sm text-foreground placeholder-gray-500 outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all"
                />
              </div>
              <button className="relative p-2.5 text-muted-foreground hover:text-foreground rounded-full hover:bg-white/10 transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full border border-[#0a0a0a]"></span>
              </button>
              <div className="hidden md:flex h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border-2 border-[#111] items-center justify-center shadow-lg">
                <span className="text-sm font-bold text-foreground shadow-sm">{user?.email?.substring(0, 2).toUpperCase()}</span>
              </div>
            </div>
          </header>

          <main className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8 pb-24">
            
            {activeTab === 'overview' && (
              <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-card/80 backdrop-blur-xl border border-border rounded-3xl p-5 shadow-xl hover:bg-muted transition-colors relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Users className="w-16 h-16 text-indigo-500" />
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl">
                        <Users className="w-5 h-5" />
                      </div>
                      <h3 className="text-muted-foreground font-medium text-sm">Total Users</h3>
                    </div>
                    <div className="text-3xl font-bold text-foreground">{totalUsers}</div>
                  </div>

                  <div className="bg-card/80 backdrop-blur-xl border border-border rounded-3xl p-5 shadow-xl hover:bg-muted transition-colors relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Bell className="w-16 h-16 text-emerald-500" />
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl">
                        <Bell className="w-5 h-5" />
                      </div>
                      <h3 className="text-muted-foreground font-medium text-sm">Push Enabled</h3>
                    </div>
                    <div className="text-3xl font-bold text-foreground">{pushEnabledUsers}</div>
                  </div>

                  <div className="bg-card/80 backdrop-blur-xl border border-border rounded-3xl p-5 shadow-xl hover:bg-muted transition-colors relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <UploadCloud className="w-16 h-16 text-blue-500" />
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-xl">
                        <UploadCloud className="w-5 h-5" />
                      </div>
                      <h3 className="text-muted-foreground font-medium text-sm">Total Updates</h3>
                    </div>
                    <div className="text-3xl font-bold text-foreground">{totalUpdates}</div>
                  </div>

                  <div className="bg-card/80 backdrop-blur-xl border border-border rounded-3xl p-5 shadow-xl hover:bg-muted transition-colors relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Activity className="w-16 h-16 text-purple-500" />
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2.5 bg-purple-500/20 text-purple-400 rounded-xl">
                        <Activity className="w-5 h-5" />
                      </div>
                      <h3 className="text-muted-foreground font-medium text-sm">System Status</h3>
                    </div>
                    <div className="text-xl md:text-2xl font-bold text-foreground truncate">
                      {maintenanceMode ? <span className="text-amber-400">Maintenance</span> : <span className="text-emerald-400">Online</span>}
                    </div>
                  </div>
                </div>

                <div className="bg-card/80 backdrop-blur-xl border border-border rounded-3xl shadow-xl flex flex-col overflow-hidden">
                  <div className="p-6 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                        Users Directory
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">Manage users, access, and notifications.</p>
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
                      <thead className="text-xs text-muted-foreground uppercase bg-white/5 border-b border-border">
                        <tr>
                          <th className="px-6 py-4 w-12">
                            <button onClick={toggleSelectAll} className="text-muted-foreground hover:text-foreground transition-colors">
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
                          <tr><td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">No users registered yet.</td></tr>
                        )}
                        {profiles.map(p => (
                          <tr key={p.id} className={`hover:bg-white/[0.02] transition-colors ${selectedUsers.includes(p.id) ? 'bg-indigo-500/5 hover:bg-indigo-500/10' : ''}`}>
                            <td className="px-6 py-4">
                              <button onClick={() => toggleSelectUser(p.id)} className="text-muted-foreground hover:text-foreground transition-colors mt-1">
                                {selectedUsers.includes(p.id) ? <CheckSquare className="w-5 h-5 text-indigo-400" /> : <Square className="w-5 h-5" />}
                              </button>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center border border-border shadow-inner">
                                  <span className="text-sm font-bold text-foreground">{p.email.substring(0, 2).toUpperCase()}</span>
                                </div>
                                <div>
                                  <div className="font-medium text-gray-200">{p.email}</div>
                                  <div className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <SmartphoneNfc className="w-4 h-4 text-muted-foreground" />
                                {p.device_name || 'Unknown'} {p.android_version ? `(A${p.android_version})` : ''}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {p.push_token ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Enabled
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-gray-500/10 text-muted-foreground border border-gray-500/20">
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

            {activeTab === 'notifications' && (
               <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <div className="bg-card/80 backdrop-blur-xl border border-border rounded-3xl shadow-xl p-6 md:p-8">
                    <div className="mb-6 flex justify-between items-center border-b border-border pb-6">
                      <div>
                        <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                          <History className="w-6 h-6 text-indigo-500" /> Notification History
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">Recently sent push notifications to users.</p>
                      </div>
                      <button 
                        onClick={() => setIsNotificationModalOpen(true)}
                        className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-foreground font-semibold py-2.5 px-5 rounded-xl transition-all shadow-lg hover:shadow-xl text-sm whitespace-nowrap"
                      >
                        <Send className="w-4 h-4" /> Send New
                      </button>
                    </div>

                    <div className="space-y-4 custom-scrollbar">
                      {notificationHistory.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">No notifications sent yet.</div>
                      ) : (
                        notificationHistory.map((item) => (
                          <div key={item.id} className="p-5 rounded-2xl bg-white/[0.03] border border-border hover:border-border transition-colors flex flex-col md:flex-row gap-5">
                            {item.image_url && (
                              <div className="h-24 w-24 rounded-xl overflow-hidden flex-shrink-0 border border-border">
                                <img src={item.image_url} alt="Notification" className="w-full h-full object-cover" />
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="text-lg font-bold text-foreground">{item.title}</h4>
                                <span className="text-xs text-muted-foreground bg-black/40 px-2.5 py-1 rounded-md">{new Date(item.created_at).toLocaleString()}</span>
                              </div>
                              <p className="text-sm text-gray-300 mb-3">{item.body}</p>
                              <div className="flex flex-wrap gap-2">
                                <span className="text-xs font-medium text-muted-foreground bg-white/5 px-2.5 py-1 rounded-md border border-border">
                                  Targets: {item.target_users.length > 5 ? `${item.target_users.length} users` : item.target_users.join(', ')}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                 </div>
               </div>
            )}

            {activeTab === 'updates' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-card/80 backdrop-blur-xl border border-border rounded-3xl shadow-xl p-6 md:p-8 h-fit">
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                      <UploadCloud className="w-6 h-6 text-indigo-500" /> Deploy Update
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">Push a new OTA version to mobile clients.</p>
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
                          className="w-full rounded-xl bg-white/5 border border-border px-4 py-3 text-sm text-foreground placeholder-gray-600 focus:border-indigo-500 focus:bg-white/10 transition-all outline-none"
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
                          className="w-full rounded-xl bg-white/5 border border-border px-4 py-3 text-sm text-foreground placeholder-gray-600 focus:border-indigo-500 focus:bg-white/10 transition-all outline-none"
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
                        className="w-full rounded-xl bg-white/5 border border-border px-4 py-3 text-sm text-foreground placeholder-gray-600 focus:border-indigo-500 focus:bg-white/10 transition-all outline-none"
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
                        className="w-full rounded-xl bg-white/5 border border-border px-4 py-3 text-sm text-foreground placeholder-gray-600 focus:border-indigo-500 focus:bg-white/10 transition-all outline-none resize-none"
                      />
                    </div>

                    <label className="flex items-center gap-3 p-4 rounded-xl border border-border bg-white/[0.02] cursor-pointer hover:bg-white/[0.04] transition-colors">
                      <input
                        type="checkbox"
                        checked={isMandatory}
                        onChange={(e) => setIsMandatory(e.target.checked)}
                        className="w-5 h-5 rounded bg-white/10 border-white/20 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-gray-900"
                      />
                      <div>
                        <p className="text-sm font-medium text-foreground">Mandatory Update</p>
                        <p className="text-xs text-muted-foreground">Force users to install this update to continue using the app.</p>
                      </div>
                    </label>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-foreground font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-indigo-500/25 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none mt-2"
                    >
                      {isSubmitting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
                      Publish Release
                    </button>
                  </form>
                </div>

                <div className="bg-card/80 backdrop-blur-xl border border-border rounded-3xl shadow-xl flex flex-col h-fit md:max-h-[800px]">
                  <div className="p-6 md:p-8 border-b border-border">
                    <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                      <RefreshCw className="w-6 h-6 text-emerald-500" /> Release History
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">Previously published versions.</p>
                  </div>
                  <div className="p-6 md:p-8 overflow-y-auto space-y-4 custom-scrollbar">
                    {updates.length === 0 ? (
                      <div className="text-center py-10 text-muted-foreground">No updates published yet.</div>
                    ) : (
                      updates.map((update) => (
                        <div key={update.id} className="p-5 rounded-2xl bg-white/[0.03] border border-border hover:border-border transition-colors">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                              <span className="text-lg font-bold text-foreground">v{update.version_name}</span>
                              <span className="px-2.5 py-1 bg-white/10 text-gray-300 text-xs font-semibold rounded-md">Build {update.version_code}</span>
                            </div>
                            {update.is_mandatory ? (
                              <span className="px-2.5 py-1 bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-bold rounded-lg flex items-center gap-1.5 uppercase tracking-wider">
                                <AlertTriangle className="w-3.5 h-3.5" /> Mandatory
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 bg-gray-500/10 text-muted-foreground border border-gray-500/20 text-xs font-bold rounded-lg flex items-center gap-1.5 uppercase tracking-wider">
                                <Check className="w-3.5 h-3.5" /> Optional
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground bg-black/30 p-4 rounded-xl border border-border mb-3 whitespace-pre-wrap font-mono text-xs leading-relaxed">
                            {update.release_notes}
                          </div>
                          <div className="flex justify-between items-center mt-4 pt-4 border-t border-border">
                            <a href={update.update_url} target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300 text-sm font-medium flex items-center gap-1">
                              Download APK <ArrowLeft className="w-3 h-3 rotate-135" />
                            </a>
                            <span className="text-xs text-muted-foreground">{new Date(update.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-card/80 backdrop-blur-xl border border-border rounded-3xl shadow-xl p-6 md:p-8">
                  <div className="mb-8 border-b border-border pb-6">
                    <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                      <Settings className="w-6 h-6 text-muted-foreground" /> App Configuration
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">Manage global app settings and maintenance.</p>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-5 rounded-2xl border border-red-500/20 bg-red-500/5">
                      <div>
                        <h4 className="text-base font-bold text-foreground">Maintenance Mode</h4>
                        <p className="text-sm text-muted-foreground mt-1">Block all users from accessing the app. Use during critical updates.</p>
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

      {isNotificationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsNotificationModalOpen(false)}></div>
          <div className="bg-card border border-border shadow-2xl rounded-3xl w-full max-w-4xl overflow-hidden relative z-10 animate-in zoom-in-95 duration-200 flex flex-col md:flex-row">
            
            <div className="flex-1 flex flex-col border-r border-border">
              <div className="p-6 border-b border-border bg-gradient-to-r from-[#111] to-[#151515]">
                <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Send className="w-5 h-5 text-indigo-500" /> 
                  Compose Notification
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedUsers.length > 0 
                    ? `Targeting ${selectedUsers.length} selected user(s)` 
                    : 'Broadcasting to all registered users'}
                </p>
              </div>
              
              <form onSubmit={handleSendNotification} className="p-6 space-y-5 bg-background/50 flex-1 overflow-y-auto">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Notification Title</label>
                  <input
                    type="text"
                    required
                    value={previewTitle}
                    onChange={(e) => setPreviewTitle(e.target.value)}
                    placeholder="e.g. Special Offer Inside!"
                    className="w-full rounded-xl bg-black border border-border px-4 py-3 text-sm text-foreground placeholder-gray-600 focus:border-indigo-500 focus:bg-card transition-all outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Message Content</label>
                  <textarea
                    required
                    value={previewBody}
                    onChange={(e) => setPreviewBody(e.target.value)}
                    placeholder="Type your message here..."
                    rows={4}
                    className="w-full rounded-xl bg-black border border-border px-4 py-3 text-sm text-foreground placeholder-gray-600 focus:border-indigo-500 focus:bg-card transition-all outline-none resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-muted-foreground" /> Notification Image <span className="text-gray-600 font-normal">(Optional)</span>
                  </label>
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-border border-dashed rounded-xl cursor-pointer bg-black hover:bg-white/5 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />
                        <p className="mb-1 text-sm text-muted-foreground"><span className="font-semibold text-indigo-400">Click to upload</span> or drag and drop</p>
                        <p className="text-xs text-muted-foreground">PNG, JPG or WEBP (MAX. 2MB)</p>
                      </div>
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                    </label>
                  </div>
                  {selectedImageFile && (
                    <div className="flex items-center justify-between p-3 mt-2 bg-white/5 rounded-lg border border-border">
                      <span className="text-sm text-gray-300 truncate max-w-[200px]">{selectedImageFile.name}</span>
                      <button type="button" onClick={() => { setSelectedImageFile(null); setPreviewImage(null); }} className="text-red-400 hover:text-red-300">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsNotificationModalOpen(false)}
                    className="flex-1 py-3 px-4 rounded-xl border border-border text-foreground font-medium hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-[2] py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-foreground font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-indigo-500/25"
                  >
                    {isSubmitting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    Send Now
                  </button>
                </div>
              </form>
            </div>

            <div className="w-full md:w-[380px] bg-black p-6 flex flex-col items-center justify-center relative border-t md:border-t-0 border-border">
              <button onClick={() => setIsNotificationModalOpen(false)} className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground hover:bg-white/10 rounded-full transition-colors">
                <CloseIcon className="w-5 h-5" />
              </button>
              
              <h4 className="text-sm font-semibold text-muted-foreground mb-6 uppercase tracking-wider">Device Preview</h4>
              
              <div className="w-[300px] h-[600px] bg-card rounded-[40px] border-8 border-[#222] p-4 relative shadow-2xl overflow-hidden flex flex-col">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#222] rounded-b-3xl"></div>
                
                <div className="flex-1 w-full bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] rounded-[24px] mt-4 overflow-hidden relative">
                  
                  {(previewTitle || previewBody || previewImage) ? (
                    <div className="absolute top-4 left-2 right-2 bg-[#2a2a2a]/90 backdrop-blur-md rounded-2xl overflow-hidden shadow-2xl border border-border animate-in slide-in-from-top-4">
                      <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-white/5">
                        <div className="w-4 h-4 bg-indigo-500 rounded-sm flex items-center justify-center">
                          <ShieldAlert className="w-3 h-3 text-foreground" />
                        </div>
                        <span className="text-[10px] font-medium text-gray-300">DynamQR • now</span>
                      </div>
                      
                      {previewImage && (
                        <div className="w-full h-32 bg-black">
                          <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                      
                      <div className="p-4">
                        <h5 className="text-sm font-bold text-foreground leading-tight mb-1">{previewTitle || 'Notification Title'}</h5>
                        <p className="text-xs text-gray-300 leading-snug line-clamp-2">{previewBody || 'Message content goes here...'}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="text-xs text-gray-600 text-center px-8">Start typing to see notification preview</p>
                    </div>
                  )}
                  
                </div>
              </div>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
