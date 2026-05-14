import { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthProvider';
import { supabase } from '../lib/supabase';
import { 
  LogOut, 
  ArrowLeft, 
  Check, 
  X, 
  ShieldAlert, 
  Users,
  Search,
  Bell,
  Activity,
  Smartphone,
  AlertTriangle,
  UploadCloud,
  Send
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

  // Tabs
  const [activeTab, setActiveTab] = useState<'overview' | 'updates' | 'settings'>('overview');

  // Form State
  const [versionCode, setVersionCode] = useState('');
  const [versionName, setVersionName] = useState('');
  const [updateUrl, setUpdateUrl] = useState('');
  const [releaseNotes, setReleaseNotes] = useState('');
  const [isMandatory, setIsMandatory] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
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

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h1>
          <p className="text-slate-600 mb-8">
            You do not have permission to view the Admin Panel. This area is restricted to administrators only.
          </p>
          <Link 
            to="/" 
            className="inline-flex items-center justify-center w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" /> Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Calculate metrics
  const totalUsers = profiles.length;
  const bannedUsers = profiles.filter(p => p.is_banned).length;
  const totalUpdates = updates.length;
  const isMaintenanceActive = maintenanceMode;

  return (
    <div className="min-h-screen bg-white text-slate-950 font-sans">
      {/* Top Header */}
      <div className="border-b border-slate-200">
        <div className="flex h-16 items-center px-4 md:px-8">
          <div className="flex items-center gap-2 mr-6 font-semibold">
            <div className="bg-slate-900 text-white p-1.5 rounded-md">
              <ShieldAlert className="w-5 h-5" />
            </div>
            DynamQR Admin
          </div>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <button 
              onClick={() => setActiveTab('overview')} 
              className={`transition-colors hover:text-slate-900 ${activeTab === 'overview' ? 'text-slate-900' : 'text-slate-500'}`}
            >
              Overview
            </button>
            <button 
              onClick={() => setActiveTab('updates')} 
              className={`transition-colors hover:text-slate-900 ${activeTab === 'updates' ? 'text-slate-900' : 'text-slate-500'}`}
            >
              Updates
            </button>
            <button 
              onClick={() => setActiveTab('settings')} 
              className={`transition-colors hover:text-slate-900 ${activeTab === 'settings' ? 'text-slate-900' : 'text-slate-500'}`}
            >
              Settings
            </button>
            <Link to="/dashboard" className="text-slate-500 hover:text-slate-900 transition-colors hidden sm:block">
              App Dashboard
            </Link>
          </nav>
          <div className="ml-auto flex items-center space-x-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="search"
                placeholder="Search..."
                className="h-9 w-64 rounded-md border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm outline-none focus:border-slate-300 focus:ring-1 focus:ring-slate-300"
              />
            </div>
            <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
              <Bell className="h-5 w-5" />
            </button>
            <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
              <span className="text-xs font-semibold text-slate-600">{user?.email?.substring(0, 2).toUpperCase()}</span>
            </div>
            <button 
              onClick={signOut}
              className="text-slate-500 hover:text-slate-900 p-2 rounded-full hover:bg-slate-100 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <div className="flex items-center space-x-2">
            <button className="hidden sm:inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50 border border-slate-200 bg-white shadow-sm hover:bg-slate-100 hover:text-slate-900 h-9 px-4 py-2">
              Download Report
            </button>
          </div>
        </div>
        
        {/* Metric Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white text-slate-950 shadow-sm">
            <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium">Total Users</h3>
              <Users className="h-4 w-4 text-slate-500" />
            </div>
            <div className="p-6 pt-0">
              <div className="text-2xl font-bold">{totalUsers}</div>
              <p className="text-xs text-slate-500 mt-1">
                Registered profiles
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white text-slate-950 shadow-sm">
            <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium">Total Updates</h3>
              <UploadCloud className="h-4 w-4 text-slate-500" />
            </div>
            <div className="p-6 pt-0">
              <div className="text-2xl font-bold">{totalUpdates}</div>
              <p className="text-xs text-slate-500 mt-1">
                Published app versions
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white text-slate-950 shadow-sm">
            <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium">Banned Users</h3>
              <AlertTriangle className="h-4 w-4 text-slate-500" />
            </div>
            <div className="p-6 pt-0">
              <div className="text-2xl font-bold">{bannedUsers}</div>
              <p className="text-xs text-slate-500 mt-1">
                Restricted from app access
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white text-slate-950 shadow-sm">
            <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium">System Status</h3>
              <Activity className="h-4 w-4 text-slate-500" />
            </div>
            <div className="p-6 pt-0">
              <div className="text-2xl font-bold">{isMaintenanceActive ? 'Maintenance' : 'Online'}</div>
              <p className="text-xs text-slate-500 mt-1">
                {isMaintenanceActive ? 'App access is blocked' : 'Operating normally'}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'overview' && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              {/* User Management Table */}
              <div className="col-span-4 rounded-xl border border-slate-200 bg-white text-slate-950 shadow-sm">
                <div className="flex flex-col space-y-1.5 p-6">
                  <h3 className="font-semibold leading-none tracking-tight">User Management</h3>
                  <p className="text-sm text-slate-500">Manage all registered users and their access.</p>
                </div>
                <div className="p-6 pt-0">
                  <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm">
                      <thead className="[&_tr]:border-b">
                        <tr className="border-b border-slate-200 transition-colors hover:bg-slate-50/50 data-[state=selected]:bg-slate-50">
                          <th className="h-12 px-4 text-left align-middle font-medium text-slate-500">Email</th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-slate-500">Device</th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-slate-500">Android</th>
                          <th className="h-12 px-4 text-right align-middle font-medium text-slate-500">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="[&_tr:last-child]:border-0">
                        {profiles.slice(0, 10).map(p => (
                          <tr key={p.id} className="border-b border-slate-200 transition-colors hover:bg-slate-50/50">
                            <td className="p-4 align-middle font-medium">
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                                  <span className="text-xs font-medium">{p.email.substring(0, 2).toUpperCase()}</span>
                                </div>
                                <div className="flex flex-col">
                                  <span>{p.email}</span>
                                  {p.is_banned && <span className="text-[10px] text-red-500 font-semibold uppercase tracking-wider">Banned</span>}
                                </div>
                              </div>
                            </td>
                            <td className="p-4 align-middle text-slate-600">{p.device_name || '-'}</td>
                            <td className="p-4 align-middle text-slate-600">{p.android_version || '-'}</td>
                            <td className="p-4 align-middle text-right">
                              <button 
                                onClick={() => toggleBan(p.id, p.is_banned)}
                                className={`inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors border h-8 px-3 ${p.is_banned ? 'border-slate-200 bg-white hover:bg-slate-100 text-slate-900' : 'border-red-200 bg-red-50 hover:bg-red-100 text-red-600'}`}
                              >
                                {p.is_banned ? 'Unban' : 'Ban'}
                              </button>
                            </td>
                          </tr>
                        ))}
                        {profiles.length === 0 && !loading && (
                          <tr>
                            <td colSpan={4} className="p-4 text-center text-slate-500 h-24">No users found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Recent Updates Mini View */}
              <div className="col-span-3 rounded-xl border border-slate-200 bg-white text-slate-950 shadow-sm">
                <div className="flex flex-col space-y-1.5 p-6">
                  <h3 className="font-semibold leading-none tracking-tight">Recent Updates</h3>
                  <p className="text-sm text-slate-500">Latest published versions.</p>
                </div>
                <div className="p-6 pt-0">
                  <div className="space-y-8">
                    {loading ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="flex items-center space-x-4 animate-pulse">
                            <div className="h-9 w-9 rounded-full bg-slate-200"></div>
                            <div className="space-y-2 flex-1">
                              <div className="h-4 w-1/3 bg-slate-200 rounded"></div>
                              <div className="h-3 w-1/2 bg-slate-200 rounded"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : updates.length === 0 ? (
                      <p className="text-sm text-slate-500">No updates published.</p>
                    ) : (
                      updates.slice(0, 5).map(update => (
                        <div key={update.id} className="flex items-center">
                          <div className="h-9 w-9 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                            <Smartphone className="h-4 w-4" />
                          </div>
                          <div className="ml-4 space-y-1">
                            <p className="text-sm font-medium leading-none">Version {update.version_name}</p>
                            <p className="text-sm text-slate-500 truncate max-w-[200px]">{update.release_notes}</p>
                          </div>
                          <div className="ml-auto font-medium text-xs">
                            {update.is_mandatory ? (
                              <span className="text-red-600 bg-red-50 px-2 py-1 rounded-md">Mandatory</span>
                            ) : (
                              <span className="text-slate-500">Optional</span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'updates' && (
            <div className="grid gap-4 md:grid-cols-2">
              {/* Push Update Form */}
              <div className="rounded-xl border border-slate-200 bg-white text-slate-950 shadow-sm">
                <div className="flex flex-col space-y-1.5 p-6">
                  <h3 className="font-semibold leading-none tracking-tight">Push New Update</h3>
                  <p className="text-sm text-slate-500">Release a new version to mobile app users.</p>
                </div>
                <div className="p-6 pt-0">
                  {error && (
                    <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md text-sm border border-red-200">
                      {error}
                    </div>
                  )}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium leading-none">Version Code</label>
                        <input
                          type="number"
                          required
                          value={versionCode}
                          onChange={(e) => setVersionCode(e.target.value)}
                          placeholder="e.g. 2"
                          className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium leading-none">Version Name</label>
                        <input
                          type="text"
                          required
                          value={versionName}
                          onChange={(e) => setVersionName(e.target.value)}
                          placeholder="e.g. 1.0.1"
                          className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium leading-none">Update URL (APK / Play Store)</label>
                      <input
                        type="url"
                        required
                        value={updateUrl}
                        onChange={(e) => setUpdateUrl(e.target.value)}
                        placeholder="https://..."
                        className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium leading-none">Release Notes</label>
                      <textarea
                        required
                        value={releaseNotes}
                        onChange={(e) => setReleaseNotes(e.target.value)}
                        placeholder="- Fixed bugs&#10;- Added new features"
                        rows={4}
                        className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                      />
                    </div>

                    <div className="flex items-center space-x-2 pt-2">
                      <input
                        id="mandatory"
                        type="checkbox"
                        checked={isMandatory}
                        onChange={(e) => setIsMandatory(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                      />
                      <label htmlFor="mandatory" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Mandatory Update (Users cannot dismiss)
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50 bg-slate-900 text-slate-50 shadow hover:bg-slate-900/90 h-9 px-4 py-2 w-full mt-4"
                    >
                      {isSubmitting ? 'Publishing...' : 'Publish Update'}
                    </button>
                  </form>
                </div>
              </div>

              {/* Full Update History */}
              <div className="rounded-xl border border-slate-200 bg-white text-slate-950 shadow-sm">
                <div className="flex flex-col space-y-1.5 p-6">
                  <h3 className="font-semibold leading-none tracking-tight">Update History</h3>
                  <p className="text-sm text-slate-500">All previously published versions.</p>
                </div>
                <div className="p-6 pt-0 overflow-auto max-h-[600px]">
                  {loading ? (
                    <div className="space-y-4">
                      {[1, 2].map(i => (
                        <div key={i} className="h-24 bg-slate-100 rounded-lg animate-pulse"></div>
                      ))}
                    </div>
                  ) : updates.length === 0 ? (
                    <div className="text-center py-10 text-slate-500 text-sm">
                      No updates published yet.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {updates.map((update) => (
                        <div key={update.id} className="p-4 border border-slate-200 rounded-lg flex flex-col gap-2">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">v{update.version_name}</span>
                              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">Build {update.version_code}</span>
                            </div>
                            {update.is_mandatory ? (
                              <span className="px-2 py-1 bg-red-50 text-red-700 text-xs font-semibold rounded-md flex items-center">
                                <Check className="w-3 h-3 mr-1" /> Mandatory
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-md flex items-center">
                                <X className="w-3 h-3 mr-1" /> Optional
                              </span>
                            )}
                          </div>
                          <a href={update.update_url} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-slate-900 text-xs truncate">
                            {update.update_url}
                          </a>
                          <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-md border border-slate-100 mt-2 whitespace-pre-wrap">
                            {update.release_notes}
                          </div>
                          <div className="text-xs text-slate-400 mt-1">
                            {new Date(update.created_at).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="grid gap-4 md:grid-cols-2">
              {/* System Settings */}
              <div className="rounded-xl border border-slate-200 bg-white text-slate-950 shadow-sm h-fit">
                <div className="flex flex-col space-y-1.5 p-6">
                  <h3 className="font-semibold leading-none tracking-tight">System Settings</h3>
                  <p className="text-sm text-slate-500">Configure global application behavior.</p>
                </div>
                <div className="p-6 pt-0 space-y-6">
                  <div className="flex flex-row items-center justify-between rounded-lg border border-slate-200 p-4">
                    <div className="space-y-0.5">
                      <h4 className="text-base font-medium">Maintenance Mode</h4>
                      <p className="text-sm text-slate-500">Block users from accessing the app during updates.</p>
                    </div>
                    <button 
                      onClick={toggleMaintenanceMode}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${maintenanceMode ? 'bg-slate-900' : 'bg-slate-200'}`}
                    >
                      <span className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform ${maintenanceMode ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Push Notifications */}
              <div className="rounded-xl border border-slate-200 bg-white text-slate-950 shadow-sm">
                <div className="flex flex-col space-y-1.5 p-6">
                  <h3 className="font-semibold leading-none tracking-tight">Push Notifications</h3>
                  <p className="text-sm text-slate-500">Broadcast a message to all users.</p>
                </div>
                <div className="p-6 pt-0">
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const title = formData.get('title') as string;
                    const body = formData.get('body') as string;
                    const imageUrl = formData.get('imageUrl') as string;
                    
                    if (!title || !body) {
                      alert('Title and body are required.');
                      return;
                    }

                    try {
                      const { error } = await supabase.functions.invoke('send_push_notification', {
                        body: { title, body, imageUrl }
                      });

                      if (error) throw error;
                      alert('Push notification sent successfully!');
                      (e.target as HTMLFormElement).reset();
                    } catch (err: any) {
                      console.error(err);
                      alert('Failed to send notification: ' + err.message);
                    }
                  }} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium leading-none">Title</label>
                      <input
                        type="text"
                        name="title"
                        required
                        placeholder="e.g. Important Announcement"
                        className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium leading-none">Message Body</label>
                      <textarea
                        name="body"
                        required
                        placeholder="Tell your users what's happening..."
                        rows={3}
                        className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 resize-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium leading-none">Image URL (Optional)</label>
                      <input
                        type="url"
                        name="imageUrl"
                        placeholder="https://..."
                        className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
                      />
                    </div>

                    <button
                      type="submit"
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50 bg-slate-900 text-slate-50 shadow hover:bg-slate-900/90 h-9 px-4 py-2 mt-4"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Broadcast Message
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;

