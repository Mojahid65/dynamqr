import { useState } from 'react';
import { useAuth } from '../components/AuthProvider';
import { supabase } from '../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Link as LinkIcon, Save, Check } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '../components/ui/button';

const CreateQR = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate a random short code like moja + 6 alphanumeric characters
  const generateShortCode = () => {
    return 'moja' + Math.random().toString(36).substring(2, 8);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    // Basic URL validation
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

  // Preview short URL
  const previewShortUrl = `https://dynamqr.vercel.app/YOUR_CODE`;

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-surface-container-low border-b border-outline-variant sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-4">
              <Link to="/" className="text-on-surface-variant hover:text-primary p-2 rounded-full hover:bg-surface-variant transition-colors">
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <h1 className="text-2xl font-bold text-foreground">Create New QR Code</h1>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Form Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-surface-container-low rounded-[2rem] p-8 md:p-10 shadow-sm border border-outline-variant">
              <h2 className="text-2xl font-bold text-foreground mb-8">QR Code Details</h2>
              
              {error && (
                <div className="bg-error-container text-on-error-container p-4 rounded-2xl mb-6 text-sm flex items-start space-x-3">
                  <div className="shrink-0 mt-0.5">⚠️</div>
                  <div>{error}</div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Destination URL */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-on-surface ml-1">Destination URL</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <LinkIcon className="h-5 w-5 text-on-surface-variant" />
                    </div>
                    <input
                      type="text"
                      required
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-surface-container-highest border-b-2 border-outline focus:border-primary rounded-t-xl rounded-b-none focus:outline-none text-foreground placeholder-on-surface-variant/50 transition-colors"
                      placeholder="e.g., example.com/my-portfolio"
                    />
                  </div>
                  <p className="text-sm font-medium text-on-surface-variant ml-1">The link where your QR code will redirect to.</p>
                </div>

                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={loading || !url}
                    className="w-full"
                    size="lg"
                  >
                    {loading ? (
                      <span className="flex items-center"><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Saving...</span>
                    ) : (
                      <>
                        <Save className="w-5 h-5 mr-2" />
                        <span>Save & Generate QR</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* Preview Column */}
          <div className="lg:col-span-1">
            <div className="bg-surface-container-low rounded-[2rem] p-8 shadow-sm border border-outline-variant sticky top-24 flex flex-col items-center text-center">
              <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-8">Live Preview</h3>
              
              <div className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-outline-variant mb-8 relative group">
                <div className="absolute inset-0 bg-primary/5 rounded-[1.5rem] scale-105 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <QRCodeSVG 
                  value={url ? previewShortUrl : 'https://dynamqr.vercel.app'} 
                  size={180} 
                  level="Q" 
                  className={`transition-opacity duration-300 ${url ? 'opacity-100' : 'opacity-30'}`}
                />
              </div>

              <div className="w-full bg-surface-container rounded-2xl p-4 border border-outline-variant">
                <p className="text-xs font-semibold text-on-surface-variant mb-1">Your short link will be:</p>
                <p className="text-base font-mono font-medium text-primary break-all">
                  domain.com/YOUR_CODE
                </p>
              </div>

              <div className="mt-8 w-full space-y-4">
                <div className="flex items-center text-sm font-medium text-on-surface">
                  <div className="bg-primary-container p-1 rounded-full mr-3 shrink-0">
                    <Check className="w-4 h-4 text-on-primary-container" />
                  </div>
                  <span>Update URL anytime</span>
                </div>
                <div className="flex items-center text-sm font-medium text-on-surface">
                  <div className="bg-primary-container p-1 rounded-full mr-3 shrink-0">
                    <Check className="w-4 h-4 text-on-primary-container" />
                  </div>
                  <span>QR stays the same</span>
                </div>
                <div className="flex items-center text-sm font-medium text-on-surface">
                  <div className="bg-primary-container p-1 rounded-full mr-3 shrink-0">
                    <Check className="w-4 h-4 text-on-primary-container" />
                  </div>
                  <span>Track scans (Coming soon)</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default CreateQR;
