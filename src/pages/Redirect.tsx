import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Wifi, Phone, Mail, Globe, MapPin, Copy, Check, Download, CalendarX } from 'lucide-react';

export default function Redirect() {
  const { shortCode } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('Routing safely to destination...');
  const [isError, setIsError] = useState(false);
  const [qrData, setQrData] = useState<any>(null);
  const [copiedPass, setCopiedPass] = useState(false);

  useEffect(() => {
    const fetchAndRedirect = async () => {
      if (!shortCode) return;
      
      try {
        // 1. Fetch QR Code
        const { data, error } = await supabase
          .from('qr_codes')
          .select('*')
          .or(`short_code.eq.${shortCode},keyword.eq.${shortCode}`)
          .single();

        if (error || !data) {
          setStatusMessage("QR Code not found");
          setIsError(true);
          setLoading(false);
          setTimeout(() => navigate('/'), 2500);
          return;
        }

        // 2. Scan Limit Check
        if (data.scan_limit !== null) {
          const { count } = await supabase
            .from('scan_events')
            .select('*', { count: 'exact', head: true })
            .eq('qr_code_id', data.id);
            
          if (count !== null && count >= data.scan_limit) {
            setStatusMessage("This QR code has reached its scan limit.");
            setIsError(true);
            setLoading(false);
            return;
          }
        }

        // 3. Password Protection
        if (data.is_password_protected) {
          if (sessionStorage.getItem(`qr_auth_${data.id}`) !== 'true') {
            navigate(`/qr-auth/${data.short_code}`);
            return;
          }
        }

        // 4. Expiration Check
        if (data.expires_at) {
          if (new Date() > new Date(data.expires_at)) {
            if (data.expiration_url) {
               window.location.href = data.expiration_url;
               return;
            }
            setStatusMessage(data.expiration_message || "This QR code has expired.");
            setIsError(true);
            setLoading(false);
            return;
          }
        }

        setQrData(data);

        // --- Log Scan Event in background ---
        const ua = navigator.userAgent;
        let browser = 'Unknown';
        let os = 'Unknown';

        if (ua.indexOf('Firefox') > -1) browser = 'Firefox';
        else if (ua.indexOf('Chrome') > -1) browser = 'Chrome';
        else if (ua.indexOf('Safari') > -1) browser = 'Safari';

        if (ua.indexOf('Windows') > -1) os = 'Windows';
        else if (ua.indexOf('Macintosh') > -1) os = 'macOS';
        else if (ua.indexOf('Android') > -1) os = 'Android';
        else if (ua.indexOf('iPhone') > -1 || ua.indexOf('iPad') > -1) os = 'iOS';

        let ip = null;
        let country = 'Unknown';
        let city = 'Unknown';

        try {
          const geoRes = await fetch('https://freeipapi.com/api/json');
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            ip = geoData.ipAddress || null;
            country = geoData.countryName || 'Unknown';
            city = geoData.cityName || 'Unknown';
          }
        } catch (geoErr) {
          console.error('Geo IP failed:', geoErr);
        }

        try {
          await supabase.from('scan_events').insert({
            qr_code_id: data.id,
            user_agent: ua,
            ip: ip,
            country: country,
            city: city,
            browser: browser,
            os: os,
            referrer: document.referrer || 'Direct',
            scan_type: 'normal'
          });
        } catch (insertErr) {
          console.error('Failed to log scan:', insertErr);
        }

        // 5. Handle Content Types
        const qrType = data.qr_type || 'url';
        let targetUrl = data.destination_url;

        // Smart Rules & Schedules override
        if (data.schedules && Array.isArray(data.schedules) && data.schedules.length > 0) {
          const now = new Date();
          for (const s of data.schedules) {
            if (s.isEnabled && now >= new Date(s.startDate) && now <= new Date(s.endDate)) {
              targetUrl = s.destinationUrl;
              break;
            }
          }
        }

        if (qrType === 'url') {
          if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
            targetUrl = 'https://' + targetUrl;
          }
          window.location.href = targetUrl;
        } else {
          // WiFi or vCard or Email -> Render interactive UI card on this page
          setLoading(false);
        }
        
      } catch (err) {
        console.error(err);
        setStatusMessage('An error occurred.');
        setIsError(true);
        setLoading(false);
        setTimeout(() => navigate('/'), 2500);
      }
    };

    fetchAndRedirect();
  }, [shortCode, navigate]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPass(true);
    setTimeout(() => setCopiedPass(false), 2000);
  };

  const downloadVCard = () => {
    if (!qrData) return;
    const vcardStr = qrData.destination_url;
    const blob = new Blob([vcardStr], { type: 'text/vcard;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const name = qrData.type_data?.firstName ? `${qrData.type_data.firstName}_${qrData.type_data.lastName}` : 'contact';
    link.setAttribute('download', `${name}.vcf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[30rem] h-[30rem] bg-primary/10 rounded-full blur-[80px]" />
        <div className="text-center relative z-10 bg-surface p-8 rounded-[2rem] shadow-lg border border-outline-variant max-w-sm w-full mx-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-6 text-on-surface font-semibold tracking-tight">{statusMessage}</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background relative overflow-hidden px-4">
        <div className="text-center relative z-10 bg-surface p-8 rounded-[2rem] shadow-xl border border-outline-variant max-w-md w-full">
          <div className="h-16 w-16 bg-error-container rounded-full flex items-center justify-center mx-auto mb-4 text-error">
            <CalendarX className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold mb-2 text-foreground">Notice</h2>
          <p className="text-on-surface-variant font-medium">{statusMessage}</p>
        </div>
      </div>
    );
  }

  const typeData = qrData?.type_data || {};
  const qrType = qrData?.qr_type || 'url';

  return (
    <div className="min-h-screen w-full bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-[30rem] h-[30rem] bg-primary/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-tertiary/10 rounded-full blur-[100px]" />

      {/* Wi-Fi Landing View */}
      {qrType === 'wifi' && (
        <div className="relative z-10 bg-surface p-8 rounded-[2.5rem] shadow-2xl border border-outline-variant max-w-md w-full text-center space-y-6">
          <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-2">
            <Wifi className="w-10 h-10" />
          </div>
          
          <div>
            <span className="text-xs uppercase font-bold tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">Wi-Fi Network</span>
            <h2 className="text-2xl font-bold mt-3 text-foreground">{typeData.ssid || 'Wi-Fi Network'}</h2>
            <p className="text-sm text-on-surface-variant mt-1">Security: {typeData.encryption || 'WPA/WPA2'}</p>
          </div>

          {typeData.password && (
            <div className="bg-surface-variant/40 p-4 rounded-2xl border border-outline-variant flex items-center justify-between">
              <div className="text-left">
                <p className="text-[10px] uppercase font-semibold text-on-surface-variant">Password</p>
                <p className="font-mono text-base font-bold text-foreground mt-0.5">{typeData.password}</p>
              </div>
              <button
                onClick={() => copyToClipboard(typeData.password)}
                className="flex items-center gap-1 text-xs font-semibold bg-primary text-on-primary px-4 py-2 rounded-xl hover:bg-primary/90 transition shadow-sm"
              >
                {copiedPass ? <><Check className="w-4 h-4" /> Copied</> : <><Copy className="w-4 h-4" /> Copy</>}
              </button>
            </div>
          )}

          <div className="pt-2">
            <a
              href={`WIFI:S:${typeData.ssid};T:${typeData.encryption || 'WPA'};P:${typeData.password || ''};;`}
              className="w-full py-4 bg-primary text-on-primary rounded-xl font-bold text-center block shadow-lg hover:bg-primary/90 transition"
            >
              Connect to Wi-Fi
            </a>
          </div>
        </div>
      )}

      {/* vCard Digital Business Card View */}
      {qrType === 'vcard' && (
        <div className="relative z-10 bg-surface p-8 rounded-[2.5rem] shadow-2xl border border-outline-variant max-w-md w-full text-center space-y-6">
          <div className="mx-auto w-24 h-24 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center text-3xl font-bold shadow-md">
            {typeData.firstName ? typeData.firstName[0] : 'C'}
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground">{typeData.firstName} {typeData.lastName}</h2>
            {typeData.title && <p className="text-sm font-medium text-primary mt-1">{typeData.title}</p>}
            {typeData.company && <p className="text-xs text-on-surface-variant">{typeData.company}</p>}
          </div>

          <div className="space-y-3 text-left bg-surface-variant/30 p-5 rounded-2xl border border-outline-variant text-sm">
            {typeData.phone && (
              <a href={`tel:${typeData.phone}`} className="flex items-center gap-3 text-on-surface hover:text-primary transition">
                <Phone className="w-4 h-4 text-primary shrink-0" />
                <span>{typeData.phone}</span>
              </a>
            )}
            {typeData.email && (
              <a href={`mailto:${typeData.email}`} className="flex items-center gap-3 text-on-surface hover:text-primary transition">
                <Mail className="w-4 h-4 text-primary shrink-0" />
                <span className="truncate">{typeData.email}</span>
              </a>
            )}
            {typeData.website && (
              <a href={typeData.website.startsWith('http') ? typeData.website : `https://${typeData.website}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-on-surface hover:text-primary transition">
                <Globe className="w-4 h-4 text-primary shrink-0" />
                <span className="truncate">{typeData.website}</span>
              </a>
            )}
            {typeData.address && (
              <div className="flex items-center gap-3 text-on-surface">
                <MapPin className="w-4 h-4 text-primary shrink-0" />
                <span>{typeData.address}</span>
              </div>
            )}
          </div>

          <button
            onClick={downloadVCard}
            className="w-full py-4 bg-primary text-on-primary rounded-xl font-bold shadow-lg hover:bg-primary/90 transition flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" /> Save Contact (.vcf)
          </button>
        </div>
      )}

      {/* Email View */}
      {qrType === 'email' && (
        <div className="relative z-10 bg-surface p-8 rounded-[2.5rem] shadow-2xl border border-outline-variant max-w-md w-full text-center space-y-6">
          <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary">
            <Mail className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Send Email</h2>
            <p className="text-sm text-on-surface-variant mt-1">To: {typeData.email}</p>
          </div>
          <a
            href={qrData.destination_url}
            className="w-full py-4 bg-primary text-on-primary rounded-xl font-bold shadow-lg block hover:bg-primary/90 transition"
          >
            Open Mail App
          </a>
        </div>
      )}
    </div>
  );
}
