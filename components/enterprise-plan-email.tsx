import type React from "react"

interface EnterpriseEmailProps {
  recipientName: string
  businessName: string
  planName: string
  planFeatures: string[]
  monthlyPrice: number
  annualPrice: number
  billingPreference: string
  implementationTimeline: string
  meetingDate?: string
  contactEmail?: string
}

export const EnterpriseEmail: React.FC<EnterpriseEmailProps> = ({
  recipientName = "Yusef Adam",
  businessName = "East African Traders Ltd",
  planName = "Enterprise M",
  planFeatures = [
    "Advanced inventory management",
    "Multi-location support (up to 25 locations)",
    "Advanced analytics with AI-powered insights",
    "Custom development solutions",
    "Quarterly business reviews",
    "Advanced API access",
    "Up to 50 user accounts",
  ],
  monthlyPrice = 2320,
  annualPrice = 23664,
  billingPreference = "annual",
  implementationTimeline = "1-3 months",
  meetingDate = "June 15, 2025 at 10:00 AM EAT",
  contactEmail = "enterprise@maamul.com",
}) => {
  // Calculate monthly display price based on billing preference
  const monthlyDisplayPrice = billingPreference === "annual" ? Math.round(annualPrice / 12) : monthlyPrice

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-lg overflow-hidden shadow-lg border border-gray-200">
      {/* Email Header */}
      <div className="bg-[#392A17] p-6 text-center">
        <div className="text-6xl text-[#D6B98F] mb-4 font-serif">𐒑</div>
        <h1 className="text-white text-2xl font-bold">Your Enterprise Plan Request</h1>
        <p className="text-[#D6B98F] mt-2">Thank you for your interest in Maamul's {planName} Plan</p>
      </div>

      {/* Email Body */}
      <div className="p-6 space-y-6">
        {/* Greeting */}
        <div className="bg-[#f5f0e8] border-l-4 border-[#D6B98F] p-4">
          <p className="text-gray-800 text-lg">Dear {recipientName},</p>
          <p className="mt-2 text-gray-700">
            Thank you for your interest in Maamul's {planName} Plan for {businessName}. We're excited about the
            possibility of helping your business streamline its operations.
          </p>
        </div>

        {/* Plan Details */}
        <div>
          <h2 className="text-xl font-bold text-gray-800 border-b border-gray-200 pb-2 mb-4">Your Selected Plan</h2>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-bold text-lg text-[#392A17]">{planName} Plan</h3>
                <p className="text-gray-600 text-sm">Tailored for your business needs</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-[#392A17]">
                  {formatCurrency(monthlyDisplayPrice)}
                  <span className="text-sm font-normal text-gray-600">/month</span>
                </div>
                <div className="text-xs text-gray-500">
                  {billingPreference === "annual"
                    ? `${formatCurrency(annualPrice)} billed annually`
                    : `${formatCurrency(monthlyPrice * 3)} billed quarterly`}
                </div>
              </div>
            </div>

            <h4 className="font-medium text-gray-700 mb-2">Key Features:</h4>
            <ul className="space-y-1 mb-4">
              {planFeatures.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <svg
                    className="h-5 w-5 text-[#D6B98F] mr-2 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Next Steps */}
        <div>
          <h2 className="text-xl font-bold text-gray-800 border-b border-gray-200 pb-2 mb-4">Next Steps</h2>
          <ol className="list-decimal pl-5 space-y-2 text-gray-700">
            <li>Our enterprise team will review your request within 24 hours.</li>
            <li>A dedicated account manager will contact you to discuss your specific requirements.</li>
            <li>We'll schedule a meeting to provide a customized demo tailored to your business needs.</li>
            <li>Together, we'll finalize your implementation plan and timeline.</li>
          </ol>

          {meetingDate && (
            <div className="mt-4 bg-[#392A17]/5 p-4 rounded-lg border border-[#392A17]/10">
              <p className="font-medium text-[#392A17]">Your Scheduled Meeting:</p>
              <p className="text-gray-700">{meetingDate}</p>
              <p className="text-sm text-gray-500 mt-1">We'll send a calendar invitation to your email shortly.</p>
            </div>
          )}
        </div>

        {/* Implementation Timeline */}
        <div>
          <h2 className="text-xl font-bold text-gray-800 border-b border-gray-200 pb-2 mb-4">
            Implementation Timeline
          </h2>
          <p className="text-gray-700">
            Based on your preferences, we've noted your desired implementation timeline of{" "}
            <strong>{implementationTimeline}</strong>. Our team will work with you to create a detailed implementation
            plan that aligns with your business needs and timeline.
          </p>
        </div>

        {/* Contact Information */}
        <div className="bg-[#392A17] text-white p-4 rounded-lg text-center">
          <p className="font-medium text-lg">Have questions? We're here to help!</p>
          <p className="mt-1">
            Contact our Enterprise Team at{" "}
            <a href={`mailto:${contactEmail}`} className="text-[#D6B98F] underline">
              {contactEmail}
            </a>
          </p>
        </div>
      </div>

      {/* Email Footer */}
      <div className="bg-gray-100 p-4 text-center text-gray-500 text-sm">
        <p>&copy; 2025 Maamul. All rights reserved.</p>
        <p className="mt-1">This email was sent to you because you requested information about our enterprise plans.</p>
      </div>
    </div>
  )
}

export default function EnterpriseEmailPreview() {
  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-3xl mx-auto mb-6">
        <h1 className="text-2xl font-bold mb-2">Enterprise Plan Email Preview</h1>
        <p className="text-gray-600">
          This is a preview of the email sent to users after they complete the enterprise plan questionnaire.
        </p>
      </div>
      <EnterpriseEmail />
    </div>
  )
}
