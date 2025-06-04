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

    // Format questionnaire data for email
    const questionnaireInfo = formData.additionalInfo
      ? Object.entries(formData.additionalInfo)
          .map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`)
          .join("")
      : ""

    // Email to admin
    const adminMailOptions = {
      from: "no-reply@maamul.com",
      to: "support@maamul.com", // Change this to your actual email
      subject: "New Beta Access Request",
      html: `
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="font-size: 60px; color: #D6B98F;">𐒑</div>
        </div>
        <h2>New Beta Access Request</h2>
        <p><strong>Business Name:</strong> ${formData.businessName}</p>
        <p><strong>Contact Name:</strong> ${formData.contactName}</p>
        <p><strong>Email:</strong> ${formData.email}</p>
        <p><strong>Phone:</strong> ${formData.phone || "Not provided"}</p>
        <p><strong>Business Size:</strong> ${formData.businessSize || "Not provided"}</p>
        <p><strong>Interests:</strong> ${Array.isArray(formData.interests) ? formData.interests.join(", ") : "Not provided"}</p>
        <p><strong>Message:</strong> ${formData.message || "Not provided"}</p>
        
        ${
          formData.additionalInfo && Object.keys(formData.additionalInfo).length > 0
            ? `
          <h3>Questionnaire Information:</h3>
          <ul>
            ${questionnaireInfo}
          </ul>
        `
            : ""
        }
      `,
    }

    // Email to user
    const userMailOptions = {
      from: "no-reply@maamul.com",
      to: formData.email,
      subject: "Your Maamul Beta Access Request",
      html: `
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="font-size: 60px; color: #D6B98F;">𐒑</div>
        </div>
        <h2>Thank you for your interest in Maamul!</h2>
        <p>Dear ${formData.contactName},</p>
        <p>We have received your request for beta access to Maamul. Our team will review your application and get back to you shortly.</p>
        
        ${
          formData.additionalInfo && formData.additionalInfo.recommendedPlan
            ? `
          <p>Based on your questionnaire responses, we've identified our <strong>${formData.additionalInfo.recommendedPlan.replace("tier", "Enterprise ")}</strong> plan as a potential fit for your business needs.</p>
        `
            : ""
        }
        
        <p>Here's a summary of the information you provided:</p>
        <ul>
          <li><strong>Business Name:</strong> ${formData.businessName}</li>
          ${formData.businessSize ? `<li><strong>Business Size:</strong> ${formData.businessSize}</li>` : ""}
          ${formData.interests && formData.interests.length > 0 ? `<li><strong>Interests:</strong> ${formData.interests.join(", ")}</li>` : ""}
        </ul>
        
        <p>If you have any questions in the meantime, please don't hesitate to contact us.</p>
        <p>Best regards,<br>The Maamul Team</p>
      `,
    }

    // Send both emails
    await Promise.all([transporter.sendMail(adminMailOptions), transporter.sendMail(userMailOptions)])

    return NextResponse.json({
      success: true,
      message: "Your request has been submitted successfully. We will contact you shortly.",
    })
  } catch (error) {
    console.error("Email error:", error)
    return NextResponse.json({ error: "Failed to submit request. Please try again." }, { status: 500 })
  }
}
