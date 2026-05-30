import LegalLayout from './LegalLayout';

const About = () => {
  return (
    <LegalLayout title="About DynamQR" lastUpdated="2026-05-29">
      <p>
        DynamQR is a dynamic QR code platform built to be fast, beautiful,
        and free of friction. Create a QR code once, point it anywhere, and
        update its destination whenever you need to — without reprinting.
      </p>
      <p>
        DynamQR is a product of <strong>MOJAHIDX</strong>, an indie studio
        run by Mojahid Hassan. We focus on tools that respect your time and
        your privacy.
      </p>

      <h2>What you can do with DynamQR</h2>
      <ul>
        <li>Create dynamic QR codes whose destination URL you control.</li>
        <li>Customise themes, module shapes, and brand colors.</li>
        <li>Scan QR codes in the app or import from your gallery.</li>
        <li>Export print-ready 4K QR images directly to your device.</li>
        <li>Manage everything from the Android app or the web dashboard.</li>
        <li>Get push notifications for important updates and announcements.</li>
      </ul>

      <h2>Built with</h2>
      <ul>
        <li>Flutter (Android app) and React + Vite (web)</li>
        <li>Supabase for auth, database, and storage</li>
        <li>Firebase Cloud Messaging for push notifications</li>
        <li>Material 3 / Material You theming with full dynamic-color support</li>
      </ul>

      <h2>Connect</h2>
      <ul>
        <li>
          Website:{' '}
          <a
            href="https://www.mojahidhassan.in/"
            target="_blank"
            rel="noopener noreferrer"
          >
            mojahidhassan.in
          </a>
        </li>
        <li>
          GitHub:{' '}
          <a
            href="https://github.com/Mojahid65"
            target="_blank"
            rel="noopener noreferrer"
          >
            @Mojahid65
          </a>
        </li>
        <li>
          Instagram:{' '}
          <a
            href="https://www.instagram.com/mojahid.in/"
            target="_blank"
            rel="noopener noreferrer"
          >
            @mojahid.in
          </a>
        </li>
        <li>
          Email:{' '}
          <a href="mailto:hello@mojahidhassan.in">hello@mojahidhassan.in</a>
        </li>
      </ul>

      <h2>Open issues &amp; roadmap</h2>
      <p>
        Track development and request features at{' '}
        <a
          href="https://github.com/Mojahid65/dynamqr"
          target="_blank"
          rel="noopener noreferrer"
        >
          github.com/Mojahid65/dynamqr
        </a>
        . Pull requests are welcome.
      </p>
    </LegalLayout>
  );
};

export default About;
