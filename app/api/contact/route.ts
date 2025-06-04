import { NextResponse } from "next/server"
import nodemailer from "nodemailer"

// Create transporter outside the handler to reuse it
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
    const body = await request.json()

    // Email to admin
    const adminMailOptions = {
      from: "no-reply@maamul.com",
      to: "support@maamul.com",
      subject: "New Business Application",
      html: `
  <div style="text-align: center; margin-bottom: 20px;">
    <div style="font-size: 60px; color: #D6B98F;">𐒑</div>
  </div>
  <h2>New Business Application Received</h2>
        <h3>Business Information:</h3>
        <p>Business Type: ${body.businessType}</p>
        <p>Business Size: ${body.businessSize}</p>
        <p>Location: ${body.location}</p>
        
        <h3>Operations:</h3>
        <p>Current Operations: ${body.currentOperations}</p>
        <p>Challenges: ${body.challenges}</p>
        
        <h3>Features Requested:</h3>
        <p>${Array.isArray(body.features) ? body.features.join(", ") : body.features}</p>
        <p>Timeline: ${body.timeline}</p>
        
        <h3>Contact Information:</h3>
        <p>Name: ${body.name}</p>
        <p>Email: ${body.email}</p>
        <p>Phone: ${body.phone}</p>
        <p>Preferred Contact: ${body.preferredContact}</p>
      `,
    }

    // Email to user
    const userMailOptions = {
      from: "no-reply@maamul.com",
      to: body.email,
      subject: "Thank you for your application",
      html: `
  <div style="text-align: center; margin-bottom: 20px;">
    <div style="font-size: 60px; color: #D6B98F;">𐒑</div>
  </div>
  <h2>Thank you for your application!</h2>
        <p>Dear ${body.name},</p>
        <p>We have received your application and will review it shortly. Our team will contact you via your preferred method (${body.preferredContact ? body.preferredContact : "email"}) within 1-2 business days.</p>
        <p>If you have any questions before we contact you, please use the chat assistant on our website.</p>
        <p>Best regards,<br>The Maamul Team</p>
      `,
    }

    // Send both emails
    await Promise.all([transporter.sendMail(adminMailOptions), transporter.sendMail(userMailOptions)])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Email error:", error)
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
  }
}
