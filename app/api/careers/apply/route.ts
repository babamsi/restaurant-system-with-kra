import { NextResponse } from "next/server"
import nodemailer from "nodemailer"
import { v4 as uuidv4 } from "uuid"

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
  console.log("Starting application submission process")
  try {
    const formData = await request.formData()
    console.log("Form data received:", Object.fromEntries(formData))

    const fullName = formData.get("fullName") as string
    const email = formData.get("email") as string
    const phone = formData.get("phone") as string
    const position = formData.get("position") as string
    const department = formData.get("department") as string
    const location = formData.get("location") as string
    const experience = formData.get("experience") as string
    const languages = formData.get("languages") as string
    const internetSpeed = formData.get("internetSpeed") as string
    const coverLetter = formData.get("coverLetter") as string

    console.log("Form data parsed:", { fullName, email, position })

    const files: File[] = []
    for (const [key, value] of formData.entries()) {
      if (value instanceof File && value.size > 0) {
        files.push(value)
      }
    }
    console.log(`Number of files received: ${files.length}`)

    console.log("Processing files...")
    const attachments = await Promise.all(
      files.map(async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer())
        return {
          filename: `${uuidv4()}-${file.name}`,
          content: buffer,
        }
      }),
    )
    console.log("All files processed")

    console.log("Preparing to send emails...")
    // Email to admin
    const adminMailOptions = {
      from: "no-reply@maamul.com",
      to: "support@maamul.com",
      subject: "New Job Application",
      html: `
        <h2>New Job Application Received</h2>
        <p><strong>Full Name:</strong> ${fullName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Position:</strong> ${position}</p>
        <p><strong>Department:</strong> ${department}</p>
        <p><strong>Location:</strong> ${location}</p>
        <p><strong>Experience:</strong> ${experience}</p>
        <p><strong>Languages:</strong> ${languages}</p>
        <p><strong>Internet Speed:</strong> ${internetSpeed} Mbps</p>
        <p><strong>Cover Letter:</strong> ${coverLetter}</p>
        <p><strong>Attached Files:</strong> ${attachments.map((file) => file.filename).join(", ")}</p>
      `,
      attachments: attachments,
    }

    // Email to applicant
    const applicantMailOptions = {
      from: "no-reply@maamul.com",
      to: email,
      subject: "Application Received - Maamul Careers",
      html: `
        <h2>Thank you for your application!</h2>
        <p>Dear ${fullName},</p>
        <p>We have received your application for the ${position} position at Maamul. Our team will review your application and get back to you soon.</p>
        <p>Best regards,<br>Maamul Team</p>
      `,
    }

    // Send both emails
    console.log("Sending admin email...")
    await transporter.sendMail(adminMailOptions)
    console.log("Admin email sent")

    console.log("Sending applicant email...")
    await transporter.sendMail(applicantMailOptions)
    console.log("Applicant email sent")

    console.log("Application submission completed successfully")
    return NextResponse.json({
      success: true,
      message: "Application submitted successfully",
    })
  } catch (error) {
    console.error("Application submission error:", error)
    console.error("Error details:", JSON.stringify(error, Object.getOwnPropertyNames(error)))
    return NextResponse.json({ error: "Failed to process application", details: error.message }, { status: 500 })
  }
}
