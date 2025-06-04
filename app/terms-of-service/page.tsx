import Link from 'next/link'

export default function TermsOfService() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
      <p className="mb-4">Last updated: December 31, 2024</p>
      <p className="mb-4">Effective Date: January 1, 2025</p>
      <p className="mb-4">
        Please read these Terms of Service ("Terms", "Terms of Service") carefully before using the Maamul platform (the "Service") operated by Maamul ("us", "we", or "our").
      </p>
      <h2 className="text-2xl font-semibold mt-6 mb-4">1. Acceptance of Terms</h2>
      <p className="mb-4">
        By accessing or using the Service, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the Service.
      </p>
      <h2 className="text-2xl font-semibold mt-6 mb-4">2. Description of Service</h2>
      <p className="mb-4">
        Maamul provides an all-in-one management solution for East African businesses to streamline their operations, including point of sale, inventory management, and payment integrations.
      </p>
      <h2 className="text-2xl font-semibold mt-6 mb-4">3. User Accounts</h2>
      <p className="mb-4">
        You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password.
      </p>
      <h2 className="text-2xl font-semibold mt-6 mb-4">4. Intellectual Property</h2>
      <p className="mb-4">
        The Service and its original content, features, and functionality are and will remain the exclusive property of Maamul and its licensors.
      </p>
      <h2 className="text-2xl font-semibold mt-6 mb-4">5. Termination</h2>
      <p className="mb-4">
        We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
      </p>
      <h2 className="text-2xl font-semibold mt-6 mb-4">6. Limitation of Liability</h2>
      <p className="mb-4">
        In no event shall Maamul, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages.
      </p>
      <h2 className="text-2xl font-semibold mt-6 mb-4">7. Changes</h2>
      <p className="mb-4">
        We reserve the right, at our sole discretion, to modify or replace these Terms at any time. What constitutes a material change will be determined at our sole discretion.
      </p>
      <h2 className="text-2xl font-semibold mt-6 mb-4">8. Contact Us</h2>
      <p className="mb-4">
        If you have any questions about these Terms, please contact us at support@maamul.com.
      </p>
      <Link href="/" className="text-primary hover:underline">
        Return to Home
      </Link>
    </div>
  )
}
