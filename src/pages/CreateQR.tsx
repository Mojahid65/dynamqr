import { useState } from 'react';
import { useAuth } from '../components/AuthProvider';
import { supabase } from '../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Link as LinkIcon, Save, QrCode, Link2, Check, ChevronUp } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '../components/ui/button';

const CreateQR = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'qr' | 'shortlink'>('qr');
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Generate a random short code like moja + 6 alphanumeric characters
  const generateShortCode = () => {
    return 'moja' + Math.random().toString(36).substring(2, 8);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    let finalUrl = url;
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = 'https://' + finalUrl;
    }

    setLoading(true);
    setError(null);

    const shortCode = generateShortCode();

    const { error: insertError } = await supabase.from('qr_codes').insert({
      user_id: user.id,
      destination_url: finalUrl,
      short_code: shortCode,
      design_config: {}
    });

    setLoading(false);

    if (insertError) {
      setError(insertError.message);
    } else {
      navigate('/');
    }
  };

  const previewShortUrl = `https://dynamqr.vercel.app/YOUR_CODE`;

  return (
    <div className="h-screen w-full bg-surface-container-lowest overflow-hidden flex flex-col md:flex-row relative">
      {/* Mobile Header */}
      <nav className="md:hidden flex items-center justify-between p-4 bg-surface-container-low border-b border-outline-variant z-20">
        <Link to="/" className="p-2 -ml-2 rounded-full hover:bg-surface-variant text-on-surface-variant">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <span className="font-bold text-foreground">Create {mode === 'qr' ? 'QR Code' : 'Shortlink'}</span>
        <div className="w-10"></div>
      </nav>

      {/* Desktop Side Panel / Form Drawer */}
      <div className={`
        fixed inset-x-0 bottom-0 z-30 transform transition-transform duration-300 ease-in-out
        md:relative md:transform-none md:inset-auto md:w-[400px] lg:w-[480px] md:h-screen
        bg-surface-container-low border-t md:border-t-0 md:border-r border-outline-variant flex flex-col
        ${isMobileDrawerOpen ? 'translate-y-0 h-[85vh]' : 'translate-y-[calc(100%-80px)] h-[85vh]'}
      `}>
        {/* Mobile Drawer Handle */}
        <div 
          className="md:hidden flex flex-col items-center justify-center h-[80px] border-b border-outline-variant/50 cursor-pointer"
          onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
        >
          <div className="w-12 h-1.5 bg-outline rounded-full mb-2"></div>
          <span className="text-sm font-semibold text-primary flex items-center gap-2">
            Settings & Form <ChevronUp className={`w-4 h-4 transition-transform duration-300 ${isMobileDrawerOpen ? 'rotate-180' : ''}`} />
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
          <div className="hidden md:flex items-center gap-4 mb-8">
            <Link to="/" className="p-2 -ml-2 rounded-full hover:bg-surface-variant text-on-surface-variant transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-2xl font-bold text-foreground">Create New</h1>
          </div>

          {/* Mode Switcher */}
          <div className="bg-surface-container-highest p-1.5 rounded-full flex gap-1 mb-8">
            <button
              onClick={() => setMode('qr')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-semibold transition-all ${
                mode === 'qr' ? 'bg-primary text-on-primary shadow-md' : 'text-on-surface-variant hover:text-foreground'
              }`}
            >
              <QrCode className="w-4 h-4" /> QR Code
            </button>
            <button
              onClick={() => setMode('shortlink')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-semibold transition-all ${
                mode === 'shortlink' ? 'bg-primary text-on-primary shadow-md' : 'text-on-surface-variant hover:text-foreground'
              }`}
            >
              <Link2 className="w-4 h-4" /> Shortlink
            </button>
          </div>

          {error && (
            <div className="bg-error-container text-on-error-container p-4 rounded-2xl mb-6 text-sm flex items-start gap-3">
              <div className="shrink-0 mt-0.5">⚠️</div>
              <div>{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8 pb-8">
            <div className="space-y-3">
              <label className="text-sm font-semibold text-on-surface ml-1">Destination URL</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <LinkIcon className="h-5 w-5 text-on-surface-variant group-focus-within:text-primary transition-colors" />
                </div>
                <input
                  type="text"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-surface-container-highest border-b-2 border-outline focus:border-primary rounded-t-xl rounded-b-none focus:outline-none text-foreground placeholder-on-surface-variant/50 transition-all focus:bg-surface-container"
                  placeholder="e.g., example.com/my-portfolio"
                />
              </div>
              <p className="text-xs font-medium text-on-surface-variant ml-1">
                Where should this {mode === 'qr' ? 'QR code' : 'link'} redirect to?
              </p>
            </div>

            <Button
              type="submit"
              disabled={loading || !url}
              className="w-full rounded-full h-14 text-base"
              size="lg"
            >
              {loading ? (
                <span className="flex items-center gap-3">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Processing...
                </span>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  <span>Generate {mode === 'qr' ? 'QR Code' : 'Shortlink'}</span>
                </>
              )}
            </Button>
          </form>
        </div>
      </div>

      {/* Main Preview Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden h-[calc(100vh-80px)] md:h-screen bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-surface-variant/20 via-background to-background">
        <div className="absolute top-10 w-full text-center px-4 md:hidden">
          <p className="text-sm font-semibold text-on-surface-variant uppercase tracking-widest">Live Preview</p>
        </div>

        <div className="max-w-md w-full flex flex-col items-center gap-8 -mt-20 md:mt-0">
          {mode === 'qr' ? (
            <div className="bg-white p-6 rounded-[2rem] shadow-2xl border border-outline-variant/30 relative group transition-all duration-500 hover:scale-[1.02]">
              <div className="absolute inset-0 bg-primary/5 rounded-[2rem] scale-105 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <QRCodeSVG 
                value={url ? previewShortUrl : 'https://dynamqr.vercel.app'} 
                size={220} 
                level="Q" 
                className={`transition-opacity duration-300 ${url ? 'opacity-100' : 'opacity-20'}`}
              />
            </div>
          ) : (
            <div className="bg-surface-container p-8 rounded-[2rem] shadow-xl border border-primary/20 w-full text-center flex flex-col items-center justify-center min-h-[220px]">
              <div className="bg-primary/20 p-4 rounded-full mb-4">
                <Link2 className="w-8 h-8 text-primary" />
              </div>
              <p className="text-lg font-medium text-foreground">Shortlink Ready</p>
            </div>
          )}

          <div className="w-full bg-surface-container rounded-[1.5rem] p-5 md:p-6 border border-outline-variant/50 shadow-lg backdrop-blur-md">
            <p className="text-xs font-bold text-on-surface-variant mb-2 uppercase tracking-wide">Your dynamic link:</p>
            <p className="text-sm md:text-base font-mono font-medium text-primary break-all bg-primary/5 p-3 rounded-xl border border-primary/10">
              {previewShortUrl}
            </p>
          </div>

          <div className="w-full flex justify-center gap-6 mt-4">
            <div className="flex flex-col items-center gap-2">
              <div className="bg-secondary-container p-3 rounded-full"><Check className="w-5 h-5 text-on-secondary-container" /></div>
              <span className="text-xs font-semibold text-on-surface-variant text-center max-w-[80px]">Editable</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="bg-secondary-container p-3 rounded-full"><Check className="w-5 h-5 text-on-secondary-container" /></div>
              <span className="text-xs font-semibold text-on-surface-variant text-center max-w-[80px]">Trackable</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="bg-secondary-container p-3 rounded-full"><Check className="w-5 h-5 text-on-secondary-container" /></div>
              <span className="text-xs font-semibold text-on-surface-variant text-center max-w-[80px]">Secure</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobileDrawerOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-20 transition-opacity"
          onClick={() => setIsMobileDrawerOpen(false)}
        />
      )}
    </div>
  );
};

export default CreateQR;
