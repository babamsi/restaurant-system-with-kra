import Link from 'next/link'

export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="mb-4">Last updated: December 31, 2024</p>
      <p className="mb-4">Effective Date: January 1, 2025</p>
      <p className="mb-4">
        Maamul ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how your personal information is collected, used, and disclosed by Maamul.
      </p>
      <h2 className="text-2xl font-semibold mt-6 mb-4">Information We Collect</h2>
      <p className="mb-4">
        We collect information you provide directly to us, such as when you create an account, use our services, or communicate with us. This may include your name, email address, phone number, and business information.
      </p>
      <h2 className="text-2xl font-semibold mt-6 mb-4">How We Use Your Information</h2>
      <p className="mb-4">
        We use the information we collect to provide, maintain, and improve our services, to communicate with you, and to comply with legal obligations.
      </p>
      <h2 className="text-2xl font-semibold mt-6 mb-4">Data Security</h2>
      <p className="mb-4">
        We implement appropriate technical and organizational measures to protect your personal information against unauthorized or unlawful processing, accidental loss, destruction, or damage.
      </p>
      <h2 className="text-2xl font-semibold mt-6 mb-4">Your Rights</h2>
      <p className="mb-4">
        You have the right to access, correct, or delete your personal information. You may also have the right to restrict or object to certain processing of your data.
      </p>
      <h2 className="text-2xl font-semibold mt-6 mb-4">Changes to This Policy</h2>
      <p className="mb-4">
        We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.
      </p>
      <h2 className="text-2xl font-semibold mt-6 mb-4">Contact Us</h2>
      <p className="mb-4">
        If you have any questions about this Privacy Policy, please contact us at support@maamul.com.
      </p>
      <Link href="/" className="text-primary hover:underline">
        Return to Home
      </Link>
    </div>
  )
}
