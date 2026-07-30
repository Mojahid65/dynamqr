import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { QrCode, Mail, Lock, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* M3 Expressive Background Blobs */}
      <div className="absolute top-0 left-1/4 w-[40rem] h-[40rem] bg-primary/20 rounded-full blur-[100px] -z-10 mix-blend-screen" />
      <div className="absolute bottom-0 right-1/4 w-[35rem] h-[35rem] bg-tertiary/20 rounded-full blur-[100px] -z-10 mix-blend-screen" />
      
      <div className="w-full max-w-md bg-surface-container rounded-[2rem] p-8 md:p-10 shadow-lg relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-primary-container text-on-primary-container p-4 rounded-3xl mb-6">
            <QrCode className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-3 text-center tracking-tight">Welcome Back</h1>
          <p className="text-on-surface-variant text-center text-base">Sign in to manage your dynamic QR codes</p>
        </div>

        {error && (
          <div className="bg-error-container text-on-error-container p-4 rounded-2xl mb-6 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-on-surface ml-1">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-on-surface-variant" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-surface-container-highest border-b-2 border-outline focus:border-primary rounded-t-xl rounded-b-none focus:outline-none text-foreground placeholder-on-surface-variant/50 transition-colors"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-on-surface ml-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-on-surface-variant" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-surface-container-highest border-b-2 border-outline focus:border-primary rounded-t-xl rounded-b-none focus:outline-none text-foreground placeholder-on-surface-variant/50 transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full mt-2 group"
            size="lg"
          >
            <span>{loading ? 'Signing In...' : 'Sign In'}</span>
            {!loading && <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-on-surface-variant text-sm">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary hover:text-primary/80 font-medium transition-colors">
              Create one now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

