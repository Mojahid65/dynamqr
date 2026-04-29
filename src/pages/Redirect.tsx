import React, { useEffect } from 'react';
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
          .select('destination_url')
          .eq('short_code', shortCode)
          .single();

        if (error || !data) {
          console.error("QR Code not found");
          window.location.href = '/';
          return;
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
    <div className="flex h-screen w-full items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto"></div>
        <p className="mt-4 text-gray-600 font-medium">Redirecting...</p>
      </div>
    </div>
  );
}
