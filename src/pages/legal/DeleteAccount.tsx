import { useState } from 'react';
import LegalLayout from './LegalLayout';
import { 
  Smartphone, 
  Trash2, 
  ShieldCheck, 
  Mail, 
  AlertTriangle, 
  CheckCircle2, 
  X
} from 'lucide-react';

export default function DeleteAccount() {
  const supportEmail = 'support@mojahidhassan.in';
  const backupEmail = 'hello@mojahidhassan.in';
  const [isModalOpen, setIsModalOpen] = useState(false);

  const steps = [
    { num: 1, title: 'Open DynamQR App', desc: 'Launch the DynamQR app on your mobile device.' },
    { num: 2, title: 'Sign In', desc: 'Sign in to your registered DynamQR account.' },
    { num: 3, title: 'Open Settings / Profile', desc: 'Navigate to the Account Settings or Profile screen from the side menu or dashboard.' },
    { num: 4, title: 'Select Delete Account', desc: 'Tap the “Delete Account” button at the bottom of the settings menu.' },
    { num: 5, title: 'Confirm Deletion Request', desc: 'Review the warning and confirm your account deletion request.' },
  ];

  const deletedItems = [
    'DynamQR account information (account credentials and profile data)',
    'Email address associated with the account',
    'User profile information (name, avatar, and settings preferences)',
    'QR codes created and stored in your account history',
    'QR code configuration & routing data associated with the account',
    'Account-related data stored in our primary database',
  ];

  return (
    <LegalLayout title="Delete Your DynamQR Account" lastUpdated="2026-09-10">
      <p className="text-lg text-slate-300 leading-relaxed mb-6">
        Request deletion of your <strong>DynamQR</strong> account and associated data. This page provides clear instructions on how to request account deletion in accordance with Google Play Console and App Store data safety policies.
      </p>

      {/* Google Play Verified Callout Banner */}
      <div className="flex items-center gap-2.5 p-4 rounded-xl bg-violet-950/40 border border-violet-500/30 text-violet-200 text-sm font-medium mb-10">
        <ShieldCheck className="w-5 h-5 text-violet-400 shrink-0" />
        <span>Official Google Play Console Compliant Data & Account Deletion Policy</span>
      </div>

      {/* How to Delete Your Account Section */}
      <section className="my-8">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
            <Smartphone className="w-4 h-4" />
          </div>
          How to Delete Your Account
        </h2>
        <p className="text-slate-300 mb-6">
          Follow these 5 simple steps inside the DynamQR app to request deletion of your account:
        </p>
        <div className="space-y-3.5">
          {steps.map((step) => (
            <div
              key={step.num}
              className="flex items-start gap-4 p-4 rounded-xl bg-slate-900/60 border border-white/10 hover:border-violet-500/30 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-md">
                {step.num}
              </div>
              <div>
                <h3 className="text-base font-semibold text-white mt-0 mb-1">{step.title}</h3>
                <p className="text-sm text-slate-400 m-0">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* What Will Be Deleted Section */}
      <section className="my-10">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
            <Trash2 className="w-4 h-4" />
          </div>
          What Will Be Deleted
        </h2>
        <p className="text-slate-300 mb-4">
          When your account deletion request is completed, the following data associated with your DynamQR account will be permanently purged:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {deletedItems.map((item, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/40 border border-white/5 text-sm text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* What May Be Retained Section */}
      <section className="my-10">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          What May Be Retained
        </h2>
        <p className="text-slate-300 leading-relaxed mb-3">
          Certain information may be retained temporarily when necessary for security, fraud prevention, legal compliance, dispute resolution, or fulfilling mandatory regulatory obligations.
        </p>
        <p className="text-slate-300 leading-relaxed">
          Any retained information will strictly be kept only for as long as necessary to satisfy the specific legal or security purpose, after which it will be permanently deleted from our archives.
        </p>
      </section>

      {/* If You Cannot Access Your Account Section */}
      <section className="my-10">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
            <Mail className="w-4 h-4" />
          </div>
          If You Cannot Access Your Account
        </h2>
        <p className="text-slate-300 mb-4">
          If you have lost access to your device, forgotten your password, or cannot sign in to the DynamQR app, you can contact DynamQR support to request account deletion directly:
        </p>
        
        <div className="p-5 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="block text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-1">
              Contact Support Email
            </span>
            <a 
              href={`mailto:${supportEmail}?subject=DynamQR%20Account%20Deletion%20Request`}
              className="text-lg font-mono font-bold text-indigo-300 hover:text-indigo-200 underline decoration-indigo-400/50"
            >
              {supportEmail}
            </a>
            <span className="block text-xs text-slate-400 mt-1">
              Alternative support: <a href={`mailto:${backupEmail}`} className="text-slate-300 hover:underline">{backupEmail}</a>
            </span>
          </div>
          <a
            href={`mailto:${supportEmail}?subject=DynamQR%20Account%20Deletion%20Request`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors shadow-lg shadow-indigo-600/20 shrink-0"
          >
            <Mail className="w-4 h-4" />
            Send Email Request
          </a>
        </div>
      </section>

      {/* Important Information Section */}
      <section className="my-10">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          Important Information
        </h2>
        <div className="p-5 rounded-2xl bg-amber-950/30 border border-amber-500/30 space-y-3">
          <div className="flex items-start gap-3 text-sm text-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span><strong>Account deletion is permanent and cannot be undone.</strong> Once deleted, created dynamic QR codes will stop resolving.</span>
          </div>
          <div className="flex items-start gap-3 text-sm text-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>Deleting an account removes the associated account data according to DynamQR's data retention practices.</span>
          </div>
          <div className="flex items-start gap-3 text-sm text-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>Users should export or save any dynamic QR configurations or scan analytics they need before deleting their account.</span>
          </div>
        </div>
      </section>

      {/* Prominent Action Button Card */}
      <section className="my-12 p-8 rounded-3xl bg-slate-900/90 border border-red-500/30 text-center shadow-2xl">
        <h3 className="text-xl font-bold text-white mb-2">Ready to Request Account Deletion?</h3>
        <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
          Click below to initiate your account deletion request or contact support directly.
        </p>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-red-600 hover:bg-red-500 active:scale-[0.99] text-white font-bold text-base transition-all shadow-lg shadow-red-600/30 cursor-pointer"
        >
          <Trash2 className="w-5 h-5" />
          Delete Account
        </button>
      </section>

      {/* Confirmation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-white/10 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-red-400 flex items-center gap-2 mb-3">
              <Trash2 className="w-5 h-5" />
              Confirm Account Deletion Request
            </h3>
            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
              To delete your account, open the DynamQR app and select <strong>Settings &gt; Delete Account</strong>, or send an email request from your registered email address to:
              <br />
              <strong className="text-indigo-400 font-mono block mt-2">{supportEmail}</strong>
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm rounded-lg transition-colors"
              >
                Cancel
              </button>
              <a
                href={`mailto:${supportEmail}?subject=${encodeURIComponent('DynamQR Account Deletion Request')}`}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold text-sm rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Mail className="w-4 h-4" />
                Send Email
              </a>
            </div>
          </div>
        </div>
      )}
    </LegalLayout>
  );
}
