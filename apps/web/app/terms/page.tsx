import Link from "next/link";

export default function TermsPage() {
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
            <h1 className="text-4xl font-bold text-text-primary mb-2">Terms of Service</h1>
            <p className="text-text-muted">Last updated: January 2, 2025</p>
          </div>

          <div className="space-y-8 text-text-primary">
            <section>
              <h2 className="text-2xl font-semibold mb-4">Welcome to Contribly</h2>
              <p className="text-text-secondary leading-relaxed">
                These Terms of Service ("Terms") govern your use of Contribly, a contribution management platform designed to help organizations track contributions, manage departments and members, process payments, and handle claims. By using Contribly, you agree to these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">What Contribly Does</h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                Contribly provides tools to help your organization:
              </p>
              <ul className="list-disc list-inside space-y-2 text-text-secondary ml-4">
                <li>Track and manage financial contributions</li>
                <li>Organize departments and members</li>
                <li>Process and record payments</li>
                <li>Handle and track claims</li>
                <li>Generate reports and maintain records</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Your Account</h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                When you create an account, you're responsible for:
              </p>
              <ul className="list-disc list-inside space-y-2 text-text-secondary ml-4">
                <li>Keeping your password secure</li>
                <li>All activity that happens under your account</li>
                <li>Providing accurate information about your organization</li>
                <li>Following these Terms and applicable laws</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Your Data</h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                You own your data. When you use Contribly:
              </p>
              <ul className="list-disc list-inside space-y-2 text-text-secondary ml-4">
                <li>You keep ownership of all data you enter</li>
                <li>We use your data only to provide the service</li>
                <li>We will never sell your data to third parties</li>
                <li>You can export or delete your data at any time</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">What We Expect</h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                Please use Contribly responsibly. Don't:
              </p>
              <ul className="list-disc list-inside space-y-2 text-text-secondary ml-4">
                <li>Use the service for illegal activities</li>
                <li>Try to break or bypass our security measures</li>
                <li>Share false or misleading information</li>
                <li>Interfere with other users' access to the service</li>
                <li>Violate anyone's privacy or intellectual property rights</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Service Availability</h2>
              <p className="text-text-secondary leading-relaxed">
                We work hard to keep Contribly running smoothly, but we can't guarantee it will always be available. We may need to update or maintain the service from time to time. We're not responsible for data loss or service interruptions, so please keep your own backups.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Payments and Billing</h2>
              <p className="text-text-secondary leading-relaxed">
                If you use paid features, you agree to pay all fees on time. Fees are non-refundable unless required by law. We may change our pricing with notice.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Limitation of Liability</h2>
              <p className="text-text-secondary leading-relaxed">
                Contribly is provided "as is." We make no warranties about the service. We're not liable for any damages arising from your use of the service, including data loss, business interruption, or financial loss. Our total liability is limited to the amount you paid us in the last 12 months.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Changes to These Terms</h2>
              <p className="text-text-secondary leading-relaxed">
                We may update these Terms from time to time. If we make significant changes, we'll notify you via email or through the service. Continued use of Contribly after changes means you accept the new Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Termination</h2>
              <p className="text-text-secondary leading-relaxed">
                You can stop using Contribly anytime by closing your account. We may suspend or terminate your account if you violate these Terms or for legal reasons. After termination, your data will be deleted according to our Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
              <p className="text-text-secondary leading-relaxed">
                If you have questions about these Terms, please contact us through the support section of the application or email us at support@contribly.com.
              </p>
            </section>

            <div className="border-t border-border pt-8 mt-12">
              <p className="text-sm text-text-muted text-center">
                By using Contribly, you acknowledge that you have read and understood these Terms of Service.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
