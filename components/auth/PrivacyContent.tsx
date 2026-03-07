export function PrivacyContent() {
  return (
    <>
      <p className="text-sm text-slate-500 mb-4">
        <strong>Effective Date:</strong> November 18, 2025
        <br />
        <strong>Last Updated:</strong> November 13, 2025
      </p>

      <h2>Introduction</h2>
      <p>
        Grail Seeker IO LLC (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) operates the
        Grail Seeker service. This Privacy Policy explains how we collect, use, disclose, and
        protect your personal information when you use our Service.
      </p>
      <p>
        <strong>
          By using our Service, you agree to the collection and use of information in accordance
          with this Privacy Policy.
        </strong>
      </p>

      <h2>1. Information We Collect</h2>
      <h3>Information You Provide to Us</h3>
      <p>
        <strong>Account Information:</strong>
      </p>
      <ul>
        <li>Email address (required for account creation)</li>
        <li>Phone number (required for SMS notifications)</li>
        <li>Password (encrypted, never stored in plain text)</li>
      </ul>
      <p>
        <strong>Search Preferences:</strong>
      </p>
      <ul>
        <li>Comic book titles, issue numbers, grades, and price ranges you want to track</li>
        <li>Notification preferences and alert history</li>
      </ul>

      <h3>Information Collected Automatically</h3>
      <ul>
        <li>Log data including IP address, browser type, operating system</li>
        <li>Pages visited, time spent on pages, timestamps</li>
        <li>Session cookies for authentication (essential for Service functionality)</li>
      </ul>

      <h3>Information We Do NOT Collect</h3>
      <ul>
        <li>eBay user credentials or account information</li>
        <li>Browsing history outside our Service</li>
        <li>Social media profile data</li>
        <li>Precise geolocation or biometric data</li>
      </ul>

      <h2>2. How We Use Your Information</h2>
      <ul>
        <li>Create and manage your account</li>
        <li>Monitor marketplaces for comics matching your search criteria</li>
        <li>Send SMS alerts when matching comics are found</li>
        <li>Analyze usage patterns to improve features</li>
        <li>Respond to customer support inquiries</li>
      </ul>
      <p>
        <strong>We will NEVER:</strong>
      </p>
      <ul>
        <li>Sell your personal information to third parties</li>
        <li>Share your data for advertising purposes</li>
        <li>Use your phone number for marketing calls</li>
      </ul>

      <h2>3. How We Share Your Information</h2>
      <p>We share your information with trusted service providers:</p>
      <ul>
        <li>
          <strong>Supabase:</strong> Database & authentication
        </li>
        <li>
          <strong>Twilio:</strong> SMS notification delivery
        </li>
        <li>
          <strong>eBay:</strong> Public listing search via API
        </li>
        <li>
          <strong>Stripe:</strong> Payment processing (future)
        </li>
        <li>
          <strong>Vercel:</strong> Application hosting
        </li>
      </ul>

      <h2>4. Data Retention</h2>
      <ul>
        <li>User accounts retained until you delete your account</li>
        <li>All data permanently deleted within 30 days of account deletion</li>
        <li>Server logs retained for 30 days, then automatically rotated</li>
      </ul>

      <h2>5. Your Privacy Rights</h2>
      <p>You have the right to:</p>
      <ul>
        <li>
          <strong>Access:</strong> View all personal data we hold about you
        </li>
        <li>
          <strong>Correction:</strong> Update inaccurate or incomplete information
        </li>
        <li>
          <strong>Deletion:</strong> Request deletion of your account and data
        </li>
        <li>
          <strong>Portability:</strong> Receive a copy of your data in JSON format
        </li>
      </ul>
      <p>
        California (CCPA) and European (GDPR) users have additional rights. Contact
        support@grailseeker.io with the subject &ldquo;CCPA Request&rdquo; or &ldquo;GDPR
        Request&rdquo;.
      </p>

      <h2>6. Data Security</h2>
      <ul>
        <li>HTTPS/TLS encryption for all data in transit</li>
        <li>AES-256 encryption for data at rest</li>
        <li>Bcrypt password hashing</li>
        <li>Row-Level Security (RLS) policies in database</li>
      </ul>
      <p>
        In the event of a data breach, we will notify affected users within 72 hours.
      </p>

      <h2>7. Children&apos;s Privacy</h2>
      <p>
        Our Service is NOT intended for users under 18 years of age. We do not knowingly collect
        information from children under 13.
      </p>

      <h2>8. Cookies</h2>
      <ul>
        <li>
          <strong>Essential Cookies:</strong> Authentication and security (required)
        </li>
        <li>
          <strong>Analytics Cookies:</strong> Usage patterns (can be disabled in browser)
        </li>
      </ul>
      <p>We do NOT use advertising cookies or cross-site tracking.</p>

      <h2>9. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. Significant changes will be notified
        via email. Continued use after changes constitutes acceptance.
      </p>

      <h2>10. Contact Us</h2>
      <p>
        Questions about this Privacy Policy? Email{' '}
        <a href="mailto:support@grailseeker.io">support@grailseeker.io</a>
      </p>

      <hr />

      <p className="text-sm text-slate-500">
        By using Grail Seeker, you acknowledge that you have read and understood this Privacy
        Policy.
      </p>
    </>
  )
}
