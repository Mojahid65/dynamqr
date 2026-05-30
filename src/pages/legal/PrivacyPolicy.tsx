import LegalLayout from './LegalLayout';

const PrivacyPolicy = () => {
  return (
    <LegalLayout title="Privacy Policy" lastUpdated="2026-05-29">
      <p>
        This Privacy Policy describes how <strong>DynamQR</strong> ("we",
        "us", "our") — a service operated by Mojahid Hassan as part of the
        MOJAHIDX umbrella — collects, uses, stores, shares, and protects
        information when you use our Android mobile application
        ("DynamQR" on Google Play) and our web application available at{' '}
        <a href="https://dynamqr.vercel.app">dynamqr.vercel.app</a>{' '}
        (collectively, the "Service").
      </p>
      <p>
        By using the Service, you agree to the collection and use of
        information in accordance with this policy. If you do not agree with
        this policy, please discontinue use of the Service.
      </p>

      <h2>1. Information We Collect</h2>

      <h3>1.1 Information you provide</h3>
      <ul>
        <li>
          <strong>Account information.</strong> When you sign up using email,
          we collect your email address and a hashed password. When you sign
          in with Google, we receive your Google account email, name, and
          profile picture URL via Google's OAuth flow. We never receive your
          Google password.
        </li>
        <li>
          <strong>Content you create.</strong> The destination URLs, custom
          short codes / keywords, labels, design preferences (theme, colors),
          and any other data you enter when creating a dynamic QR code or
          short link.
        </li>
        <li>
          <strong>Support communications.</strong> Anything you choose to
          share with us via email or in-app feedback.
        </li>
      </ul>

      <h3>1.2 Information collected automatically</h3>
      <ul>
        <li>
          <strong>Device information.</strong> Device manufacturer, model,
          operating system version, and app version. We use this to render
          your devices in the in-app session list and to debug crashes.
        </li>
        <li>
          <strong>Push token.</strong> A Firebase Cloud Messaging
          registration token used solely to deliver push notifications you
          have authorised.
        </li>
        <li>
          <strong>Usage and diagnostics.</strong> Anonymous logs of feature
          interactions and unhandled errors, retained only as long as needed
          to diagnose problems.
        </li>
        <li>
          <strong>QR scan events (when applicable).</strong> When someone
          scans a QR code you created, we record the time of the scan and
          may record a coarse approximation of the country and device class
          (mobile / desktop) derived from the request, in order to power
          analytics features. We do not store the scanner's IP address in a
          form that personally identifies them.
        </li>
      </ul>

      <h3>1.3 Permissions used by the Android app</h3>
      <p>
        Each runtime permission is requested only when you actively use a
        feature that needs it. You can revoke them anytime in Android
        Settings.
      </p>
      <ul>
        <li>
          <strong>Camera</strong> — required for the in-app QR scanner. The
          camera feed is processed locally on your device and is not
          transmitted, recorded, or uploaded.
        </li>
        <li>
          <strong>Photos / Media / Files</strong> — required to save
          generated QR images to your device gallery, and to import a QR
          image from your gallery for scanning.
        </li>
        <li>
          <strong>Notifications</strong> — required to deliver important
          updates, account alerts, and announcements.
        </li>
        <li>
          <strong>Internet</strong> — required to sync your data with our
          backend (Supabase) and to fetch updates.
        </li>
      </ul>

      <h2>2. How We Use Your Information</h2>
      <ul>
        <li>To create and manage your account.</li>
        <li>To create, store, edit, and resolve the QR codes / dynamic links you create.</li>
        <li>To deliver the redirect when someone scans a QR code you created.</li>
        <li>To send transactional emails (e.g. email verification, password reset) and product announcements you've opted in to.</li>
        <li>To provide aggregated scan analytics so you can see how your QR codes perform.</li>
        <li>To detect, prevent, and respond to fraud, abuse, and security incidents.</li>
        <li>To comply with legal obligations and respond to lawful requests.</li>
      </ul>

      <h2>3. Legal Bases for Processing (EU/UK users)</h2>
      <ul>
        <li>
          <strong>Performance of a contract</strong> — we process the data
          you provide to operate the Service you signed up for.
        </li>
        <li>
          <strong>Legitimate interests</strong> — to keep the Service
          secure, prevent abuse, and improve product reliability.
        </li>
        <li>
          <strong>Consent</strong> — for optional notifications and
          marketing emails. You can withdraw consent at any time.
        </li>
        <li>
          <strong>Legal obligation</strong> — when required by applicable
          law.
        </li>
      </ul>

      <h2>4. How We Share Information</h2>
      <p>
        We do not sell your personal information. We share data only with
        service providers who help us run the Service:
      </p>
      <ul>
        <li>
          <strong>Supabase</strong> (database, authentication, storage) —{' '}
          <a
            href="https://supabase.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
          >
            supabase.com/privacy
          </a>
        </li>
        <li>
          <strong>Google Firebase</strong> (push notifications, crash
          diagnostics) —{' '}
          <a
            href="https://firebase.google.com/support/privacy"
            target="_blank"
            rel="noopener noreferrer"
          >
            firebase.google.com/support/privacy
          </a>
        </li>
        <li>
          <strong>Google Identity Services</strong> (Sign in with Google) —{' '}
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
          >
            policies.google.com/privacy
          </a>
        </li>
        <li>
          <strong>Vercel</strong> (web hosting and short-link redirects) —{' '}
          <a
            href="https://vercel.com/legal/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
          >
            vercel.com/legal/privacy-policy
          </a>
        </li>
      </ul>
      <p>
        We may also disclose information when required by law, to protect
        our rights, or in connection with a corporate transaction such as a
        merger or acquisition.
      </p>

      <h2>5. Data Retention</h2>
      <p>
        We keep your account information for as long as your account is
        active. When you delete your account, we permanently remove your
        profile, QR codes, and short links from our active database within
        30 days, after which residual copies in encrypted backups are purged
        according to our backup rotation. Anonymous, aggregated analytics
        that cannot be linked to you may be retained indefinitely.
      </p>

      <h2>6. Your Rights</h2>
      <p>
        Depending on your location (including under the GDPR and the
        Digital Personal Data Protection Act, 2023 in India), you may have
        the right to:
      </p>
      <ul>
        <li>Access the personal data we hold about you.</li>
        <li>Correct inaccurate or incomplete data.</li>
        <li>Request deletion of your data.</li>
        <li>Restrict or object to certain processing.</li>
        <li>Receive your data in a portable format.</li>
        <li>Withdraw consent at any time, where consent is the legal basis.</li>
        <li>Lodge a complaint with your local data protection authority.</li>
      </ul>
      <p>
        To exercise any of these rights, see our{' '}
        <a href="/data-deletion">Data Deletion</a> page or email{' '}
        <a href="mailto:hello@mojahidhassan.in">hello@mojahidhassan.in</a>.
      </p>

      <h2>7. Children's Privacy</h2>
      <p>
        DynamQR is not directed to children under 13. We do not knowingly
        collect personal data from children. If you believe a child has
        provided us with personal information, contact us and we will delete
        it.
      </p>

      <h2>8. Security</h2>
      <p>
        We use industry-standard practices to protect your data, including
        TLS in transit, encrypted storage at rest via our hosting providers,
        row-level security policies in our database to enforce per-user data
        isolation, and short-lived authentication tokens. No system is
        perfectly secure; if you suspect your account has been compromised,
        contact us immediately.
      </p>

      <h2>9. International Data Transfers</h2>
      <p>
        Your data may be processed in countries other than your own. Where
        required, we rely on standard contractual clauses or other
        appropriate safeguards approved by the relevant authorities.
      </p>

      <h2>10. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. Material
        changes will be highlighted in the app and on this page. The "Last
        updated" date at the top reflects the most recent revision.
      </p>

      <h2>11. Contact</h2>
      <p>
        If you have any questions about this Privacy Policy, contact us at{' '}
        <a href="mailto:hello@mojahidhassan.in">hello@mojahidhassan.in</a>.
      </p>
    </LegalLayout>
  );
};

export default PrivacyPolicy;
