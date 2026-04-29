import { useState } from 'react';
import { useAuth } from '../components/AuthProvider';
import { supabase } from '../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Link as LinkIcon, Hash, Save, Check, Plus } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const CreateQR = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate a random 6-character short code
  const generateShortCode = () => {
    return Math.random().toString(36).substring(2, 8);
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
      keyword: keyword.trim() || null,
      design_config: {}
    });

    setLoading(false);

    if (insertError) {
      if (insertError.code === '23505' && insertError.message.includes('keyword')) {
        setError('This keyword is already taken. Please choose another one.');
      } else {
        setError(insertError.message);
      }
    } else {
      navigate('/');
    }
  };

  // Preview short URL
  const previewShortUrl = `https://dynamqr.vercel.app/${keyword || 'YOUR_CODE'}`;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-4">
              <Link to="/" className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-xl font-bold text-slate-900">Create New QR Code</h1>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Form Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 mb-6">QR Code Details</h2>
              
              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm border border-red-100 flex items-start space-x-3">
                  <div className="shrink-0 mt-0.5">⚠️</div>
                  <div>{error}</div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Destination URL */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Destination URL</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <LinkIcon className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      required
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-slate-900 transition-all"
                      placeholder="e.g., example.com/my-portfolio"
                    />
                  </div>
                  <p className="text-xs text-slate-500">The link where your QR code will redirect to.</p>
                </div>

                {/* Custom Keyword */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Custom Keyword <span className="text-indigo-500 text-xs font-medium ml-2 px-2 py-0.5 bg-indigo-50 rounded-full">Premium Feature Preview</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Hash className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-slate-900 transition-all"
                      placeholder="e.g., my-portfolio"
                    />
                  </div>
                  <p className="text-xs text-slate-500">Make your short link memorable (only lowercase letters, numbers, and hyphens).</p>
                </div>

                {/* Presets (Placeholder UI) */}
                <div className="pt-4 border-t border-slate-100">
                  <label className="text-sm font-semibold text-slate-700 mb-3 block">Or use a preset</label>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-100 hover:border-slate-300 transition-colors">
                      📸 Instagram
                    </button>
                    <button type="button" className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-100 hover:border-slate-300 transition-colors">
                      💸 UPI Payment
                    </button>
                    <button type="button" className="px-4 py-2 border border-dashed border-slate-300 rounded-lg text-sm text-slate-500 hover:text-indigo-600 hover:border-indigo-300 transition-colors flex items-center">
                      <Plus className="w-4 h-4 mr-1" /> Add Preset
                    </button>
                  </div>
                </div>

                <div className="pt-6">
                  <button
                    type="submit"
                    disabled={loading || !url}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3.5 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-md shadow-indigo-200 disabled:opacity-50 disabled:shadow-none"
                  >
                    {loading ? (
                      <span className="flex items-center"><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Saving...</span>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        <span>Save & Generate QR</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Preview Column */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 sticky top-24 flex flex-col items-center text-center">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-6">Live Preview</h3>
              
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6 relative group">
                <div className="absolute inset-0 bg-indigo-500/5 rounded-2xl scale-105 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <QRCodeSVG 
                  value={url ? previewShortUrl : 'https://dynamqr.vercel.app'} 
                  size={180} 
                  level="Q" 
                  className={`transition-opacity duration-300 ${url ? 'opacity-100' : 'opacity-30'}`}
                />
              </div>

              <div className="w-full bg-slate-50 rounded-xl p-3 border border-slate-100">
                <p className="text-xs text-slate-400 mb-1">Your short link will be:</p>
                <p className="text-sm font-mono text-indigo-600 break-all">
                  domain.com/{keyword || 'short_code'}
                </p>
              </div>

              <div className="mt-6 w-full space-y-3">
                <div className="flex items-center text-sm text-slate-600">
                  <Check className="w-4 h-4 text-green-500 mr-2 shrink-0" />
                  <span>Update URL anytime</span>
                </div>
                <div className="flex items-center text-sm text-slate-600">
                  <Check className="w-4 h-4 text-green-500 mr-2 shrink-0" />
                  <span>QR code stays the same</span>
                </div>
                <div className="flex items-center text-sm text-slate-600">
                  <Check className="w-4 h-4 text-green-500 mr-2 shrink-0" />
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
