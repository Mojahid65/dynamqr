import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, QrCode } from 'lucide-react';

/**
 * Shared chrome for legal/policy pages.
 *
 * Why a dedicated layout?
 * Google Play requires policy URLs to be reachable, public, and stable.
 * Centralising the navbar + footer here keeps every legal page consistent
 * and makes future tweaks (e.g. updating the support email) a one-file
 * change instead of editing five pages.
 */
interface LegalLayoutProps {
  title: string;
  /** ISO date string, e.g. '2026-05-29'. Rendered as "Last updated:". */
  lastUpdated: string;
  children: ReactNode;
}

const LegalLayout = ({ title, lastUpdated, children }: LegalLayoutProps) => {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[128px]" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-violet-500/10 rounded-full blur-[128px]" />
      </div>

      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5 border-b border-white/5 backdrop-blur-sm">
        <Link to="/landing" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <QrCode className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight group-hover:text-indigo-300 transition-colors">
            DynamQR
          </span>
        </Link>
        <Link
          to="/landing"
          className="flex items-center gap-1.5 text-sm font-medium text-slate-300 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Home
        </Link>
      </nav>

      <main className="relative z-10 max-w-3xl mx-auto px-6 md:px-8 py-12 md:py-16">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3">
          {title}
        </h1>
        <p className="text-sm text-slate-500 mb-10">
          Last updated:{' '}
          {new Date(lastUpdated).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
        <article className="space-y-6 text-slate-300 leading-relaxed [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-white [&_h2]:mt-12 [&_h2]:mb-4 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-white [&_h3]:mt-8 [&_h3]:mb-3 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-2 [&_li]:leading-relaxed [&_a]:text-indigo-400 [&_a:hover]:underline [&_strong]:text-white [&_code]:bg-white/10 [&_code]:rounded [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-sm">
          {children}
        </article>
      </main>

      <footer className="relative z-10 border-t border-white/5 py-10 mt-16">
        <div className="max-w-3xl mx-auto px-6 md:px-8">
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400 mb-6">
            <Link to="/privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
            <Link
              to="/data-deletion"
              className="hover:text-white transition-colors"
            >
              Data Deletion
            </Link>
            <Link to="/support" className="hover:text-white transition-colors">
              Support
            </Link>
            <Link to="/about" className="hover:text-white transition-colors">
              About
            </Link>
          </div>
          <div className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} DynamQR. A MOJAHIDX product.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LegalLayout;
