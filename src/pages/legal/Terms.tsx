import LegalLayout from './LegalLayout';

const Terms = () => {
  return (
    <LegalLayout title="Terms of Service" lastUpdated="2026-05-29">
      <p>
        These Terms of Service ("Terms") govern your access to and use of
        DynamQR (the "Service"), including the Android mobile application
        and the website at{' '}
        <a href="https://dynamqr.vercel.app">dynamqr.vercel.app</a>. The
        Service is operated by Mojahid Hassan as part of the MOJAHIDX
        umbrella ("we", "us"). By creating an account or using the
        Service, you agree to these Terms.
      </p>

      <h2>1. Eligibility</h2>
      <p>
        You must be at least 13 years old to use the Service. If you are
        under the age of majority in your jurisdiction, you confirm that
        your parent or legal guardian has consented to your use of the
        Service.
      </p>

      <h2>2. Your Account</h2>
      <p>
        You are responsible for maintaining the confidentiality of your
        login credentials and for all activity that occurs under your
        account. Notify us immediately at{' '}
        <a href="mailto:hello@mojahidhassan.in">hello@mojahidhassan.in</a>{' '}
        if you suspect unauthorised access. We may suspend or terminate
        accounts that violate these Terms.
      </p>

      <h2>3. The Service</h2>
      <p>
        DynamQR lets you create dynamic QR codes and short links whose
        destinations you can update over time, customise their visual style,
        scan QR codes through the in-app scanner, and view analytics about
        your codes.
      </p>
      <p>
        The Service is offered "as is" and may evolve. Features may be
        added, modified, or removed without prior notice. We aim for high
        availability but do not guarantee uninterrupted operation.
      </p>

      <h2>4. Acceptable Use</h2>
      <p>You agree not to use the Service to create, distribute, or link to:</p>
      <ul>
        <li>
          Content that is illegal, fraudulent, deceptive, defamatory,
          obscene, or that infringes intellectual-property or privacy
          rights;
        </li>
        <li>Phishing pages, malware, scareware, or any payload designed to deceive or harm users;</li>
        <li>Content that promotes violence, terrorism, child exploitation, or hate speech;</li>
        <li>Spam, unsolicited bulk messaging, or large-scale automated abuse of redirect endpoints;</li>
        <li>Content that violates Google Play Developer Programme Policies, the App Store Review Guidelines, or applicable local laws.</li>
      </ul>
      <p>
        You also agree not to attempt to reverse-engineer, decompile, or
        circumvent any security or rate-limiting features of the Service,
        and not to use the Service to harass other users or our staff.
      </p>

      <h2>5. Your Content</h2>
      <p>
        You retain ownership of the URLs, labels, and other content you
        upload ("Your Content"). By using the Service, you grant us a
        worldwide, non-exclusive, royalty-free licence to host, store, copy,
        transmit, display, and process Your Content solely to operate and
        improve the Service. You are responsible for ensuring you have the
        right to share Your Content.
      </p>

      <h2>6. Intellectual Property</h2>
      <p>
        The Service, including its source code, design, logos, and the
        DynamQR and MOJAHIDX brands, is owned by us or our licensors and
        protected by intellectual-property laws. You may not copy, modify,
        distribute, sell, or lease any part of the Service without our prior
        written permission.
      </p>

      <h2>7. Donations</h2>
      <p>
        Donations made through the in-app donate screen are voluntary and
        non-refundable. No goods or services are provided in exchange for a
        donation.
      </p>

      <h2>8. Third-Party Services</h2>
      <p>
        The Service relies on third-party providers (Supabase, Firebase,
        Google Sign-In, Vercel). Your use of those services is subject to
        their own terms and privacy policies. We are not responsible for
        third-party services or any content reachable through links you
        create.
      </p>

      <h2>9. Termination</h2>
      <p>
        You may stop using the Service and delete your account at any time
        from the in-app account settings or by contacting us. We may
        suspend or terminate your access if you violate these Terms or if
        your activity poses a risk to the Service, other users, or
        third-parties. Upon termination, sections of these Terms that by
        their nature should survive (intellectual property, disclaimers,
        limitation of liability, indemnity, and governing law) will
        continue to apply.
      </p>

      <h2>10. Disclaimers</h2>
      <p>
        The Service is provided <strong>"as is"</strong> and{' '}
        <strong>"as available"</strong>, without warranties of any kind,
        whether express or implied, including the implied warranties of
        merchantability, fitness for a particular purpose, and
        non-infringement. We do not warrant that the Service will be
        uninterrupted, error-free, or completely secure.
      </p>

      <h2>11. Limitation of Liability</h2>
      <p>
        To the maximum extent permitted by law, in no event will we be
        liable for any indirect, incidental, special, consequential, or
        punitive damages, or for any loss of profits, revenue, data, or
        goodwill, arising from or related to your use of the Service. Our
        aggregate liability for any claim relating to the Service will not
        exceed the greater of (a) the amount you paid us in the 12 months
        before the claim arose, or (b) ₹100 (one hundred Indian rupees).
      </p>

      <h2>12. Indemnity</h2>
      <p>
        You agree to indemnify and hold us harmless from any claim, demand,
        or damages arising out of your use of the Service, Your Content,
        your violation of these Terms, or your violation of any
        third-party rights.
      </p>

      <h2>13. Changes to These Terms</h2>
      <p>
        We may update these Terms from time to time. If a change is
        material, we will provide notice in the app and on this page. Your
        continued use of the Service after the effective date of the
        revised Terms constitutes your acceptance of them.
      </p>

      <h2>14. Governing Law</h2>
      <p>
        These Terms are governed by the laws of India, without regard to
        its conflict-of-laws provisions. Disputes will be resolved in the
        courts located in India, except where applicable local law
        guarantees you the right to bring proceedings in your country of
        residence.
      </p>

      <h2>15. Contact</h2>
      <p>
        For any questions about these Terms, email{' '}
        <a href="mailto:hello@mojahidhassan.in">hello@mojahidhassan.in</a>.
      </p>
    </LegalLayout>
  );
};

export default Terms;
