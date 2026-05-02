import { useEffect, useState } from 'react';
import { useAuth } from '../components/AuthProvider';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { Plus, QrCode, LogOut, ExternalLink, Download, Edit, Trash2, ShieldAlert } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

type QRCodeData = {
  id: string;
  short_code: string;
  keyword: string | null;
  destination_url: string;
  created_at: string;
};

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [qrCodes, setQrCodes] = useState<QRCodeData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQRCodes = async () => {
    setLoading(true);
    if (!user) return;
    const { data } = await supabase
      .from('qr_codes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (data) {
      setQrCodes(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      fetchQRCodes();
    }
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this QR code?')) return;
    await supabase.from('qr_codes').delete().eq('id', id);
    fetchQRCodes();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-lg mr-3 shadow-md">
                <QrCode className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                DynamQR
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Your QR Codes</h1>
            <p className="text-slate-500 text-sm mt-1">Manage and track your dynamic links</p>
          </div>
          <div className="flex space-x-3">
            <Link 
              to="/admin" 
              className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2.5 rounded-xl font-medium flex items-center space-x-2 transition-all border border-red-200 active:scale-95"
            >
              <ShieldAlert className="w-5 h-5" />
              <span className="hidden sm:inline">Admin</span>
            </Link>
            <Link 
              to="/create" 
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium flex items-center space-x-2 transition-all shadow-md shadow-indigo-200 active:scale-95"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Create QR Code</span>
              <span className="sm:hidden">Create</span>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 h-64 animate-pulse">
                <div className="flex space-x-4 mb-4">
                  <div className="w-24 h-24 bg-slate-200 rounded-xl"></div>
                  <div className="flex-1 space-y-3 py-1">
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : qrCodes.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 border-dashed p-12 text-center">
            <div className="mx-auto w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
              <QrCode className="w-8 h-8 text-indigo-500" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No QR codes yet</h3>
            <p className="text-slate-500 max-w-sm mx-auto mb-6">Create your first dynamic QR code to start sharing editable links with your audience.</p>
            <Link 
              to="/create" 
              className="inline-flex bg-white border-2 border-indigo-100 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 px-6 py-2.5 rounded-xl font-medium items-center space-x-2 transition-all"
            >
              <Plus className="w-5 h-5" />
              <span>Create First QR</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {qrCodes.map((qr) => {
              const shortUrl = `https://dynamqr.vercel.app/${qr.short_code}`;
              
              return (
                <div key={qr.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow group flex flex-col">
                  <div className="flex items-start space-x-4 mb-4">
                    <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100 shrink-0">
                      <QRCodeSVG value={shortUrl} size={80} level="M" />
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <h3 className="text-sm font-semibold text-slate-900 truncate" title={qr.destination_url}>
                        {qr.destination_url}
                      </h3>
                      <div className="flex items-center space-x-1 mt-1 text-xs text-indigo-600 font-medium bg-indigo-50 px-2 py-1 rounded-md w-fit">
                        <span className="truncate max-w-[120px]">/{qr.short_code}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-2">
                        {new Date(qr.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center">
                    <div className="flex space-x-2">
                      <button className="text-slate-400 hover:text-indigo-600 p-1.5 rounded-md hover:bg-indigo-50 transition-colors" title="Edit URL">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="text-slate-400 hover:text-indigo-600 p-1.5 rounded-md hover:bg-indigo-50 transition-colors" title="Download QR">
                        <Download className="w-4 h-4" />
                      </button>
                      <a href={shortUrl} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-indigo-600 p-1.5 rounded-md hover:bg-indigo-50 transition-colors" title="Test Link">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                    <button 
                      onClick={() => handleDelete(qr.id)}
                      className="text-slate-400 hover:text-red-600 p-1.5 rounded-md hover:bg-red-50 transition-colors" title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
