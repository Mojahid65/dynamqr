import { useEffect, useState } from 'react';
import { useAuth } from '../components/AuthProvider';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { Plus, QrCode, LogOut, ExternalLink, Download, Edit, Trash2, ShieldAlert, Code2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '../components/ui/button';

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
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-surface-container-low border-b border-outline-variant sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="bg-primary-container p-2 rounded-[1rem] mr-3">
                <QrCode className="w-6 h-6 text-on-primary-container" />
              </div>
              <span className="text-xl font-bold text-foreground">
                DynamQR
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-on-surface-variant hidden md:block">{user?.email}</span>
              <button 
                onClick={signOut}
                className="text-on-surface-variant hover:text-on-surface p-2 rounded-full hover:bg-surface-variant transition-colors"
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
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Your QR Codes</h1>
            <p className="text-on-surface-variant text-base mt-1">Manage and track your dynamic links</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline" size="sm" className="rounded-full h-10 px-4 font-medium">
              <Link to="/developer">
                <Code2 className="w-5 h-5 mr-2 text-primary" />
                Developer API
              </Link>
            </Button>
            {(user?.email === import.meta.env.VITE_ADMIN_EMAIL || user?.email === 'mojahidgfx@gmail.com') && (
              <Button asChild variant="destructive" size="sm" className="rounded-full h-10 px-4 bg-error-container text-on-error-container hover:bg-error hover:text-on-error font-medium">
                <Link to="/admin">
                  <ShieldAlert className="w-5 h-5 mr-2" />
                  <span className="hidden sm:inline">Admin</span>
                </Link>
              </Button>
            )}
            <Button asChild variant="default" size="sm" className="rounded-full h-10 px-6 font-medium shadow-md">
              <Link to="/create">
                <Plus className="w-5 h-5 mr-1" />
                <span className="hidden sm:inline">Create QR Code</span>
                <span className="sm:hidden">Create</span>
              </Link>
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-surface-container-low rounded-[1.5rem] p-6 shadow-sm border border-outline-variant h-64 animate-pulse">
                <div className="flex space-x-4 mb-4">
                  <div className="w-24 h-24 bg-surface-variant rounded-[1rem]"></div>
                  <div className="flex-1 space-y-3 py-1">
                    <div className="h-4 bg-surface-variant rounded w-3/4"></div>
                    <div className="h-3 bg-surface-variant rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : qrCodes.length === 0 ? (
          <div className="bg-surface-container rounded-[2rem] p-12 text-center max-w-2xl mx-auto mt-12">
            <div className="mx-auto w-20 h-20 bg-primary-container rounded-full flex items-center justify-center mb-6">
              <QrCode className="w-10 h-10 text-on-primary-container" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-3">No QR codes yet</h3>
            <p className="text-on-surface-variant max-w-sm mx-auto mb-8 text-base">Create your first dynamic QR code to start sharing editable links with your audience.</p>
            <Button asChild variant="tonal" size="lg" className="rounded-full font-medium px-8 shadow-sm">
              <Link to="/create">
                <Plus className="w-5 h-5 mr-2" />
                Create First QR
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {qrCodes.map((qr) => {
              const shortUrl = `https://dynamqr.vercel.app/${qr.short_code}`;
              
              return (
                <div key={qr.id} className="bg-surface-container-low rounded-[1.5rem] p-6 shadow-sm border border-outline-variant hover:shadow-md hover:bg-surface-container transition-all group flex flex-col">
                  <div className="flex items-start space-x-4 mb-4">
                    <div className="bg-white p-2 rounded-[1rem] shadow-sm shrink-0">
                      <QRCodeSVG value={shortUrl} size={80} level="M" />
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <h3 className="text-base font-semibold text-foreground truncate" title={qr.destination_url}>
                        {qr.destination_url}
                      </h3>
                      <div className="flex items-center space-x-1 mt-2 text-sm font-medium text-on-secondary-container bg-secondary-container px-3 py-1 rounded-full w-fit">
                        <span className="truncate max-w-[120px]">/{qr.short_code}</span>
                      </div>
                      <p className="text-xs font-medium text-on-surface-variant mt-3">
                        {new Date(qr.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-auto pt-4 border-t border-outline-variant flex justify-between items-center">
                    <div className="flex space-x-1">
                      <button className="text-on-surface-variant hover:text-primary p-2 rounded-full hover:bg-surface-variant transition-colors" title="Edit URL">
                        <Edit className="w-5 h-5" />
                      </button>
                      <button className="text-on-surface-variant hover:text-primary p-2 rounded-full hover:bg-surface-variant transition-colors" title="Download QR">
                        <Download className="w-5 h-5" />
                      </button>
                      <a href={shortUrl} target="_blank" rel="noopener noreferrer" className="text-on-surface-variant hover:text-primary p-2 rounded-full hover:bg-surface-variant transition-colors" title="Test Link">
                        <ExternalLink className="w-5 h-5" />
                      </a>
                    </div>
                    <button 
                      onClick={() => handleDelete(qr.id)}
                      className="text-on-surface-variant hover:text-error p-2 rounded-full hover:bg-error-container transition-colors" title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
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

