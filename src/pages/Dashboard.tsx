import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../components/AuthProvider';
import { supabase } from '../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, QrCode, LogOut, ExternalLink, Download, Trash2, Map, LayoutDashboard, UploadCloud, Users, Layers, User, AlertTriangle, ShieldAlert } from 'lucide-react';
import QRCodeStyling from 'qr-code-styling';
import { Button } from '../components/ui/button';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import type { QRCodeData } from '../types/database';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [qrCodes, setQrCodes] = useState<QRCodeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'campaigns' | 'heatmap' | 'bulk' | 'team' | 'account'>('overview');
  const [scans, setScans] = useState<any[]>([]);

  // Account Deletion State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    if (!user) return;
    
    // Fetch QRs
    const { data: qrs } = await supabase
      .from('qr_codes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (qrs) setQrCodes(qrs as unknown as QRCodeData[]);

    // Fetch Scans for Analytics
    if (qrs && qrs.length > 0) {
      const qrIds = qrs.map(q => q.id);
      const { data: scanData } = await supabase
        .from('scan_events')
        .select('id, qr_code_id, country, city, created_at, os, browser')
        .in('qr_code_id', qrIds);
        
      if (scanData) setScans(scanData);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const handleDeleteQr = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this QR code?')) return;
    await supabase.from('qr_codes').delete().eq('id', id);
    fetchDashboardData();
  };

  const handleDownload = (shortCode: string, designConfig: any) => {
    const qrCode = new QRCodeStyling({
      width: 1000,
      height: 1000,
      type: "canvas" as any,
      data: `https://dynamqr.vercel.app/${shortCode}`,
      dotsOptions: { type: designConfig?.dotType || 'square', color: designConfig?.fgColor || '#000' },
      backgroundOptions: { color: designConfig?.bgColor || '#fff' },
      cornersSquareOptions: { type: designConfig?.cornersType || 'square', color: designConfig?.fgColor || '#000' }
    });
    qrCode.download({ name: `QR_${shortCode}`, extension: "png" });
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    if (confirmText.trim().toUpperCase() !== 'DELETE') {
      setDeleteError("Please type 'DELETE' to confirm.");
      return;
    }

    setIsDeletingAccount(true);
    setDeleteError(null);

    try {
      // Delete user records across tables
      if (qrCodes.length > 0) {
        const qrIds = qrCodes.map(q => q.id);
        await supabase.from('scan_events').delete().in('qr_code_id', qrIds);
      }
      await supabase.from('qr_codes').delete().eq('user_id', user.id);
      await supabase.from('campaigns').delete().eq('user_id', user.id);
      await supabase.from('qr_templates').delete().eq('user_id', user.id);
      await supabase.from('api_keys').delete().eq('user_id', user.id);
      await supabase.from('profiles').delete().eq('id', user.id);

      // Sign out
      await signOut();
      navigate('/login');
    } catch (err: any) {
      console.error(err);
      setDeleteError(err.message || 'Failed to delete account.');
      setIsDeletingAccount(false);
    }
  };

  // Group Scans by Country for Map
  const countryData = useMemo(() => {
    const counts: Record<string, number> = {};
    scans.forEach(s => {
      if (s.country && s.country !== 'Unknown') {
        counts[s.country] = (counts[s.country] || 0) + 1;
      }
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [scans]);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-surface border-r border-outline-variant flex flex-col hidden md:flex">
        <div className="p-6 border-b border-outline-variant flex items-center gap-3">
          <div className="bg-primary p-2 rounded-xl">
            <QrCode className="w-6 h-6 text-on-primary" />
          </div>
          <span className="text-xl font-bold text-foreground">DynamQR</span>
        </div>
        
        <div className="flex-1 py-6 px-4 flex flex-col gap-2">
          {[
            { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
            { id: 'campaigns', icon: Layers, label: 'Campaigns' },
            { id: 'heatmap', icon: Map, label: 'Scan Heatmap' },
            { id: 'bulk', icon: UploadCloud, label: 'Bulk Generate' },
            { id: 'team', icon: Users, label: 'Team Workspace' },
            { id: 'account', icon: User, label: 'Account Settings' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${
                activeTab === item.id 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-on-surface-variant hover:bg-surface-variant/50 hover:text-foreground'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </div>

        <div className="p-6 border-t border-outline-variant">
          <button onClick={signOut} className="flex items-center gap-3 text-on-surface-variant hover:text-error transition-colors w-full">
            <LogOut className="w-5 h-5" />
            <span className="font-medium text-sm">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Nav */}
        <nav className="md:hidden flex items-center justify-between p-4 bg-surface border-b border-outline-variant">
          <span className="text-lg font-bold">DynamQR</span>
          <button onClick={signOut}><LogOut className="w-5 h-5 text-on-surface-variant" /></button>
        </nav>

        <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar bg-surface-container-lowest">
          
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground capitalize tracking-tight">{activeTab.replace('-', ' ')}</h1>
              <p className="text-on-surface-variant mt-1">Manage your dynamic QR ecosystem and account settings.</p>
            </div>
            {activeTab === 'overview' && (
              <Button asChild className="rounded-full shadow-lg h-12 px-6">
                <Link to="/create">
                  <Plus className="w-5 h-5 mr-2" />
                  Create QR Code
                </Link>
              </Button>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1,2,3].map(i => <div key={i} className="h-48 bg-surface-variant animate-pulse rounded-2xl"></div>)}
            </div>
          ) : (
            <>
              {/* TAB: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-8 animate-in fade-in">
                  
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-surface p-6 rounded-2xl border border-outline-variant">
                      <p className="text-on-surface-variant text-sm font-medium">Total QRs</p>
                      <p className="text-3xl font-bold mt-2">{qrCodes.length}</p>
                    </div>
                    <div className="bg-surface p-6 rounded-2xl border border-outline-variant">
                      <p className="text-on-surface-variant text-sm font-medium">Total Scans</p>
                      <p className="text-3xl font-bold mt-2">{scans.length}</p>
                    </div>
                    <div className="bg-surface p-6 rounded-2xl border border-outline-variant">
                      <p className="text-on-surface-variant text-sm font-medium">Active Rules</p>
                      <p className="text-3xl font-bold mt-2">{qrCodes.filter(q => q.rules?.length > 0).length}</p>
                    </div>
                    <div className="bg-primary/10 p-6 rounded-2xl border border-primary/20">
                      <p className="text-primary text-sm font-medium">Top Performer</p>
                      <p className="text-lg font-bold mt-2 text-primary truncate">
                        {qrCodes[0]?.destination_url || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {qrCodes.length === 0 ? (
                     <div className="text-center py-20 bg-surface rounded-[2rem] border border-outline-variant border-dashed">
                       <QrCode className="w-16 h-16 text-on-surface-variant mx-auto mb-4 opacity-50" />
                       <h2 className="text-xl font-bold">No QR Codes Found</h2>
                       <p className="text-on-surface-variant mt-2 mb-6">Start building your dynamic QR ecosystem today.</p>
                     </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {qrCodes.map(qr => {
                        const shortUrl = `https://dynamqr.vercel.app/${qr.short_code}`;
                        return (
                          <div key={qr.id} className="bg-surface rounded-2xl p-6 border border-outline-variant hover:shadow-lg transition-all flex flex-col group">
                            <div className="flex gap-4">
                              <div className="w-20 h-20 bg-white rounded-xl shadow-sm border border-outline-variant overflow-hidden p-1 shrink-0">
                                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(shortUrl)}`} alt="QR" className="w-full h-full object-contain" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-1">{qr.qr_type}</p>
                                <h3 className="font-bold text-foreground truncate" title={qr.destination_url}>{qr.destination_url}</h3>
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="text-xs font-mono bg-surface-variant px-2 py-1 rounded text-on-surface-variant">/{qr.short_code}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="mt-4 flex flex-wrap gap-2">
                              {qr.is_password_protected && <span className="text-[10px] uppercase font-bold px-2 py-1 bg-warning/20 text-warning-dark rounded-full">Secured</span>}
                              {qr.rules?.length > 0 && <span className="text-[10px] uppercase font-bold px-2 py-1 bg-primary/20 text-primary rounded-full">Smart Rules</span>}
                              {qr.schedules?.length > 0 && <span className="text-[10px] uppercase font-bold px-2 py-1 bg-tertiary/20 text-tertiary rounded-full">Scheduled</span>}
                            </div>

                            <div className="mt-auto pt-6 border-t border-outline-variant/50 flex justify-between">
                              <div className="flex gap-1">
                                <button onClick={() => handleDownload(qr.short_code, qr.design_config)} className="p-2 hover:bg-surface-variant rounded-full text-on-surface-variant transition"><Download className="w-4 h-4" /></button>
                                <a href={shortUrl} target="_blank" rel="noreferrer" className="p-2 hover:bg-surface-variant rounded-full text-on-surface-variant transition"><ExternalLink className="w-4 h-4" /></a>
                              </div>
                              <button onClick={() => handleDeleteQr(qr.id)} className="p-2 hover:bg-error/10 hover:text-error rounded-full text-on-surface-variant transition"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB: HEATMAP */}
              {activeTab === 'heatmap' && (
                <div className="space-y-6 animate-in fade-in h-full flex flex-col">
                  <div className="bg-surface rounded-3xl p-8 border border-outline-variant shadow-sm flex-1 flex flex-col">
                    <h3 className="text-xl font-bold mb-6">Global Scan Distribution</h3>
                    <div className="flex-1 w-full bg-surface-variant/20 rounded-2xl relative overflow-hidden flex items-center justify-center">
                       <ComposableMap projectionConfig={{ scale: 140 }}>
                          <Geographies geography={geoUrl}>
                            {({ geographies }) =>
                              geographies.map((geo) => {
                                const d = countryData.find((s) => s.name === geo.properties.name);
                                return (
                                  <Geography
                                    key={geo.rsmKey}
                                    geography={geo}
                                    fill={d ? `rgba(99, 102, 241, ${Math.max(0.2, d.count / Math.max(...countryData.map(x=>x.count)))})` : "#EAEAEC"}
                                    stroke="#D6D6DA"
                                  />
                                );
                              })
                            }
                          </Geographies>
                        </ComposableMap>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: ACCOUNT SETTINGS */}
              {activeTab === 'account' && (
                <div className="max-w-2xl space-y-8 animate-in fade-in">
                  <div className="bg-surface p-8 rounded-3xl border border-outline-variant space-y-6">
                    <h2 className="text-xl font-bold text-foreground">User Profile</h2>
                    
                    <div className="space-y-4 text-sm">
                      <div className="flex justify-between py-3 border-b border-outline-variant">
                        <span className="text-on-surface-variant font-medium">Email Address</span>
                        <span className="font-bold text-foreground">{user?.email}</span>
                      </div>
                      <div className="flex justify-between py-3 border-b border-outline-variant">
                        <span className="text-on-surface-variant font-medium">User ID</span>
                        <span className="font-mono text-xs text-on-surface-variant">{user?.id}</span>
                      </div>
                      <div className="flex justify-between py-3 border-b border-outline-variant">
                        <span className="text-on-surface-variant font-medium">Account Status</span>
                        <span className="text-emerald-500 font-bold">Active Pro</span>
                      </div>
                    </div>
                  </div>

                  {/* Danger Zone: Delete Account */}
                  <div className="bg-error-container/20 p-8 rounded-3xl border border-error/30 space-y-4">
                    <div className="flex items-center gap-3 text-error">
                      <ShieldAlert className="w-6 h-6" />
                      <h2 className="text-xl font-bold">Danger Zone</h2>
                    </div>
                    <p className="text-sm text-on-surface-variant">
                      Permanently delete your account, all dynamic QR codes, smart redirect rules, analytics events, and API keys. This action cannot be undone.
                    </p>
                    <Button 
                      variant="destructive" 
                      onClick={() => setShowDeleteModal(true)}
                      className="rounded-xl font-semibold bg-error hover:bg-error/90 text-on-error"
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> Delete Account
                    </Button>
                  </div>
                </div>
              )}

              {/* OTHER TABS */}
              {(activeTab === 'campaigns' || activeTab === 'team' || activeTab === 'bulk') && (
                <div className="flex flex-col items-center justify-center h-[60vh] bg-surface rounded-[2rem] border border-outline-variant border-dashed text-center">
                  <div className="bg-surface-variant p-4 rounded-full mb-6">
                    {activeTab === 'campaigns' && <Layers className="w-8 h-8 text-on-surface-variant" />}
                    {activeTab === 'team' && <Users className="w-8 h-8 text-on-surface-variant" />}
                    {activeTab === 'bulk' && <UploadCloud className="w-8 h-8 text-on-surface-variant" />}
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Feature Included</h2>
                  <p className="text-on-surface-variant max-w-sm">Manage campaigns, bulk QR generator, and workspace tools.</p>
                </div>
              )}

            </>
          )}
        </div>
      </main>

      {/* Account Deletion Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-surface p-8 rounded-[2rem] border border-outline-variant max-w-md w-full shadow-2xl space-y-6">
            <div className="w-16 h-16 bg-error-container text-error rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="text-center">
              <h3 className="text-2xl font-bold text-foreground">Delete Account?</h3>
              <p className="text-sm text-on-surface-variant mt-2">
                This will permanently delete your account and all associated QR codes.
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block">
                Type <span className="text-error font-bold">DELETE</span> to confirm:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full p-4 rounded-xl bg-surface-container-lowest border border-outline-variant focus:border-error outline-none font-bold text-center uppercase tracking-widest"
              />
              {deleteError && <p className="text-xs text-error text-center">{deleteError}</p>}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setConfirmText('');
                  setDeleteError(null);
                }}
                className="flex-1 rounded-xl py-6"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={isDeletingAccount || confirmText.trim().toUpperCase() !== 'DELETE'}
                className="flex-1 rounded-xl py-6 font-bold bg-error hover:bg-error/90 text-on-error"
              >
                {isDeletingAccount ? 'Deleting...' : 'Delete Account'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
