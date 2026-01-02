import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-card border border-border rounded-card shadow-large p-8 sm:p-12">
          <div className="mb-8">
            <Link href="/" className="text-primary hover:text-primary-dark font-semibold flex items-center gap-2 mb-6">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Home
            </Link>
            <h1 className="text-4xl font-bold text-text-primary mb-2">Privacy Policy</h1>
            <p className="text-text-muted">Last updated: January 2, 2025</p>
          </div>

          <div className="space-y-8 text-text-primary">
            <section>
              <h2 className="text-2xl font-semibold mb-4">Your Privacy Matters</h2>
              <p className="text-text-secondary leading-relaxed">
                This Privacy Policy explains how Contribly collects, uses, and protects your information when you use our contribution management platform. We believe in transparency and want you to understand exactly what we do with your data.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                When you use Contribly, we collect:
              </p>
              
              <h3 className="text-xl font-semibold mb-3 mt-6">Account Information</h3>
              <ul className="list-disc list-inside space-y-2 text-text-secondary ml-4">
                <li>Your email address</li>
                <li>Your name</li>
                <li>Organization name</li>
                <li>Password (encrypted)</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-6">Organization Data</h3>
              <ul className="list-disc list-inside space-y-2 text-text-secondary ml-4">
                <li>Department information</li>
                <li>Member details</li>
                <li>Contribution records</li>
                <li>Payment information</li>
                <li>Claims data</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-6">Usage Information</h3>
              <ul className="list-disc list-inside space-y-2 text-text-secondary ml-4">
                <li>How you use the service</li>
                <li>Features you access</li>
                <li>Error logs and diagnostics</li>
                <li>Browser type and device information</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                We use your information to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-text-secondary ml-4">
                <li>Provide and improve the Contribly service</li>
                <li>Create and manage your account</li>
                <li>Send you important updates about the service</li>
                <li>Respond to your support requests</li>
                <li>Detect and prevent fraud or abuse</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">What We Don't Do</h2>
              <div className="bg-accent/10 border border-accent rounded-button p-6">
                <p className="text-text-primary font-semibold mb-3">We want to be crystal clear:</p>
                <ul className="list-disc list-inside space-y-2 text-text-secondary ml-4">
                  <li><strong>We never sell your data</strong> to third parties</li>
                  <li><strong>We don't use your data</strong> for advertising</li>
                  <li><strong>We don't share your information</strong> with anyone except as described in this policy</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">When We Share Information</h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                We only share your information in these limited cases:
              </p>
              <ul className="list-disc list-inside space-y-2 text-text-secondary ml-4">
                <li><strong>With your permission:</strong> When you explicitly authorize us to share</li>
                <li><strong>Service providers:</strong> With companies that help us run Contribly (like hosting providers), who are bound by confidentiality agreements</li>
                <li><strong>Legal requirements:</strong> If required by law, court order, or government request</li>
                <li><strong>Business transfers:</strong> If Contribly is acquired or merged, your data will transfer to the new owner</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                We take security seriously:
              </p>
              <ul className="list-disc list-inside space-y-2 text-text-secondary ml-4">
                <li>All data is encrypted in transit and at rest</li>
                <li>Passwords are hashed and salted</li>
                <li>We use secure, industry-standard hosting</li>
                <li>Regular security audits and updates</li>
                <li>Access controls and authentication</li>
              </ul>
              <p className="text-text-secondary leading-relaxed mt-4">
                However, no system is 100% secure. While we do our best, we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Your Rights and Controls</h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                You have control over your data:
              </p>
              <ul className="list-disc list-inside space-y-2 text-text-secondary ml-4">
                <li><strong>Access:</strong> View all data we have about you</li>
                <li><strong>Export:</strong> Download your data in a portable format</li>
                <li><strong>Correct:</strong> Update inaccurate information</li>
                <li><strong>Delete:</strong> Request deletion of your account and data</li>
                <li><strong>Opt-out:</strong> Unsubscribe from marketing emails</li>
              </ul>
              <p className="text-text-secondary leading-relaxed mt-4">
                To exercise these rights, contact us through the support section or email privacy@contribly.com.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Data Retention</h2>
              <p className="text-text-secondary leading-relaxed">
                We keep your data as long as your account is active. After you delete your account, we'll delete your data within 30 days, except where we're required to keep it longer by law (such as for tax or legal purposes).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Cookies and Tracking</h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                We use cookies to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-text-secondary ml-4">
                <li>Keep you logged in</li>
                <li>Remember your preferences</li>
                <li>Understand how you use the service</li>
                <li>Improve performance and security</li>
              </ul>
              <p className="text-text-secondary leading-relaxed mt-4">
                You can control cookies through your browser settings, but some features may not work properly if you disable them.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Children's Privacy</h2>
              <p className="text-text-secondary leading-relaxed">
                Contribly is not intended for users under 13 years old. We don't knowingly collect information from children. If we learn that we've collected a child's information, we'll delete it promptly.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Changes to This Policy</h2>
              <p className="text-text-secondary leading-relaxed">
                We may update this Privacy Policy from time to time. If we make significant changes, we'll notify you via email or through the service. The "Last updated" date at the top shows when the policy was last changed.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">International Users</h2>
              <p className="text-text-secondary leading-relaxed">
                Contribly is hosted in the United States. If you use our service from outside the US, your data will be transferred to and processed in the US. By using Contribly, you consent to this transfer.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                If you have questions about this Privacy Policy or how we handle your data, please contact us:
              </p>
              <ul className="list-none space-y-2 text-text-secondary ml-4">
                <li>• Email: privacy@contribly.com</li>
                <li>• Support section in the application</li>
              </ul>
            </section>

            <div className="border-t border-border pt-8 mt-12">
              <p className="text-sm text-text-muted text-center">
                By using Contribly, you acknowledge that you have read and understood this Privacy Policy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
