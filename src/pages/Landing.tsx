import { Link } from 'react-router-dom';
import { QrCode, Smartphone, Palette, Bell, Shield, Zap, Download, ArrowRight, Scan, Sun, Moon, RefreshCw } from 'lucide-react';

const APK_LINK = 'https://github.com/Mojahid65/dynamqr/releases/latest/download/app-release.apk';

const features = [
  { icon: <QrCode className="w-7 h-7" />, title: 'Dynamic QR Codes', desc: 'Create QR codes whose destination URL can be changed anytime — without reprinting.' },
  { icon: <Palette className="w-7 h-7" />, title: '5 Visual Themes', desc: 'Classic, Rounded, Thin, Smooth & Circles — plus custom module and eye color pickers.' },
  { icon: <Scan className="w-7 h-7" />, title: 'Built-in Scanner', desc: 'Scan QR codes with your camera or import from gallery. Animated laser overlay & torch support.' },
  { icon: <Download className="w-7 h-7" />, title: 'High-Res Export', desc: 'Export QR codes at 4096×4096px print-ready quality directly to your gallery.' },
  { icon: <Bell className="w-7 h-7" />, title: 'Push Notifications', desc: 'Receive instant announcements, updates and rich media notifications via Firebase.' },
  { icon: <RefreshCw className="w-7 h-7" />, title: 'In-App Updates', desc: 'Get notified of new versions with mandatory or optional update prompts inside the app.' },
  { icon: <Shield className="w-7 h-7" />, title: 'Secure & Private', desc: 'Per-user data isolation. Your QR codes are visible only to you. Supabase-powered auth.' },
  { icon: <Zap className="w-7 h-7" />, title: 'Instant Redirects', desc: 'Lightning-fast 302 redirects. Your QR codes resolve in milliseconds globally.' },
  { icon: <Smartphone className="w-7 h-7" />, title: 'Cross-Platform', desc: 'Full-featured web dashboard plus a native Android app with AMOLED dark mode.' },
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden">
      {/* Ambient glow effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-indigo-500/15 rounded-full blur-[128px]"></div>
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-violet-500/15 rounded-full blur-[128px]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px]"></div>
      </div>

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5 border-b border-white/5 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <QrCode className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">DynamQR</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="px-5 py-2.5 text-sm font-medium text-slate-300 hover:text-white transition-colors">
            Log in
          </Link>
          <Link to="/register" className="px-5 py-2.5 text-sm font-semibold bg-white text-slate-900 rounded-xl hover:bg-slate-100 transition-colors shadow-lg shadow-white/10">
            Sign up free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full bg-white/5 border border-white/10 text-sm text-slate-300 backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Version 1.3.0 — Push Notifications are here
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6">
          QR Codes That
          <span className="block bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
            Evolve With You
          </span>
        </h1>
        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Create dynamic QR codes you can update anytime. Customize themes & colors,
          scan codes on the go, and manage everything from web or mobile.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href={APK_LINK}
            className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-2xl font-semibold text-lg shadow-xl shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 hover:scale-[1.02]"
          >
            <Download className="w-5 h-5" />
            Download APK
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </a>
          <Link
            to="/register"
            className="flex items-center gap-2 px-8 py-4 bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl font-semibold text-lg backdrop-blur-sm transition-all hover:scale-[1.02]"
          >
            Try Web Dashboard
          </Link>
        </div>
        <p className="mt-4 text-xs text-slate-500">Android • Free • No ads</p>
      </section>

      {/* Stats bar */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-3 gap-6 p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
          {[
            ['40+', 'Features'],
            ['5', 'QR Themes'],
            ['4K', 'Export Quality'],
          ].map(([num, label]) => (
            <div key={label} className="text-center">
              <div className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">{num}</div>
              <div className="text-sm text-slate-400 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
            Everything you need,
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent"> built-in</span>
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            From creation to customization, scanning to sharing — DynamQR is the only QR platform you'll ever need.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <div
              key={i}
              className="group p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-indigo-500/30 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-110 transition-transform">
                {f.icon}
              </div>
              <h3 className="text-lg font-bold mb-2">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Dark Mode showcase */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-24">
        <div className="rounded-3xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.08] p-10 md:p-14 flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <Sun className="w-6 h-6 text-amber-400" />
              <Moon className="w-6 h-6 text-indigo-400" />
            </div>
            <h3 className="text-2xl md:text-3xl font-extrabold mb-4">Light & AMOLED Dark Mode</h3>
            <p className="text-slate-400 leading-relaxed mb-6">
              Switch between a clean light theme and a true-black AMOLED dark mode that saves battery and looks stunning. Your eyes will thank you.
            </p>
            <a
              href={APK_LINK}
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold transition-colors"
            >
              <Download className="w-4 h-4" /> Get the App
            </a>
          </div>
          <div className="flex gap-4">
            <div className="w-36 h-64 rounded-2xl bg-white shadow-xl flex flex-col items-center justify-center gap-3 p-4">
              <QrCode className="w-12 h-12 text-indigo-600" />
              <div className="w-full h-2 bg-slate-200 rounded-full"></div>
              <div className="w-3/4 h-2 bg-slate-200 rounded-full"></div>
              <div className="text-[10px] text-slate-500 font-medium mt-1">Light</div>
            </div>
            <div className="w-36 h-64 rounded-2xl bg-black border border-white/10 shadow-xl flex flex-col items-center justify-center gap-3 p-4">
              <QrCode className="w-12 h-12 text-indigo-400" />
              <div className="w-full h-2 bg-white/10 rounded-full"></div>
              <div className="w-3/4 h-2 bg-white/10 rounded-full"></div>
              <div className="text-[10px] text-slate-400 font-medium mt-1">AMOLED Dark</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-3xl mx-auto px-6 pb-24 text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
          Ready to create smarter QR codes?
        </h2>
        <p className="text-slate-400 mb-8 max-w-lg mx-auto">
          Join DynamQR today. It's free, ad-free, and built for professionals.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href={APK_LINK}
            className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-2xl font-semibold text-lg shadow-xl shadow-indigo-500/25 transition-all hover:scale-[1.02]"
          >
            <Download className="w-5 h-5" /> Download for Android
          </a>
          <Link
            to="/register"
            className="flex items-center gap-2 px-8 py-4 bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl font-semibold text-lg transition-all hover:scale-[1.02]"
          >
            Open Web App <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8 text-center text-sm text-slate-500">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <QrCode className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-semibold text-slate-400">DynamQR</span>
        </div>
        &copy; {new Date().getFullYear()} DynamQR. Built by Mojahid.
      </footer>
    </div>
  );
};

export default Landing;
