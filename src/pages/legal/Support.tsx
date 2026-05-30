import LegalLayout from './LegalLayout';

const Support = () => {
  return (
    <LegalLayout title="Support" lastUpdated="2026-05-29">
      <p>
        Need help with DynamQR? You're in the right place. Most issues are
        covered below — if your question isn't answered, get in touch using
        the contact options at the bottom of this page.
      </p>

      <h2>Contact</h2>
      <ul>
        <li>
          <strong>Email:</strong>{' '}
          <a href="mailto:hello@mojahidhassan.in">hello@mojahidhassan.in</a>
          {' '}— typical response time within 24 hours on business days.
        </li>
        <li>
          <strong>GitHub issues:</strong>{' '}
          <a
            href="https://github.com/Mojahid65/dynamqr/issues"
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/Mojahid65/dynamqr/issues
          </a>
          {' '}— for bug reports and feature requests.
        </li>
      </ul>

      <h2>Frequently Asked Questions</h2>

      <h3>What is a "dynamic" QR code?</h3>
      <p>
        A dynamic QR code points to a short link you control. You can change
        where that short link redirects without reprinting the QR code.
        Useful for posters, packaging, business cards, and anywhere you'd
        otherwise be stuck with the wrong URL.
      </p>

      <h3>Is DynamQR free?</h3>
      <p>
        Yes. DynamQR is free to use. There are no ads. You can support
        development through the in-app donate screen if you'd like.
      </p>

      <h3>I can't sign in with Google</h3>
      <ol>
        <li>
          Make sure you're on the latest version from the Play Store or our{' '}
          <a
            href="https://github.com/Mojahid65/dynamqr/releases"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub releases
          </a>
          .
        </li>
        <li>
          Restart the app, then tap <strong>Continue with Google</strong>{' '}
          again.
        </li>
        <li>
          If the bottom-sheet account picker doesn't appear, open Android{' '}
          <strong>Settings → Passwords &amp; accounts</strong> and confirm
          at least one Google account is signed in.
        </li>
        <li>
          Still stuck? Email us with your device model and Android version.
        </li>
      </ol>

      <h3>My QR code stopped working</h3>
      <p>
        That usually means the QR was deleted from your account. Sign in,
        check the dashboard, and either restore the original destination or
        create a new code. If you didn't delete it and the QR is still
        missing, contact us with the short code printed on it.
      </p>

      <h3>Can I export my QR codes?</h3>
      <p>
        Yes. Open any QR code, tap the full-screen view, and choose{' '}
        <strong>Export High Quality</strong> to save a 4096&times;4096 PNG
        to your device gallery — print-ready.
      </p>

      <h3>Can I scan QR codes inside the app?</h3>
      <p>
        Yes. Tap the scan icon on the dashboard to launch the in-app
        scanner. Camera input is processed entirely on your device — nothing
        is uploaded.
      </p>

      <h3>Where is my data stored?</h3>
      <p>
        On Supabase (managed Postgres) in cloud regions chosen for
        reliability. See our <a href="/privacy">Privacy Policy</a> for
        details about retention, security, and the third-party services we
        rely on.
      </p>

      <h3>How do I delete my account?</h3>
      <p>
        See our <a href="/data-deletion">Account &amp; Data Deletion</a>{' '}
        page for the three available methods.
      </p>

      <h3>Is there an iOS version?</h3>
      <p>
        Not yet. The codebase supports iOS but we currently ship only on
        Android and the web. iOS support is on the roadmap.
      </p>

      <h2>Reporting abuse</h2>
      <p>
        If you have come across a DynamQR short link that points to spam,
        phishing, malware, or any other content that violates our{' '}
        <a href="/terms">Terms of Service</a>, please email{' '}
        <a href="mailto:hello@mojahidhassan.in?subject=Abuse%20report">
          hello@mojahidhassan.in
        </a>{' '}
        with the full short link and a brief description. We aim to review
        abuse reports within 24 hours.
      </p>
    </LegalLayout>
  );
};

export default Support;
