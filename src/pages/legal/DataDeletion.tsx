import LegalLayout from './LegalLayout';

const DataDeletion = () => {
  return (
    <LegalLayout title="Account & Data Deletion" lastUpdated="2026-05-29">
      <p>
        This page explains how to permanently delete your DynamQR account
        and all associated data. Google Play Console and the App Store
        require this URL to be public, so you can also share it directly
        with anyone who needs it.
      </p>

      <h2>What gets deleted</h2>
      <ul>
        <li>Your account profile and login credentials.</li>
        <li>All QR codes and dynamic short links you created.</li>
        <li>All scan analytics events linked to your QR codes.</li>
        <li>Device tokens used for push notifications.</li>
        <li>Saved style preferences and other in-app settings.</li>
      </ul>
      <p>
        Once deletion completes, your QR codes will stop resolving and any
        printed copies will no longer work.
      </p>

      <h2>What may be retained</h2>
      <ul>
        <li>
          Anonymous, aggregated analytics that cannot be traced back to you.
        </li>
        <li>
          Records that we are legally required to keep (for example, fraud
          and security logs).
        </li>
        <li>
          Encrypted backups, which are rotated and overwritten on a rolling
          schedule. Residual copies in backups are purged within 30 days.
        </li>
      </ul>

      <h2>Method 1 — Delete from inside the app (recommended)</h2>
      <ol>
        <li>Open DynamQR on your Android device.</li>
        <li>Open the side drawer.</li>
        <li>Tap <strong>Account</strong>.</li>
        <li>Tap <strong>Delete account</strong>.</li>
        <li>Confirm the action when prompted.</li>
      </ol>
      <p className="text-sm text-slate-500">
        If you don't see the option, please make sure you're on the latest
        version of the app, then use Method 2 below.
      </p>

      <h2>Method 2 — Email request</h2>
      <p>
        Send an email to{' '}
        <a href="mailto:hello@mojahidhassan.in?subject=Delete%20my%20DynamQR%20account">
          hello@mojahidhassan.in
        </a>{' '}
        from the email address linked to your DynamQR account, with the
        subject:
      </p>
      <pre className="bg-surface/5 border border-white/10 rounded-[2rem] p-4 my-4 text-sm overflow-x-auto"><code>Delete my DynamQR account</code></pre>
      <p>
        We will process the request within 7 business days and confirm by
        email when it's complete.
      </p>

      <h2>Method 3 — Web dashboard</h2>
      <p>
        Sign in at{' '}
        <a href="https://dynamqr.vercel.app">dynamqr.vercel.app</a> and use
        the <strong>Account → Delete account</strong> option from the
        dashboard menu.
      </p>

      <h2>Timeline</h2>
      <ul>
        <li>
          <strong>Immediately</strong> — your sessions are revoked and your
          QR codes stop resolving.
        </li>
        <li>
          <strong>Within 30 days</strong> — your profile and all linked
          records are permanently removed from active databases.
        </li>
        <li>
          <strong>Within 90 days</strong> — residual copies in encrypted
          backups are purged.
        </li>
      </ul>

      <h2>Need help?</h2>
      <p>
        If you can't access your account, reply to any email we've sent you
        from <code>hello@mojahidhassan.in</code> or use our{' '}
        <a href="/support">Support page</a> and we'll verify your identity
        before processing the deletion.
      </p>
    </LegalLayout>
  );
};

export default DataDeletion;
