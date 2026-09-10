import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../components/AuthProvider';
import { supabase } from '../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Settings2, Shield, Calendar, Shuffle, Smartphone, Type, Palette, Sparkles, Wifi, User, Mail, MessageSquare, Lock, Globe, RefreshCw } from 'lucide-react';
import QRCodeStyling from 'qr-code-styling';
import { Button } from '../components/ui/button';
import type { SmartRule, Schedule, ABVariant } from '../types/database';

type Tab = 'destination' | 'design' | 'rules' | 'schedule' | 'security' | 'abtest' | 'settings';

export default function CreateQR() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('destination');
  
  // Content / Type State
  const [qrType, setQrType] = useState<'url' | 'wifi' | 'vcard' | 'email' | 'sms'>('url');
  const [url, setUrl] = useState('');

  // Wi-Fi Fields
  const [wifiSsid, setWifiSsid] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [wifiEncryption, setWifiEncryption] = useState('WPA');
  const [wifiHidden, setWifiHidden] = useState(false);

  // vCard Fields
  const [vFirstName, setVFirstName] = useState('');
  const [vLastName, setVLastName] = useState('');
  const [vPhone, setVPhone] = useState('');
  const [vEmail, setVEmail] = useState('');
  const [vCompany, setVCompany] = useState('');
  const [vTitle, setVTitle] = useState('');
  const [vWebsite, setVWebsite] = useState('');
  const [vAddress, setVAddress] = useState('');

  // Email Fields
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  // SMS Fields
  const [smsPhone, setSmsPhone] = useState('');
  const [smsMessage, setSmsMessage] = useState('');

  // Advanced States
  const [customShortCode, setCustomShortCode] = useState('');
  const [smartRules, setSmartRules] = useState<SmartRule[]>([]);
  const [schedules] = useState<Schedule[]>([]);
  const [abVariants] = useState<ABVariant[]>([]);
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [password, setPassword] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [expirationMessage, setExpirationMessage] = useState('');
  const [expirationUrl, setExpirationUrl] = useState('');
  const [scanLimit, setScanLimit] = useState<number | ''>('');
  
  // Design State with Custom & AI Background Support
  const [design, setDesign] = useState({
    dotType: 'square',
    cornersType: 'square',
    fgColor: '#000000',
    bgColor: '#ffffff',
    eyeColor: '#000000',
    bgType: 'color', // 'color' | 'image' | 'gradient' | 'ai'
    bgImage: '',
    bgOpacity: 0.85,
    bgGradient: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
  });

  // AI Generator state
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  const previewRef = useRef<HTMLDivElement>(null);
  const qrCodeStyling = useRef<any>(null);

  // Init QR
  useEffect(() => {
    qrCodeStyling.current = new (QRCodeStyling as any)({
      width: 260,
      height: 260,
      type: "svg",
      data: `https://dynamqr.vercel.app/${customShortCode || 'preview'}`,
      dotsOptions: { type: design.dotType as any, color: design.fgColor },
      backgroundOptions: { color: design.bgType === 'color' ? design.bgColor : 'transparent' },
      cornersSquareOptions: { type: design.cornersType as any, color: design.eyeColor || design.fgColor },
      cornersDotOptions: { type: 'square', color: design.eyeColor || design.fgColor }
    });
    
    if (previewRef.current) {
      previewRef.current.innerHTML = '';
      qrCodeStyling.current.append(previewRef.current);
    }
  }, []);

  // Update QR on design change
  useEffect(() => {
    if (qrCodeStyling.current) {
      qrCodeStyling.current.update({
        data: `https://dynamqr.vercel.app/${customShortCode || 'preview'}`,
        dotsOptions: { type: design.dotType as any, color: design.fgColor },
        backgroundOptions: { color: design.bgType === 'color' ? design.bgColor : 'transparent' },
        cornersSquareOptions: { type: design.cornersType as any, color: design.eyeColor || design.fgColor },
        cornersDotOptions: { type: 'square', color: design.eyeColor || design.fgColor }
      });
    }
  }, [customShortCode, design]);

  const generateShortCode = (prefix: string = 'moja') => prefix + Math.random().toString(36).substring(2, 8);

  const generateAiBackground = (promptText?: string) => {
    const p = promptText || aiPrompt;
    if (!p) return;
    setIsGeneratingAi(true);
    const encodedPrompt = encodeURIComponent(p);
    const seed = Math.floor(Math.random() * 1000000);
    const aiImageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=800&nologo=true&seed=${seed}`;
    
    // Preload image
    const img = new Image();
    img.src = aiImageUrl;
    img.onload = () => {
      setDesign(prev => ({
        ...prev,
        bgType: 'ai',
        bgImage: aiImageUrl,
      }));
      setIsGeneratingAi(false);
    };
    img.onerror = () => {
      // Fallback AI abstract gradient background
      const fallbackUrl = `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80`;
      setDesign(prev => ({
        ...prev,
        bgType: 'ai',
        bgImage: fallbackUrl,
      }));
      setIsGeneratingAi(false);
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    setError(null);

    // Compute final destination string & structured type payload
    let finalDestination = '';
    let typeData: Record<string, any> = {};

    if (qrType === 'url') {
      finalDestination = url;
      if (finalDestination && !/^https?:\/\//i.test(finalDestination)) {
        finalDestination = 'https://' + finalDestination;
      }
    } else if (qrType === 'wifi') {
      finalDestination = `WIFI:S:${wifiSsid};T:${wifiEncryption};P:${wifiPassword};H:${wifiHidden ? 'true' : 'false'};;`;
      typeData = { ssid: wifiSsid, password: wifiPassword, encryption: wifiEncryption, hidden: wifiHidden };
    } else if (qrType === 'vcard') {
      finalDestination = `BEGIN:VCARD\nVERSION:3.0\nN:${vLastName};${vFirstName}\nFN:${vFirstName} ${vLastName}\nTEL:${vPhone}\nEMAIL:${vEmail}\nORG:${vCompany}\nTITLE:${vTitle}\nURL:${vWebsite}\nADR:;;${vAddress}\nEND:VCARD`;
      typeData = {
        firstName: vFirstName,
        lastName: vLastName,
        phone: vPhone,
        email: vEmail,
        company: vCompany,
        title: vTitle,
        website: vWebsite,
        address: vAddress
      };
    } else if (qrType === 'email') {
      finalDestination = `mailto:${emailTo}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
      typeData = { email: emailTo, subject: emailSubject, body: emailBody };
    } else if (qrType === 'sms') {
      finalDestination = `smsto:${smsPhone}:${smsMessage}`;
      typeData = { phone: smsPhone, message: smsMessage };
    }

    if (isPasswordProtected && !password) {
      setError('Please provide a password for Password Protection.');
      setLoading(false);
      return;
    }

    const shortCode = customShortCode || generateShortCode();
    
    let passwordHash = null;
    if (isPasswordProtected && password) {
      const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
      passwordHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    const { error: insertError } = await supabase.from('qr_codes').insert({
      user_id: user.id,
      destination_url: finalDestination,
      short_code: shortCode,
      qr_type: qrType,
      type_data: typeData,
      rules: smartRules,
      schedules: schedules,
      password_hash: passwordHash,
      is_password_protected: isPasswordProtected,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      expiration_message: expirationMessage,
      expiration_url: expirationUrl,
      ab_variants: abVariants,
      scan_limit: scanLimit === '' ? null : Number(scanLimit),
      design_config: design
    });

    setLoading(false);

    if (insertError) {
      setError(insertError.message);
    } else {
      navigate('/');
    }
  };

  const tabs = [
    { id: 'destination', label: 'Content', icon: Type },
    { id: 'design', label: 'Design & AI', icon: Palette },
    { id: 'rules', label: 'Smart Rules', icon: Smartphone },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'abtest', label: 'A/B Test', icon: Shuffle },
    { id: 'settings', label: 'Settings', icon: Settings2 },
  ];

  const aiPresets = [
    { name: 'Cyberpunk', prompt: 'Futuristic neon cyberpunk grid with glowing violet cyan light rays' },
    { name: 'Luxury Gold', prompt: 'Luxury dark black marble background with elegant metallic gold veins' },
    { name: 'Abstract Mesh', prompt: 'Modern sleek 3D liquid mesh background with gradient dark purple blue colors' },
    { name: 'Pastel Waves', prompt: 'Minimalist soft pastel gradient silk waves with clean modern light' },
    { name: '3D Glass', prompt: 'Abstract frosted glassmorphism geometric 3D shapes floating in dark space' },
    { name: 'Cosmic Galaxy', prompt: 'Deep space galaxy nebula with star dust particles and violet aura' }
  ];

  return (
    <div className="h-screen w-full bg-background overflow-hidden flex flex-col md:flex-row">
      {/* Left Form Area */}
      <div className="md:w-[540px] lg:w-[640px] h-full flex flex-col bg-surface border-r border-outline-variant shadow-lg z-10 relative">
        <div className="p-6 border-b border-outline-variant flex items-center justify-between bg-surface-container-low">
          <div className="flex items-center gap-4">
            <Link to="/" className="p-2 -ml-2 rounded-full hover:bg-surface-variant transition">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold">Create Dynamic QR</h1>
          </div>
          <Button onClick={handleSubmit} disabled={loading} className="rounded-full shadow-md">
            {loading ? 'Saving...' : <><Save className="w-4 h-4 mr-2" /> Save QR Code</>}
          </Button>
        </div>
        
        {/* Horizontal Tabs */}
        <div className="flex overflow-x-auto custom-scrollbar border-b border-outline-variant bg-surface-container-lowest">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as Tab)}
              className={`flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === t.id ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-on-surface-variant hover:text-foreground hover:bg-surface-variant/50'
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar bg-surface-container-lowest">
          {error && (
            <div className="bg-error-container text-on-error-container p-4 rounded-xl mb-6 text-sm">
              {error}
            </div>
          )}

          {/* TAB: DESTINATION / CONTENT */}
          {activeTab === 'destination' && (
            <div className="space-y-6 animate-in fade-in">
              <div>
                <label className="text-sm font-semibold mb-2 block text-foreground">QR Content Type</label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {[
                    { id: 'url', label: 'Website URL', icon: Globe },
                    { id: 'wifi', label: 'Wi-Fi Network', icon: Wifi },
                    { id: 'vcard', label: 'Digital Contact', icon: User },
                    { id: 'email', label: 'Email Address', icon: Mail },
                    { id: 'sms', label: 'SMS Message', icon: MessageSquare },
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setQrType(t.id as any)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border text-sm font-medium transition-all ${
                        qrType === t.id 
                          ? 'border-primary bg-primary/10 text-primary shadow-sm' 
                          : 'border-outline-variant bg-surface text-on-surface-variant hover:border-primary/50'
                      }`}
                    >
                      <t.icon className="w-5 h-5" />
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Website URL Form */}
              {qrType === 'url' && (
                <div className="space-y-4">
                  <label className="text-sm font-semibold block">Destination Web Address (URL)</label>
                  <input
                    type="url"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full p-4 rounded-xl bg-surface border border-outline-variant focus:border-primary outline-none text-foreground"
                  />
                  <p className="text-xs text-on-surface-variant">Users scanning your QR code will be redirected directly to this website.</p>
                </div>
              )}

              {/* Wi-Fi Form */}
              {qrType === 'wifi' && (
                <div className="space-y-4 bg-surface p-6 rounded-2xl border border-outline-variant">
                  <h3 className="font-semibold flex items-center gap-2 text-primary">
                    <Wifi className="w-5 h-5" /> Wi-Fi Credentials
                  </h3>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider block mb-1">Network Name (SSID)</label>
                    <input
                      type="text"
                      value={wifiSsid}
                      onChange={e => setWifiSsid(e.target.value)}
                      placeholder="Home_WiFi_5G"
                      className="w-full p-3 rounded-xl bg-surface-container-lowest border border-outline-variant focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider block mb-1">Wi-Fi Password</label>
                    <input
                      type="password"
                      value={wifiPassword}
                      onChange={e => setWifiPassword(e.target.value)}
                      placeholder="Wi-Fi Password"
                      className="w-full p-3 rounded-xl bg-surface-container-lowest border border-outline-variant focus:border-primary outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider block mb-1">Security Type</label>
                      <select
                        value={wifiEncryption}
                        onChange={e => setWifiEncryption(e.target.value)}
                        className="w-full p-3 rounded-xl bg-surface-container-lowest border border-outline-variant focus:border-primary outline-none"
                      >
                        <option value="WPA">WPA/WPA2/WPA3</option>
                        <option value="WEP">WEP</option>
                        <option value="nopass">Open (No Password)</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2 pt-6">
                      <input
                        type="checkbox"
                        id="wifiHidden"
                        checked={wifiHidden}
                        onChange={e => setWifiHidden(e.target.checked)}
                        className="w-4 h-4 accent-primary rounded cursor-pointer"
                      />
                      <label htmlFor="wifiHidden" className="text-sm cursor-pointer select-none">Hidden Network</label>
                    </div>
                  </div>
                </div>
              )}

              {/* vCard Form */}
              {qrType === 'vcard' && (
                <div className="space-y-4 bg-surface p-6 rounded-2xl border border-outline-variant">
                  <h3 className="font-semibold flex items-center gap-2 text-primary">
                    <User className="w-5 h-5" /> Virtual Contact (vCard)
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider block mb-1">First Name</label>
                      <input
                        type="text"
                        value={vFirstName}
                        onChange={e => setVFirstName(e.target.value)}
                        placeholder="Mojahid"
                        className="w-full p-3 rounded-xl bg-surface-container-lowest border border-outline-variant focus:border-primary outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider block mb-1">Last Name</label>
                      <input
                        type="text"
                        value={vLastName}
                        onChange={e => setVLastName(e.target.value)}
                        placeholder="Hassan"
                        className="w-full p-3 rounded-xl bg-surface-container-lowest border border-outline-variant focus:border-primary outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider block mb-1">Phone Number</label>
                      <input
                        type="tel"
                        value={vPhone}
                        onChange={e => setVPhone(e.target.value)}
                        placeholder="+1 234 567 890"
                        className="w-full p-3 rounded-xl bg-surface-container-lowest border border-outline-variant focus:border-primary outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider block mb-1">Email</label>
                      <input
                        type="email"
                        value={vEmail}
                        onChange={e => setVEmail(e.target.value)}
                        placeholder="hello@example.com"
                        className="w-full p-3 rounded-xl bg-surface-container-lowest border border-outline-variant focus:border-primary outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider block mb-1">Company</label>
                      <input
                        type="text"
                        value={vCompany}
                        onChange={e => setVCompany(e.target.value)}
                        placeholder="DynamQR Labs"
                        className="w-full p-3 rounded-xl bg-surface-container-lowest border border-outline-variant focus:border-primary outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider block mb-1">Job Title</label>
                      <input
                        type="text"
                        value={vTitle}
                        onChange={e => setVTitle(e.target.value)}
                        placeholder="Lead Engineer"
                        className="w-full p-3 rounded-xl bg-surface-container-lowest border border-outline-variant focus:border-primary outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider block mb-1">Website URL</label>
                    <input
                      type="url"
                      value={vWebsite}
                      onChange={e => setVWebsite(e.target.value)}
                      placeholder="https://dynamqr.app"
                      className="w-full p-3 rounded-xl bg-surface-container-lowest border border-outline-variant focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider block mb-1">Address</label>
                    <input
                      type="text"
                      value={vAddress}
                      onChange={e => setVAddress(e.target.value)}
                      placeholder="Silicon Valley, CA"
                      className="w-full p-3 rounded-xl bg-surface-container-lowest border border-outline-variant focus:border-primary outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Email Form */}
              {qrType === 'email' && (
                <div className="space-y-4 bg-surface p-6 rounded-2xl border border-outline-variant">
                  <h3 className="font-semibold flex items-center gap-2 text-primary">
                    <Mail className="w-5 h-5" /> Email Message
                  </h3>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider block mb-1">Recipient Email</label>
                    <input
                      type="email"
                      value={emailTo}
                      onChange={e => setEmailTo(e.target.value)}
                      placeholder="support@example.com"
                      className="w-full p-3 rounded-xl bg-surface-container-lowest border border-outline-variant focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider block mb-1">Subject</label>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={e => setEmailSubject(e.target.value)}
                      placeholder="Inquiry from QR Scan"
                      className="w-full p-3 rounded-xl bg-surface-container-lowest border border-outline-variant focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider block mb-1">Body / Message</label>
                    <textarea
                      rows={3}
                      value={emailBody}
                      onChange={e => setEmailBody(e.target.value)}
                      placeholder="Hello, I would like to get in touch..."
                      className="w-full p-3 rounded-xl bg-surface-container-lowest border border-outline-variant focus:border-primary outline-none"
                    />
                  </div>
                </div>
              )}

              {/* SMS Form */}
              {qrType === 'sms' && (
                <div className="space-y-4 bg-surface p-6 rounded-2xl border border-outline-variant">
                  <h3 className="font-semibold flex items-center gap-2 text-primary">
                    <MessageSquare className="w-5 h-5" /> SMS Text Message
                  </h3>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider block mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={smsPhone}
                      onChange={e => setSmsPhone(e.target.value)}
                      placeholder="+1 234 567 890"
                      className="w-full p-3 rounded-xl bg-surface-container-lowest border border-outline-variant focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider block mb-1">Message Text</label>
                    <textarea
                      rows={3}
                      value={smsMessage}
                      onChange={e => setSmsMessage(e.target.value)}
                      placeholder="Text message to send on scan..."
                      className="w-full p-3 rounded-xl bg-surface-container-lowest border border-outline-variant focus:border-primary outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: DESIGN & AI */}
          {activeTab === 'design' && (
            <div className="space-y-6 animate-in fade-in">
              
              {/* AI Background Generator Section */}
              <div className="bg-gradient-to-r from-primary/10 via-tertiary/10 to-primary/5 p-6 rounded-2xl border border-primary/20 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-primary font-bold">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    <span>AI Background Generator</span>
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-widest bg-primary/20 text-primary px-3 py-1 rounded-full">
                    Next-Gen AI
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant">Generate stunning studio backgrounds for your QR code using natural language prompts.</p>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aiPrompt}
                    onChange={e => setAiPrompt(e.target.value)}
                    placeholder="e.g. Cyberpunk neon grid with glowing violet particles..."
                    className="flex-1 p-3 rounded-xl bg-surface border border-outline-variant text-sm focus:border-primary outline-none"
                  />
                  <Button onClick={() => generateAiBackground()} disabled={isGeneratingAi || !aiPrompt} className="rounded-xl px-5 shrink-0">
                    {isGeneratingAi ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4 mr-2" /> Generate</>}
                  </Button>
                </div>

                {/* Preset Prompt Chips */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {aiPresets.map(preset => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => {
                        setAiPrompt(preset.prompt);
                        generateAiBackground(preset.prompt);
                      }}
                      className="text-xs bg-surface/80 hover:bg-surface border border-outline-variant px-3 py-1.5 rounded-full transition-all text-on-surface"
                    >
                      ✨ {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Background Options Selector */}
              <div>
                <label className="text-sm font-semibold mb-2 block">Background Mode</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'color', label: 'Solid Color' },
                    { id: 'image', label: 'Custom Image' },
                    { id: 'ai', label: 'AI Generated' },
                  ].map(b => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setDesign({...design, bgType: b.id as any})}
                      className={`p-3 rounded-xl border text-xs font-semibold capitalize transition ${
                        design.bgType === b.id ? 'border-primary bg-primary/10 text-primary' : 'border-outline-variant bg-surface text-on-surface-variant'
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Image Upload or Image URL */}
              {design.bgType === 'image' && (
                <div className="space-y-3 bg-surface p-4 rounded-xl border border-outline-variant">
                  <label className="text-xs font-semibold uppercase tracking-wider block">Custom Background Image URL</label>
                  <input
                    type="url"
                    value={design.bgImage}
                    onChange={e => setDesign({...design, bgImage: e.target.value})}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full p-3 rounded-xl bg-surface-container-lowest border border-outline-variant focus:border-primary outline-none text-sm"
                  />
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-on-surface-variant">Or upload local image:</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = ev => {
                            setDesign({...design, bgImage: ev.target?.result as string});
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="text-xs text-on-surface-variant file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:bg-primary/20 file:text-primary hover:file:bg-primary/30 cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {/* Overlay Opacity Slider for Background Images */}
              {(design.bgType === 'image' || design.bgType === 'ai') && (
                <div className="bg-surface p-4 rounded-xl border border-outline-variant space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>QR Contrast Overlay Opacity</span>
                    <span>{Math.round(design.bgOpacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="1"
                    step="0.05"
                    value={design.bgOpacity}
                    onChange={e => setDesign({...design, bgOpacity: parseFloat(e.target.value)})}
                    className="w-full accent-primary cursor-pointer"
                  />
                </div>
              )}

              {/* Pattern Style */}
              <div>
                <label className="text-sm font-semibold mb-2 block">Pattern Style</label>
                <div className="grid grid-cols-4 gap-2">
                  {['square', 'dots', 'rounded', 'classy'].map(s => (
                    <button 
                      key={s} 
                      type="button"
                      onClick={() => setDesign({...design, dotType: s})}
                      className={`py-2.5 rounded-xl text-xs font-semibold capitalize transition ${design.dotType === s ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-variant text-on-surface-variant hover:bg-surface-variant/80'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Pickers */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold mb-2 block uppercase tracking-wider">Pattern Color</label>
                  <input 
                    type="color" 
                    value={design.fgColor} 
                    onChange={e => setDesign({...design, fgColor: e.target.value})}
                    className="w-full h-10 rounded-xl cursor-pointer border border-outline-variant p-1 bg-surface"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-2 block uppercase tracking-wider">Corner Eye Color</label>
                  <input 
                    type="color" 
                    value={design.eyeColor || design.fgColor} 
                    onChange={e => setDesign({...design, eyeColor: e.target.value})}
                    className="w-full h-10 rounded-xl cursor-pointer border border-outline-variant p-1 bg-surface"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-2 block uppercase tracking-wider">Background</label>
                  <input 
                    type="color" 
                    value={design.bgColor} 
                    onChange={e => setDesign({...design, bgColor: e.target.value})}
                    className="w-full h-10 rounded-xl cursor-pointer border border-outline-variant p-1 bg-surface"
                  />
                </div>
              </div>

            </div>
          )}

          {/* TAB: SMART RULES */}
          {activeTab === 'rules' && (
            <div className="space-y-6 animate-in fade-in">
              <p className="text-sm text-on-surface-variant">Redirect users based on their device, operating system, or location.</p>
              
              {smartRules.map((rule, idx) => (
                <div key={idx} className="p-4 bg-surface rounded-xl border border-outline-variant space-y-3">
                  <div className="flex gap-2">
                    <select 
                      value={rule.conditionType}
                      onChange={e => {
                        const newRules = [...smartRules];
                        newRules[idx].conditionType = e.target.value as any;
                        setSmartRules(newRules);
                      }}
                      className="p-2 border rounded-lg bg-surface text-sm flex-1"
                    >
                      <option value="device">Device</option>
                      <option value="os">OS</option>
                      <option value="country">Country</option>
                    </select>
                    <select 
                      value={rule.operator}
                      onChange={e => {
                        const newRules = [...smartRules];
                        newRules[idx].operator = e.target.value as any;
                        setSmartRules(newRules);
                      }}
                      className="p-2 border rounded-lg bg-surface text-sm flex-1"
                    >
                      <option value="equals">Equals</option>
                      <option value="not_equals">Not Equals</option>
                    </select>
                  </div>
                  <input 
                    type="text" 
                    placeholder="e.g. iOS, Mobile, US" 
                    value={rule.value}
                    onChange={e => {
                      const newRules = [...smartRules];
                      newRules[idx].value = e.target.value;
                      setSmartRules(newRules);
                    }}
                    className="w-full p-2 border rounded-lg bg-surface text-sm"
                  />
                  <input 
                    type="url" 
                    placeholder="Redirect URL" 
                    value={rule.destinationUrl}
                    onChange={e => {
                      const newRules = [...smartRules];
                      newRules[idx].destinationUrl = e.target.value;
                      setSmartRules(newRules);
                    }}
                    className="w-full p-2 border rounded-lg bg-surface text-sm"
                  />
                </div>
              ))}

              <Button 
                variant="outline" 
                onClick={() => setSmartRules([...smartRules, { id: Date.now().toString(), conditionType: 'os', operator: 'equals', value: '', destinationUrl: '', priority: smartRules.length }])}
                className="w-full border-dashed"
              >
                + Add Rule
              </Button>
            </div>
          )}

          {/* TAB: SECURITY */}
          {activeTab === 'security' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between p-5 bg-surface rounded-2xl border border-outline-variant">
                <div>
                  <p className="font-semibold flex items-center gap-2">
                    <Lock className="w-4 h-4 text-primary" /> Password Protection
                  </p>
                  <p className="text-xs text-on-surface-variant mt-1">Require a password before opening destination link</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={isPasswordProtected}
                  onChange={e => setIsPasswordProtected(e.target.checked)}
                  className="w-5 h-5 accent-primary cursor-pointer"
                />
              </div>

              {isPasswordProtected && (
                <div className="bg-surface p-6 rounded-2xl border border-outline-variant space-y-3">
                  <label className="text-sm font-semibold block">Set Passcode / Password</label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter security password"
                    className="w-full p-4 rounded-xl bg-surface-container-lowest border border-outline-variant focus:border-primary outline-none"
                  />
                  <p className="text-xs text-on-surface-variant">Visitors scanning this QR code will be prompted for this password before proceeding.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB: SETTINGS & EXPIRATION */}
          {activeTab === 'settings' && (
            <div className="space-y-6 animate-in fade-in">
              <div>
                <label className="text-sm font-semibold mb-2 block">Custom Short Link Keyword</label>
                <div className="flex gap-2 items-center">
                  <span className="text-on-surface-variant bg-surface-variant px-4 py-3 rounded-xl text-sm font-mono">dynamqr.app/</span>
                  <input 
                    type="text" 
                    value={customShortCode}
                    onChange={e => setCustomShortCode(e.target.value)}
                    placeholder="sale2026"
                    className="flex-1 p-3 rounded-xl bg-surface border border-outline-variant focus:border-primary outline-none font-mono text-sm"
                  />
                </div>
              </div>

              <div className="bg-surface p-6 rounded-2xl border border-outline-variant space-y-4">
                <h3 className="font-semibold flex items-center gap-2 text-primary">
                  <Calendar className="w-5 h-5" /> Expiration Options
                </h3>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider mb-2 block">Expiration Date & Time</label>
                  <input 
                    type="datetime-local" 
                    value={expiresAt}
                    onChange={e => setExpiresAt(e.target.value)}
                    className="w-full p-3 rounded-xl bg-surface-container-lowest border border-outline-variant focus:border-primary outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider mb-2 block">Custom Expiration Message</label>
                  <input 
                    type="text" 
                    value={expirationMessage}
                    onChange={e => setExpirationMessage(e.target.value)}
                    placeholder="This promotional QR code has expired."
                    className="w-full p-3 rounded-xl bg-surface-container-lowest border border-outline-variant focus:border-primary outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider mb-2 block">Fallback Redirect URL (Optional)</label>
                  <input 
                    type="url" 
                    value={expirationUrl}
                    onChange={e => setExpirationUrl(e.target.value)}
                    placeholder="https://example.com/expired-landing"
                    className="w-full p-3 rounded-xl bg-surface-container-lowest border border-outline-variant focus:border-primary outline-none text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block">Scan Limit</label>
                <input 
                  type="number" 
                  placeholder="Unlimited scans"
                  value={scanLimit}
                  onChange={e => setScanLimit(e.target.value ? Number(e.target.value) : '')}
                  className="w-full p-3 rounded-xl bg-surface border border-outline-variant focus:border-primary outline-none"
                />
              </div>
            </div>
          )}

          {(activeTab === 'schedule' || activeTab === 'abtest') && (
            <div className="p-8 text-center text-on-surface-variant">
              Configure {activeTab === 'schedule' ? 'Time-based routing' : 'A/B distributions'} here.
            </div>
          )}

        </div>
      </div>

      {/* Right Live Preview Area */}
      <div className="hidden md:flex flex-1 items-center justify-center bg-surface-variant/20 relative p-8">
        <div 
          className="relative p-10 rounded-[2.5rem] shadow-2xl flex flex-col items-center border border-white/10 overflow-hidden min-w-[340px]"
          style={{
            backgroundImage: design.bgType === 'ai' || design.bgType === 'image' ? `url(${design.bgImage})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundColor: design.bgColor
          }}
        >
          {/* Opacity Overlay layer for QR readability */}
          {(design.bgType === 'image' || design.bgType === 'ai') && (
            <div 
              className="absolute inset-0 rounded-[2.5rem]"
              style={{ backgroundColor: design.bgColor, opacity: design.bgOpacity }}
            />
          )}

          <div className="relative z-10 bg-white p-6 rounded-3xl shadow-xl border border-black/5">
            <div ref={previewRef} className="rounded-xl overflow-hidden" />
          </div>

          <p className="relative z-10 mt-6 text-xs font-mono text-white bg-black/60 backdrop-blur-md px-5 py-2 rounded-full border border-white/20 shadow-md">
            dynamqr.app/{customShortCode || 'preview'}
          </p>
        </div>
      </div>
    </div>
  );
}
