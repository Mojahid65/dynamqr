import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  QrCode, 
  Smartphone, 
  Trash2, 
  ShieldCheck, 
  Mail, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronLeft,
  X
} from 'lucide-react';

interface Config {
  domain: string;
  supportEmail: string;
  deleteUrl: string;
}

export default function DeleteAccount() {
  const [config, setConfig] = useState<Config>({
    domain: 'mojahidhassan.in',
    supportEmail: 'support@mojahidhassan.in',
    deleteUrl: 'https://mojahidhassan.in/delete-account',
  });

  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // Document Title & Meta Description for Google Play & SEO
    document.title = "Delete Your DynamQR Account - Account & Data Deletion Request";
    
    // Check URL search parameters for configurable domain or email overrides
    const params = new URLSearchParams(window.location.search);
    const domainParam = params.get('domain');
    const emailParam = params.get('email');

    if (domainParam || emailParam) {
      setConfig((prev) => ({
        ...prev,
        domain: domainParam || prev.domain,
        supportEmail: emailParam || (domainParam ? `support@${domainParam}` : prev.supportEmail),
        deleteUrl: domainParam ? `https://${domainParam}/delete-account` : prev.deleteUrl,
      }));
    }
  }, []);

  const steps = [
    { num: 1, text: 'Open the DynamQR mobile app on your smartphone or tablet.' },
    { num: 2, text: 'Sign in to your registered DynamQR account.' },
    { num: 3, text: 'Navigate to Settings / Profile from the menu.' },
    { num: 4, text: 'Select “Delete Account”.' },
    { num: 5, text: 'Confirm the account deletion request when prompted.' },
  ];

  const deletedItems = [
    'DynamQR account information (account credentials and profile data)',
    'Email address associated with the account',
    'User profile information (name, avatar, and settings preferences)',
    'QR codes created and stored in your account history',
    'QR code configuration & routing data associated with the account',
    'Account-related data stored in our primary database',
  ];

  const importantNotes = [
    'Account deletion is permanent and cannot be undone once completed.',
    'Deleting an account removes the associated account data according to DynamQR\'s data retention practices.',
    'Users should export or save any dynamic QR code configurations or analytics they need before requesting deletion.',
  ];

  const handleDeleteClick = (e: React.MouseEvent) => {
    if (config.deleteUrl.includes('YOURDOMAIN.com') || window.location.pathname.includes('delete-account')) {
      e.preventDefault();
      setIsModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col antialiased">
      {/* Top Header Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <QrCode className="w-5 h-5" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
              DynamQR
            </span>
          </Link>
          <Link
            to="/support"
            className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Support
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-8 sm:py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-6">
          
          {/* Hero Header Card */}
          <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
              <ShieldCheck className="w-3.5 h-3.5" />
              Google Play Verified Policy
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
              Delete Your DynamQR Account
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed">
              Request deletion of your DynamQR account and associated data.
            </p>
          </section>

          {/* How to Delete Your Account */}
          <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">How to Delete Your Account</h2>
            </div>
            <ol className="space-y-3">
              {steps.map((step) => (
                <li
                  key={step.num}
                  className="flex items-start gap-3.5 p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl"
                >
                  <span className="w-7 h-7 rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                    {step.num}
                  </span>
                  <span className="text-sm sm:text-base font-medium text-slate-800 pt-0.5">
                    {step.text}
                  </span>
                </li>
              ))}
            </ol>
          </section>

          {/* What Will Be Deleted */}
          <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">What Will Be Deleted</h2>
            </div>
            <p className="text-slate-600 text-sm sm:text-base mb-4">
              When your account deletion request is processed, the following personal data and records associated with your profile will be permanently purged:
            </p>
            <ul className="space-y-3">
              {deletedItems.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm sm:text-base text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* What May Be Retained */}
          <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">What May Be Retained</h2>
            </div>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-3">
              Certain information may be retained temporarily when necessary for security, fraud prevention, legal compliance, dispute resolution, or fulfilling mandatory legal obligations.
            </p>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Any retained information will strictly be kept only for as long as necessary to satisfy the specific legal or security purpose, after which it will be permanently deleted from our archives.
            </p>
          </section>

          {/* If You Cannot Access Your Account */}
          <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">If You Cannot Access Your Account</h2>
            </div>
            <p className="text-slate-600 text-sm sm:text-base mb-4 leading-relaxed">
              If you cannot access your account or have lost your device, you can contact DynamQR support to request account deletion directly:
            </p>
            <div className="bg-indigo-50/80 border border-indigo-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="block text-xs font-semibold text-indigo-900 uppercase tracking-wide mb-1">
                  Support Email Address
                </span>
                <a
                  href={`mailto:${config.supportEmail}?subject=${encodeURIComponent('DynamQR Account Deletion Request')}`}
                  className="inline-flex items-center gap-2 text-indigo-700 hover:text-indigo-900 font-mono font-bold text-base sm:text-lg underline underline-offset-2"
                >
                  <Mail className="w-5 h-5" />
                  {config.supportEmail}
                </a>
              </div>
              <a
                href={`mailto:${config.supportEmail}?subject=${encodeURIComponent('DynamQR Account Deletion Request')}`}
                className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg transition-colors shadow-xs"
              >
                Send Request Email
              </a>
            </div>
          </section>

          {/* Important Information */}
          <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Important Information</h2>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 sm:p-5">
              <ul className="space-y-3">
                {importantNotes.map((note, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm sm:text-base text-amber-950 font-medium">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-1" />
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Prominent Delete Account Button */}
          <section className="bg-white border-2 border-indigo-200 rounded-2xl p-6 sm:p-8 text-center shadow-md">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Ready to Request Account Deletion?</h3>
            <p className="text-slate-600 text-sm sm:text-base max-w-lg mx-auto mb-6">
              Click below to initiate your account deletion request. You will be prompted with direct action steps.
            </p>
            <a
              href={config.deleteUrl}
              onClick={handleDeleteClick}
              className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white font-bold text-base rounded-xl transition-all shadow-lg shadow-red-600/25 w-full sm:w-auto"
            >
              <Trash2 className="w-5 h-5" />
              Delete Account
            </a>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 mt-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} DynamQR. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <Link to="/privacy" className="hover:text-indigo-600 transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-indigo-600 transition-colors">
              Terms of Service
            </Link>
            <Link to="/support" className="hover:text-indigo-600 transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </footer>

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-red-600 flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                Confirm Account Deletion Request
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              To delete your account, please open the DynamQR app and select <strong>Settings &gt; Delete Account</strong>, or send a deletion request email to:
              <br />
              <strong className="text-indigo-600 font-mono block mt-2">{config.supportEmail}</strong>
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-lg transition-colors"
              >
                Cancel
              </button>
              <a
                href={`mailto:${config.supportEmail}?subject=${encodeURIComponent('DynamQR Account Deletion Request')}`}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm rounded-lg transition-colors"
              >
                Send Request Email
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
