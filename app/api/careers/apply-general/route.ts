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
    const formData = await request.formData()
    const fullName = formData.get("fullName") as string
    const email = formData.get("email") as string
    const phone = formData.get("phone") as string
    const coverLetter = formData.get("coverLetter") as string
    const resume = formData.get("resume") as File | null

    const attachments = []
    if (resume) {
      const buffer = Buffer.from(await resume.arrayBuffer())
      attachments.push({
        filename: resume.name,
        content: buffer,
      })
    }

    // Email to admin
    const adminMailOptions = {
      from: "no-reply@maamul.com",
      to: "support@maamul.com",
      subject: "New General Job Application",
      html: `
        <h2>New General Job Application Received</h2>
        <p><strong>Full Name:</strong> ${fullName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Cover Letter:</strong> ${coverLetter}</p>
        <p><strong>Resume:</strong> ${resume ? resume.name : "Not provided"}</p>
      `,
      attachments: attachments,
    }

    // Email to applicant
    const applicantMailOptions = {
      from: "no-reply@maamul.com",
      to: email,
      subject: "General Application Received - Maamul Careers",
      html: `
        <h2>Thank you for your general application!</h2>
        <p>Dear ${fullName},</p>
        <p>We have received your general application for Maamul. Our team will review your application and get back to you if we have any suitable positions matching your skills and experience.</p>
        <p>Best regards,<br>Maamul Team</p>
      `,
    }

    // Send both emails
    await Promise.all([transporter.sendMail(adminMailOptions), transporter.sendMail(applicantMailOptions)])

    return NextResponse.json({
      success: true,
      message: "General application submitted successfully",
    })
  } catch (error) {
    console.error("Application submission error:", error)
    return NextResponse.json(
      { error: "Failed to process general application", details: error.message },
      { status: 500 },
    )
  }
}
