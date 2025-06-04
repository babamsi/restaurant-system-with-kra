import { NextResponse } from "next/server"
import nodemailer from "nodemailer"
import { format } from "date-fns"

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

    // Format meeting date and time for email
    const meetingDate = format(new Date(formData.meetingDate), "MMMM do, yyyy")
    const meetingTime = formData.meetingTime

    // Email to admin
    const adminMailOptions = {
      from: "no-reply@maamul.com",
      to: "support@maamul.com",
      subject: "New Strategic Partner Application",
      html: `
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="font-size: 60px; color: #D6B98F;">𐒑</div>
        </div>
        <h2>New Strategic Partner Application Received</h2>
        
        <h3>Company Information:</h3>
        <p>Company Name: ${formData.companyName}</p>
        <p>Website: ${formData.website}</p>
        <p>Business Type: ${formData.businessType}</p>
        <p>Years in Business: ${formData.yearsInBusiness}</p>
        
        <h3>Contact Information:</h3>
        <p>Contact Name: ${formData.contactName}</p>
        <p>Role: ${formData.role}</p>
        <p>Email: ${formData.email}</p>
        <p>Phone: ${formData.phone}</p>
        
        <h3>Meeting Schedule:</h3>
        <p>Preferred Date: ${meetingDate}</p>
        <p>Preferred Time: ${meetingTime}</p>
        
        <h3>Strategic Alignment:</h3>
        <p>Primary Objective: ${formData.primaryObjective}</p>
        <p>Target Markets: ${formData.targetMarkets.join(", ")}</p>
        <p>Areas of Expertise: ${formData.expertise.join(", ")}</p>
        <p>Existing Clients & Market Presence:</p>
        <p>${formData.existingClients}</p>
        
        <h3>Partnership Vision:</h3>
        <p>Collaboration Ideas:</p>
        <p>${formData.collaborationIdeas}</p>
        
        <p>Resources & Commitment:</p>
        <p>${formData.resourcesCommitment}</p>
        
        <p>Expected Outcomes:</p>
        <p>${formData.expectedOutcomes}</p>
      `,
    }

    // Email to partner
    const partnerMailOptions = {
      from: "no-reply@maamul.com",
      to: formData.email,
      subject: "Thank you for your interest in partnering with Maamul",
      html: `
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="font-size: 60px; color: #D6B98F;">𐒑</div>
        </div>
        <h2>Thank you for your interest in partnering with Maamul!</h2>
        
        <p>Dear ${formData.contactName},</p>
        
        <p>We have received your strategic partnership application for ${formData.companyName}. We appreciate the detailed information you've provided about your vision for collaboration with Maamul.</p>

        <h3>Meeting Schedule:</h3>
        <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 5px;">
          <p><strong>Your preferred meeting time has been noted:</strong></p>
          <p>Date: ${meetingDate}</p>
          <p>Time: ${meetingTime}</p>
          <p><em>Note: Our team will confirm this schedule or propose alternative times if needed.</em></p>
        </div>
        
        <h3>Next Steps:</h3>
        <ol>
          <li>Our partnership team will review your application within the next 2-3 business days.</li>
          <li>We will confirm your meeting schedule or suggest alternative times if needed.</li>
          <li>During our discussion, we'll explore alignment and opportunities in more detail.</li>
          <li>Based on our discussion, we'll develop a customized partnership framework.</li>
        </ol>
        
        <h3>Application Summary:</h3>
        <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 5px;">
          <p><strong>Company Name:</strong> ${formData.companyName}</p>
          <p><strong>Primary Objective:</strong> ${formData.primaryObjective}</p>
          <p><strong>Target Markets:</strong> ${formData.targetMarkets.join(", ")}</p>
          <p><strong>Areas of Expertise:</strong> ${formData.expertise.join(", ")}</p>
        </div>
        
        <p>If you have any questions before we contact you, please use the chatbot assistant on our website.</p>
        
        <p>Best regards,<br>The Maamul Team</p>
      `,
    }

    // Send both emails
    await Promise.all([transporter.sendMail(adminMailOptions), transporter.sendMail(partnerMailOptions)])

    return NextResponse.json({
      success: true,
      message: "Partner application submitted successfully",
    })
  } catch (error) {
    console.error("Email error:", error)
    return NextResponse.json({ error: "Failed to process partner application" }, { status: 500 })
  }
}
