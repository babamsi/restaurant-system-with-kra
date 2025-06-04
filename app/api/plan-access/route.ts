import { NextResponse } from "next/server"
import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  host: "smtp.zoho.com",
  port: 465,
  secure: true,
  auth: {
    user: "no-reply@maamul.com",
    pass: "69APsXQkuLuw",
  },
})

export async function POST(request: Request) {
  try {
    const formData = await request.json()

    // Format plan data for email
    const planData = formData.planData
      ? Object.entries(formData.planData)
          .map(([key, value]) => {
            // Format keys for better readability
            const formattedKey = key
              .replace(/([A-Z])/g, " $1")
              .replace(/^./, (str) => str.toUpperCase())
              .replace(/([a-z])([A-Z])/g, "$1 $2")

            return `<li><strong>${formattedKey}:</strong> ${value}</li>`
          })
          .join("")
      : ""

    // Get plan name for subject line
    const planName =
      formData.planData && formData.planData.recommendedPlan
        ? formData.planData.recommendedPlan.replace("tier", "Enterprise ")
        : "Enterprise Plan"

    // Format pricing information
    let pricingInfo = ""
    if (formData.planData) {
      const { monthlyPrice, annualPrice, billingPreference, oneTimeCost } = formData.planData

      if (monthlyPrice || annualPrice) {
        pricingInfo = `
          <h3 style="color: #392A17; margin-top: 20px; margin-bottom: 10px; font-size: 16px;">Pricing Information:</h3>
          <ul style="margin: 0; padding-left: 20px;">
            ${monthlyPrice ? `<li style="margin-bottom: 5px;"><strong>Quarterly Price:</strong> $${monthlyPrice}</li>` : ""}
            ${annualPrice ? `<li style="margin-bottom: 5px;"><strong>Annual Price:</strong> $${annualPrice}</li>` : ""}
            ${billingPreference ? `<li style="margin-bottom: 5px;"><strong>Billing Preference:</strong> ${billingPreference}</li>` : ""}
            ${oneTimeCost ? `<li style="margin-bottom: 5px;"><strong>One-Time Setup Cost:</strong> $${oneTimeCost}</li>` : ""}
          </ul>
        `
      }
    }

    // Email to admin
    const adminMailOptions = {
      from: "no-reply@maamul.com",
      to: "support@maamul.com", // Change this to your actual email
      subject: `New Enterprise Plan Request: ${planName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Enterprise Plan Request</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #392A17; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
            <div style="font-size: 60px; color: #D6B98F; margin-bottom: 15px; text-align: center;">𐒑</div>
            <h1 style="color: #fff; margin: 0; font-size: 24px;">New Enterprise Plan Request</h1>
          </div>
          
          <div style="background-color: #f9f9f9; border: 1px solid #ddd; border-top: none; padding: 20px; border-radius: 0 0 5px 5px;">
            <div style="background-color: #fff; padding: 15px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #D6B98F;">
              <p style="margin-top: 0; font-size: 16px;">A customer has requested access to the <strong>${planName}</strong>.</p>
              <p style="margin-bottom: 0;"><strong>Action Required:</strong> Please contact this customer within 24 hours.</p>
            </div>
            
            <div style="margin-bottom: 20px;">
              <h2 style="color: #392A17; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-top: 0;">Business Information</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; width: 40%;"><strong>Business Name:</strong></td>
                  <td style="padding: 8px 0;">${formData.businessName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; width: 40%;"><strong>Contact Name:</strong></td>
                  <td style="padding: 8px 0;">${formData.contactName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; width: 40%;"><strong>Email:</strong></td>
                  <td style="padding: 8px 0;"><a href="mailto:${formData.email}" style="color: #D6B98F;">${formData.email}</a></td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; width: 40%;"><strong>Phone:</strong></td>
                  <td style="padding: 8px 0;">${formData.phone || "Not provided"}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; width: 40%;"><strong>Industry:</strong></td>
                  <td style="padding: 8px 0;">${formData.industry ? (formData.industry === "logistics" ? "Logistics & Distribution" : formData.industry.charAt(0).toUpperCase() + formData.industry.slice(1)) : "Not provided"}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; width: 40%;"><strong>Business Size:</strong></td>
                  <td style="padding: 8px 0;">${formData.businessSize || "Not provided"}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; width: 40%;"><strong>Implementation Timeline:</strong></td>
                  <td style="padding: 8px 0;">${
                    formData.implementationTimeline
                      ? formData.implementationTimeline === "immediate"
                        ? "Immediate (1-2 weeks)"
                        : formData.implementationTimeline === "1-3months"
                          ? "1-3 months"
                          : formData.implementationTimeline === "3-6months"
                            ? "3-6 months"
                            : "6+ months"
                      : "Not provided"
                  }</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; width: 40%;"><strong>Payment Preference:</strong></td>
                  <td style="padding: 8px 0;">${
                    formData.paymentPreference
                      ? formData.paymentPreference === "quarterly"
                        ? "Quarterly Billing"
                        : formData.paymentPreference === "annual"
                          ? "Annual Billing (Save 15%)"
                          : "Quarterly Billing"
                      : "Not provided"
                  }</td>
                </tr>
              </table>
            </div>
            
            <div style="margin-bottom: 20px;">
              <h2 style="color: #392A17; border-bottom: 1px solid #eee; padding-bottom: 10px;">Additional Requirements</h2>
              <p style="background-color: #fff; padding: 10px; border-radius: 5px; margin-top: 10px;">${formData.additionalRequirements || "None provided"}</p>
            </div>
            
            ${
              formData.planData && formData.planData.recommendedPlan
                ? `
                <div style="margin-bottom: 20px; background-color: #f5f0e8; padding: 15px; border-radius: 5px;">
                  <h2 style="color: #392A17; border-bottom: 1px solid #e0d5c0; padding-bottom: 10px; margin-top: 0;">Selected Plan Details</h2>
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 8px 0; width: 40%;"><strong>Plan:</strong></td>
                      <td style="padding: 8px 0;">${formData.planData.recommendedPlan.replace("tier", "Enterprise ")}</td>
                    </tr>
                    ${
                      formData.planData.monthlyPrice
                        ? `
                    <tr>
                      <td style="padding: 8px 0; width: 40%;"><strong>Quarterly Price:</strong></td>
                      <td style="padding: 8px 0;">$${formData.planData.monthlyPrice}</td>
                    </tr>
                    `
                        : ""
                    }
                    ${
                      formData.planData.annualPrice
                        ? `
                    <tr>
                      <td style="padding: 8px 0; width: 40%;"><strong>Annual Price:</strong></td>
                      <td style="padding: 8px 0;">$${formData.planData.annualPrice}</td>
                    </tr>
                    `
                        : ""
                    }
                    ${
                      formData.planData.billingPreference
                        ? `
                    <tr>
                      <td style="padding: 8px 0; width: 40%;"><strong>Billing Preference:</strong></td>
                      <td style="padding: 8px 0;">${formData.planData.billingPreference}</td>
                    </tr>
                    `
                        : ""
                    }
                  </table>
                </div>
              `
                : ""
            }
            
            ${
              formData.planData && Object.keys(formData.planData).length > 0
                ? `
                <div style="margin-bottom: 20px;">
                  <h2 style="color: #392A17; border-bottom: 1px solid #eee; padding-bottom: 10px;">Questionnaire Information</h2>
                  <div style="background-color: #fff; padding: 15px; border-radius: 5px;">
                    <ul style="margin: 0; padding-left: 20px;">
                      ${planData}
                    </ul>
                  </div>
                </div>
              `
                : ""
            }
            
            <div style="background-color: #392A17; color: white; padding: 15px; border-radius: 5px; text-align: center; margin-top: 30px;">
              <p style="margin: 0;">This is an automated notification. Please do not reply to this email.</p>
            </div>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #777; font-size: 12px;">
            <p>&copy; 2025 Maamul. All rights reserved.</p>
          </div>
        </body>
        </html>
      `,
    }

    // Email to user
    const userMailOptions = {
      from: "no-reply@maamul.com",
      to: formData.email,
      subject: `Your Maamul ${planName} Request`,
      html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Enterprise Plan Request</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
        }
        .header {
          background-color: #392A17;
          padding: 20px;
          text-align: center;
          border-radius: 5px 5px 0 0;
        }
        .logo {
          font-size: 60px;
          color: #D6B98F;
          margin-bottom: 15px;
        }
        .content {
          background-color: #f9f9f9;
          border: 1px solid #ddd;
          border-top: none;
          padding: 20px;
          border-radius: 0 0 5px 5px;
        }
        .greeting {
          background-color: #f5f0e8;
          border-left: 4px solid #D6B98F;
          padding: 15px;
          margin-bottom: 20px;
        }
        .plan-details {
          background-color: #fff;
          padding: 15px;
          border-radius: 5px;
          margin-bottom: 20px;
        }
        .feature-list {
          padding-left: 20px;
        }
        .feature-item {
          margin-bottom: 8px;
          position: relative;
          padding-left: 25px;
        }
        .feature-item:before {
          content: "✓";
          color: #D6B98F;
          position: absolute;
          left: 0;
        }
        .next-steps {
          margin-bottom: 20px;
        }
        .next-steps ol {
          padding-left: 20px;
        }
        .next-steps li {
          margin-bottom: 10px;
        }
        .meeting-info {
          background-color: rgba(57, 42, 23, 0.05);
          padding: 15px;
          border-radius: 5px;
          border: 1px solid rgba(57, 42, 23, 0.1);
          margin-bottom: 20px;
        }
        .contact-box {
          background-color: #392A17;
          color: white;
          padding: 15px;
          border-radius: 5px;
          text-align: center;
          margin-top: 30px;
        }
        .contact-box a {
          color: #D6B98F;
          text-decoration: underline;
        }
        .footer {
          text-align: center;
          padding: 20px;
          color: #777;
          font-size: 12px;
        }
        h1 {
          color: #fff;
          margin: 0;
          font-size: 24px;
        }
        h2 {
          color: #392A17;
          border-bottom: 1px solid #eee;
          padding-bottom: 10px;
          margin-top: 0;
        }
        .price {
          font-size: 24px;
          font-weight: bold;
          color: #392A17;
        }
        .price-note {
          font-size: 14px;
          color: #777;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">𐒑</div>
          <h1>Thank You for Your Interest!</h1>
          <p style="color: #D6B98F; margin: 10px 0 0 0;">We've received your request for the ${planName}</p>
        </div>
        
        <div class="content">
          <div class="greeting">
            <p style="margin: 0; font-size: 16px;">Dear ${formData.contactName},</p>
            <p style="margin-top: 10px;">Thank you for your interest in Maamul's ${planName}. We're excited about the possibility of helping your business streamline its operations.</p>
          </div>
          
          <div class="plan-details">
            <h2>Your Selected Plan</h2>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
              <div>
                <p style="font-weight: bold; font-size: 18px; margin: 0;">${planName}</p>
                <p style="color: #777; font-size: 14px; margin: 5px 0 0 0;">Tailored for your business needs</p>
              </div>
              <div style="text-align: right;">
                <div class="price">$${
                  formData.planData.billingPreference === "annual"
                    ? Math.round(formData.planData.annualPrice / 12)
                    : formData.planData.monthlyPrice
                }/mo</div>
                <div class="price-note">
                  ${
                    formData.planData.billingPreference === "annual"
                      ? `$${formData.planData.annualPrice} billed annually`
                      : `Billed quarterly`
                  }
                </div>
              </div>
            </div>
            
            <h3 style="margin-bottom: 10px;">Key Features:</h3>
            <div class="feature-list">
              ${
                formData.planData.recommendedPlan === "tier5"
                  ? `
                  <div class="feature-item">Advanced inventory management</div>
                  <div class="feature-item">Advanced supply chain management</div>
                  <div class="feature-item">Custom integrations</div>
                  <div class="feature-item">Advanced security features</div>
                  <div class="feature-item">Up to 25 user accounts</div>
                  `
                  : formData.planData.recommendedPlan === "tier6"
                    ? `
                  <div class="feature-item">Multi-location support (up to 25 locations)</div>
                  <div class="feature-item">Advanced analytics with AI-powered insights</div>
                  <div class="feature-item">Advanced API access</div>
                  <div class="feature-item">Custom development</div>
                  <div class="feature-item">Up to 50 user accounts</div>
                  `
                    : formData.planData.recommendedPlan === "tier7"
                      ? `
                  <div class="feature-item">Global operations support</div>
                  <div class="feature-item">Enterprise-grade security</div>
                  <div class="feature-item">Dedicated development team</div>
                  <div class="feature-item">Custom workflows</div>
                  <div class="feature-item">Unlimited user accounts</div>
                  `
                      : formData.planData.recommendedPlan === "tier8"
                        ? `
                  <div class="feature-item">Unlimited everything</div>
                  <div class="feature-item">Custom infrastructure</div>
                  <div class="feature-item">White-glove onboarding</div>
                  <div class="feature-item">Executive support line</div>
                  <div class="feature-item">Strategic partnership</div>
                  `
                        : `
                  <div class="feature-item">Advanced inventory management</div>
                  <div class="feature-item">Multi-location support</div>
                  <div class="feature-item">Advanced analytics</div>
                  <div class="feature-item">Priority support</div>
                  `
              }
            </div>
          </div>
          
          <div class="next-steps">
            <h2>Next Steps</h2>
            <ol>
              <li>Our enterprise team will review your request within 24 hours.</li>
              <li>A dedicated account manager will contact you to discuss your specific requirements.</li>
              <li>We'll provide a customized demo tailored to your business needs.</li>
              <li>Together, we'll finalize your implementation plan and timeline.</li>
            </ol>
          </div>
          
          ${
            formData.implementationTimeline
              ? `
              <div class="meeting-info">
                <p style="font-weight: bold; color: #392A17; margin-top: 0;">Implementation Timeline:</p>
                <p style="margin-bottom: 0;">Based on your preferences, we've noted your desired implementation timeline of <strong>${
                  formData.implementationTimeline === "immediate"
                    ? "Immediate (1-2 weeks)"
                    : formData.implementationTimeline === "1-3months"
                      ? "1-3 months"
                      : formData.implementationTimeline === "3-6months"
                        ? "3-6 months"
                        : "6+ months"
                }</strong>.</p>
              </div>
              `
              : ""
          }
          
          <div class="contact-box">
            <p style="margin: 0; font-size: 16px;">Have questions? Contact us at <a href="mailto:enterprise@maamul.com">enterprise@maamul.com</a></p>
          </div>
        </div>
        
        <div class="footer">
          <p>&copy; 2025 Maamul. All rights reserved.</p>
          <p>This email was sent to you because you requested information about our enterprise plans.</p>
        </div>
      </div>
    </body>
    </html>
  `,
    }

    // Send both emails
    await Promise.all([transporter.sendMail(adminMailOptions), transporter.sendMail(userMailOptions)])

    return NextResponse.json({
      success: true,
      message: "Your plan request has been submitted successfully. Our team will contact you shortly.",
    })
  } catch (error) {
    console.error("Email error:", error)
    return NextResponse.json({ error: "Failed to submit request. Please try again." }, { status: 500 })
  }
}
