import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Redirect() {
  const { shortCode } = useParams();

  useEffect(() => {
    const fetchAndRedirect = async () => {
      if (!shortCode) return;
      
      try {
        const { data, error } = await supabase
          .from('qr_codes')
          .select('id, destination_url')
          .or(`short_code.eq.${shortCode},keyword.eq.${shortCode}`)
          .single();

        if (error || !data) {
          console.error("QR Code not found");
          window.location.href = '/';
          return;
        }

        try {
          const ua = navigator.userAgent;
          let browser = 'Unknown';
          let os = 'Unknown';

          if (ua.indexOf('Firefox') > -1) browser = 'Firefox';
          else if (ua.indexOf('SamsungBrowser') > -1) browser = 'Samsung Browser';
          else if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) browser = 'Opera';
          else if (ua.indexOf('Trident') > -1) browser = 'Internet Explorer';
          else if (ua.indexOf('Edge') > -1 || ua.indexOf('Edg') > -1) browser = 'Edge';
          else if (ua.indexOf('Chrome') > -1) browser = 'Chrome';
          else if (ua.indexOf('Safari') > -1) browser = 'Safari';

          if (ua.indexOf('Windows') > -1) os = 'Windows';
          else if (ua.indexOf('Macintosh') > -1) os = 'macOS';
          else if (ua.indexOf('Android') > -1) os = 'Android';
          else if (ua.indexOf('iPhone') > -1 || ua.indexOf('iPad') > -1) os = 'iOS';
          else if (ua.indexOf('Linux') > -1) os = 'Linux';

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

          await supabase.from('scan_events').insert({
            qr_code_id: data.id,
            user_agent: ua,
            ip: ip,
            country: country,
            city: city,
            browser: browser,
            os: os,
            referrer: document.referrer || 'Direct'
          });
        } catch (insertErr) {
          console.error('Failed to log scan event:', insertErr);
        }

        let url = data.destination_url;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          url = 'https://' + url;
        }
        window.location.href = url;
      } catch (err) {
        console.error(err);
        window.location.href = '/';
      }
    };

    fetchAndRedirect();
  }, [shortCode]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background relative overflow-hidden">
      {/* Expressive blobbes */}
      <div className="absolute top-1/4 left-1/4 w-[30rem] h-[30rem] bg-primary/10 rounded-full blur-[80px]" />
      <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-tertiary/10 rounded-full blur-[80px]" />
      
      <div className="text-center relative z-10 bg-surface-container p-8 rounded-[2rem] shadow-lg border border-outline-variant">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
        <p className="mt-6 text-on-surface font-semibold tracking-tight">Routing safely to destination...</p>
      </div>
    </div>
  );
}
