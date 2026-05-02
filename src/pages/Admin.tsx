import { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthProvider';
import { supabase } from '../lib/supabase';
import { LogOut, ArrowLeft, Plus, Check, X, ShieldAlert } from 'lucide-react';
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

const Admin = () => {
  const { user, signOut } = useAuth();
  const [updates, setUpdates] = useState<AppUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [versionCode, setVersionCode] = useState('');
  const [versionName, setVersionName] = useState('');
  const [updateUrl, setUpdateUrl] = useState('');
  const [releaseNotes, setReleaseNotes] = useState('');
  const [isMandatory, setIsMandatory] = useState(false);

  const fetchUpdates = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('app_updates')
      .select('*')
      .order('version_code', { ascending: false });

    if (error) {
      if (error.code === '42P01') {
        setError("The 'app_updates' table does not exist. Please run the SQL script in your Supabase dashboard.");
      } else {
        console.error('Error fetching updates:', error);
      }
    } else if (data) {
      setUpdates(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUpdates();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      // Reset form
      setVersionCode('');
      setVersionName('');
      setUpdateUrl('');
      setReleaseNotes('');
      setIsMandatory(false);
      fetchUpdates();
      alert('Update published successfully!');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link to="/dashboard" className="text-slate-500 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="bg-red-500 p-2 rounded-lg shadow-md">
                <ShieldAlert className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-orange-600">
                Admin Panel
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-500 hidden md:block">{user?.email}</span>
              <button 
                onClick={signOut}
                className="text-slate-500 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8">
        
        {/* Form Section */}
        <div className="flex-1">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center">
              <Plus className="w-5 h-5 mr-2 text-indigo-500" /> Push New Update
            </h2>
            
            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-200">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Version Code (Int)</label>
                  <input
                    type="number"
                    required
                    value={versionCode}
                    onChange={(e) => setVersionCode(e.target.value)}
                    placeholder="e.g. 2"
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Version Name</label>
                  <input
                    type="text"
                    required
                    value={versionName}
                    onChange={(e) => setVersionName(e.target.value)}
                    placeholder="e.g. 1.0.1"
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Update URL (APK / Play Store)</label>
                <input
                  type="url"
                  required
                  value={updateUrl}
                  onChange={(e) => setUpdateUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Release Notes</label>
                <textarea
                  required
                  value={releaseNotes}
                  onChange={(e) => setReleaseNotes(e.target.value)}
                  placeholder="- Fixed bugs&#10;- Added new features"
                  rows={4}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none resize-none"
                />
              </div>

              <div className="flex items-center mt-4">
                <input
                  id="mandatory"
                  type="checkbox"
                  checked={isMandatory}
                  onChange={(e) => setIsMandatory(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="mandatory" className="ml-2 text-sm font-medium text-slate-700">
                  Mandatory Update (Users cannot dismiss)
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium py-3 rounded-xl shadow-md transition-all mt-6 disabled:opacity-50"
              >
                {isSubmitting ? 'Publishing...' : 'Publish Update'}
              </button>
            </form>
          </div>
        </div>

        {/* History Section */}
        <div className="flex-1 flex flex-col gap-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center">
              <ShieldAlert className="w-5 h-5 mr-2 text-indigo-500" /> Send Push Notification
            </h2>
            
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
                // Call Supabase Edge Function
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
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notification Title</label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="e.g. New Feature Alert!"
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Message Body</label>
                <textarea
                  name="body"
                  required
                  placeholder="Tell your users what's new..."
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Image URL (Optional)</label>
                <input
                  type="url"
                  name="imageUrl"
                  placeholder="https://... (For rich notifications)"
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3 rounded-xl shadow-md transition-all mt-4"
              >
                Broadcast Notification
              </button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex-1 overflow-auto">
            <h2 className="text-lg font-bold text-slate-900 mb-6">Update History</h2>
            
            {loading ? (
              <div className="space-y-4">
                {[1, 2].map(i => (
                  <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse"></div>
                ))}
              </div>
            ) : updates.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-sm">
                No updates published yet.
              </div>
            ) : (
              <div className="space-y-4">
                {updates.map((update) => (
                  <div key={update.id} className="p-4 border border-slate-200 rounded-xl">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-bold text-slate-900">v{update.version_name}</span>
                        <span className="ml-2 text-xs text-slate-500">(Code: {update.version_code})</span>
                      </div>
                      {update.is_mandatory ? (
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-md flex items-center">
                          <Check className="w-3 h-3 mr-1" /> Mandatory
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-md flex items-center">
                          <X className="w-3 h-3 mr-1" /> Optional
                        </span>
                      )}
                    </div>
                    <a href={update.update_url} target="_blank" rel="noreferrer" className="text-indigo-500 hover:underline text-xs mb-2 block truncate">
                      {update.update_url}
                    </a>
                    <p className="text-sm text-slate-600 whitespace-pre-line mt-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                      {update.release_notes}
                    </p>
                    <div className="text-xs text-slate-400 mt-3 text-right">
                      {new Date(update.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
};

export default Admin;
