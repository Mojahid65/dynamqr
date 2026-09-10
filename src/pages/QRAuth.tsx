import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { Lock } from 'lucide-react';

export default function QRAuth() {
  const { shortCode } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    
    setLoading(true);
    setError('');

    try {
      // In a real app, this should ideally be an edge function to avoid exposing the hash, 
      // but to preserve the existing architecture, we'll verify it client-side.
      const { data, error: fetchError } = await supabase
        .from('qr_codes')
        .select('id, password_hash')
        .or(`short_code.eq.${shortCode},keyword.eq.${shortCode}`)
        .single();

      if (fetchError || !data) {
        setError('QR Code not found.');
        setLoading(false);
        return;
      }

      if (!data.password_hash) {
        sessionStorage.setItem(`qr_auth_${data.id}`, 'true');
        navigate(`/${shortCode}`);
        return;
      }

      const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      if (hashHex === data.password_hash) {
        sessionStorage.setItem(`qr_auth_${data.id}`, 'true');
        navigate(`/${shortCode}`); // Redirect back to original route to proceed
      } else {
        setError('Incorrect password. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred.');
    }
    
    setLoading(false);
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background relative overflow-hidden px-4">
      <div className="absolute top-1/4 left-1/4 w-[30rem] h-[30rem] bg-primary/10 rounded-full blur-[80px]" />
      <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-tertiary/10 rounded-full blur-[80px]" />
      
      <div className="relative z-10 bg-surface-container p-8 rounded-[2rem] shadow-lg border border-outline-variant max-w-sm w-full">
        <div className="mx-auto w-16 h-16 bg-primary-container rounded-full flex items-center justify-center mb-6">
          <Lock className="w-8 h-8 text-on-primary-container" />
        </div>
        
        <h2 className="text-2xl font-bold text-center text-foreground mb-2">Protected QR</h2>
        <p className="text-center text-on-surface-variant mb-6 text-sm">
          This QR code is password protected. Enter the password to continue.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-surface rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>
          
          {error && <p className="text-error text-sm text-center">{error}</p>}

          <Button 
            type="submit" 
            className="w-full rounded-xl py-6 font-medium text-lg"
            disabled={loading || !password}
          >
            {loading ? 'Verifying...' : 'Continue'}
          </Button>
        </form>
      </div>
    </div>
  );
}
