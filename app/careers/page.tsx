"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CareerForm } from "@/components/career-form"
import { Toaster } from "sonner"
import { CareersFAQ } from "@/components/careers-faq"
import { JobDescriptionModal } from "@/components/job-description-modal"
import { GeneralApplicationForm } from "@/components/general-application-form"

const jobListings = [
  {
    id: "v-marketing-director-001",
    title: "Marketing Director",
    department: "Marketing",
    location: "Virtual",
    type: "Full-time",
    deadline: "5 August 2025",
    description:
      "Lead Maamul's marketing efforts to build brand awareness, drive customer acquisition, and support business growth in East Africa. You'll develop and execute comprehensive marketing strategies across various channels.",
    requirements: [
      "Bachelor's degree in Marketing, Business, or related field; Master's degree is a plus",
      "7+ years of experience in marketing, with at least 3 years in a leadership role",
      "Proven track record in developing and executing successful marketing campaigns",
      "Strong understanding of digital marketing, content marketing, and brand management",
      "Excellent leadership and team management skills",
      "Data-driven approach with strong analytical abilities",
      "Fluent in English and Swahili; knowledge of East African markets",
      "Minimum 10 Mbps internet speed for efficient remote work",
      "Healthy lifestyle habits to maintain creativity and high performance",
      "Minimum 3 years of consistency in career direction",
    ],
    responsibilities: [
      "Develop and implement comprehensive marketing strategies aligned with business goals",
      "Lead and mentor the marketing team to achieve objectives",
      "Manage marketing budget and resource allocation",
      "Oversee brand management and ensure consistent messaging across all channels",
      "Collaborate with sales and product teams to support revenue growth",
      "Analyze marketing performance and provide regular reports to leadership",
      "Stay updated on marketing trends and best practices in the East African market",
    ],
  },
  {
    id: "v-sales-manager-001",
    title: "Sales Manager",
    department: "Sales",
    location: "Virtual",
    type: "Full-time",
    deadline: "5 August 2025",
    description:
      "Lead Maamul's sales team to drive revenue growth and market expansion in East Africa. You'll develop and execute sales strategies, manage key accounts, and build strong client relationships.",
    requirements: [
      "Bachelor's degree in Business, Marketing, or related field",
      "5+ years of experience in B2B sales, with at least 2 years in a managerial role",
      "Proven track record of achieving and exceeding sales targets",
      "Strong leadership and team management skills",
      "Excellent negotiation and communication abilities",
      "Experience with CRM systems and sales analytics tools",
      "Fluent in English and Swahili; knowledge of other East African languages is a plus",
      "Minimum 10 Mbps internet speed for efficient remote work",
      "Healthy lifestyle habits to maintain high energy and performance",
      "Minimum 3 years of consistency in career direction",
    ],
    responsibilities: [
      "Develop and implement sales strategies to achieve revenue targets",
      "Lead and motivate the sales team to meet and exceed goals",
      "Manage key client accounts and build strong relationships",
      "Collaborate with marketing to align sales efforts with marketing campaigns",
      "Analyze sales data and market trends to inform strategy",
      "Provide regular sales forecasts and reports to leadership",
      "Ensure compliance with company policies and ethical sales practices",
    ],
  },
  {
    id: "v-legal-counsel-001",
    title: "Legal Counsel",
    department: "Legal",
    location: "Virtual",
    type: "Full-time",
    deadline: "5 August 2025",
    description:
      "Provide comprehensive legal support to Maamul, ensuring compliance with East African regulations and protecting the company's interests. You'll handle a wide range of legal matters and work closely with various departments.",
    requirements: [
      "Law degree from a recognized institution; admission to the Kenyan bar or equivalent",
      "5+ years of experience in corporate law, preferably in technology or SaaS companies",
      "Strong knowledge of East African business and technology laws and regulations",
      "Excellent analytical and problem-solving skills",
      "Outstanding written and verbal communication abilities",
      "Fluent in English and Swahili; knowledge of other East African languages is a plus",
      "Minimum 10 Mbps internet speed for efficient remote work",
      "Ability to work independently and as part of a team",
      "Healthy lifestyle habits to maintain focus and handle high-pressure situations",
      "Minimum 3 years of consistency in career direction",
    ],
    responsibilities: [
      "Provide legal advice on corporate matters, contracts, and compliance issues",
      "Draft, review, and negotiate various commercial agreements",
      "Manage intellectual property matters, including trademarks and patents",
      "Ensure company compliance with relevant laws and regulations",
      "Collaborate with external counsel when necessary",
      "Conduct legal research and provide guidance on new laws affecting the business",
      "Support the HR department on employment law matters",
    ],
  },
  {
    id: "v-pm-001",
    title: "Project Manager",
    department: "Operations",
    location: "Virtual",
    type: "Full-time",
    deadline: "5 August 2025",
    description:
      "Lead and coordinate cross-functional projects to drive Maamul's growth and operational efficiency. You'll ensure successful project delivery while managing resources, timelines, and stakeholder expectations.",
    requirements: [
      "Bachelor's degree in Business, Engineering, or related field; PMP certification is a plus",
      "4+ years of experience in project management, preferably in software or technology",
      "Strong knowledge of project management methodologies and tools",
      "Excellent leadership and team management skills",
      "Outstanding communication and stakeholder management abilities",
      "Experience with agile project management practices",
      "Fluent in English; knowledge of Swahili or Somali is advantageous",
      "Minimum 10 Mbps internet speed for seamless virtual collaboration",
      "Healthy lifestyle habits to maintain high performance and stress management",
      "Minimum 3 years of consistency in career direction",
    ],
    responsibilities: [
      "Plan, execute, and close projects on time, within scope, and budget",
      "Develop and maintain project schedules, resource allocations, and risk management plans",
      "Coordinate cross-functional teams and manage project dependencies",
      "Communicate project status, issues, and risks to stakeholders at all levels",
      "Identify and resolve project bottlenecks and conflicts",
      "Ensure project alignment with company goals and strategies",
      "Continuously improve project management processes and methodologies",
    ],
  },
  {
    id: "v-internship-001",
    title: "Internship Program (Fresh Graduate)",
    department: "Various Departments",
    location: "Virtual",
    type: "Internship",
    deadline: "5 August 2025",
    description:
      "Join Maamul's comprehensive internship program designed for fresh graduates. You'll gain hands-on experience across various departments including Engineering, Marketing, Sales, Customer Success, and Operations while contributing to real projects that impact East African businesses.",
    requirements: [
      "Recent graduate (within 12 months) with a Bachelor's degree in any relevant field",
      "Strong academic performance with a minimum GPA of 3.0 or equivalent",
      "Excellent communication skills in English; knowledge of Swahili or Somali is a plus",
      "Demonstrated interest in technology, business operations, or related fields",
      "Strong problem-solving and analytical thinking abilities",
      "Ability to work independently and as part of a remote team",
      "Minimum 10 Mbps internet speed for efficient remote work",
      "Healthy lifestyle habits to maintain focus and productivity",
      "Eagerness to learn and contribute to a fast-growing company",
      "Available for a 6-month internship program with potential for full-time conversion",
    ],
    responsibilities: [
      "Rotate through different departments to gain comprehensive business experience",
      "Work on real projects that contribute to Maamul's growth and operations",
      "Assist senior team members with research, analysis, and project execution",
      "Participate in training sessions and professional development workshops",
      "Contribute to process improvements and innovative solutions",
      "Prepare reports and presentations on assigned projects",
      "Collaborate with team members across different time zones and departments",
    ],
  },
]

const renderJobList = (jobs: typeof jobListings, openJobModal: (jobId: string) => void) => (
  <div className="space-y-4">
    {jobs.map((job) => (
      <Card
        key={job.id}
        className="cursor-pointer transition-colors duration-200 hover:bg-muted rounded-xl"
        onClick={() => openJobModal(job.id)}
      >
        <CardHeader className="p-4">
          <CardTitle className="text-lg">{job.title}</CardTitle>
          <CardDescription className="text-sm">
            {job.department} • {job.location} • {job.type}
          </CardDescription>
          <CardDescription className="text-sm text-primary">Deadline: {job.deadline}</CardDescription>
        </CardHeader>
      </Card>
    ))}
  </div>
)

export default function CareersPage() {
  const [selectedJob, setSelectedJob] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)

  const openJobModal = (jobId: string) => {
    setSelectedJob(jobId)
    setIsModalOpen(true)
  }

  const closeJobModal = () => {
    setIsModalOpen(false)
  }

  return (
    <div className="min-h-screen bg-background dark:bg-gray-900">
      <Toaster />
      <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8 max-w-6xl">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Link
            href="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Return to Home
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl mb-6">
            Join Our Team
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Help us transform East African businesses with innovative management solutions.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-16"
        >
          <h2 className="text-2xl font-bold mb-6">Open Positions</h2>
          {renderJobList(jobListings, openJobModal)}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mb-16"
        >
          <Button
            className="w-full mb-4 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => setIsFormOpen(!isFormOpen)}
          >
            {isFormOpen ? "Hide Application Form" : "Show Application Form"}
            {isFormOpen ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
          </Button>
          {isFormOpen && (
            <div className="bg-card p-6 rounded-xl shadow-lg">
              <CareerForm />
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mb-16 p-6 rounded-xl"
        >
          <h2 className="text-2xl font-bold mb-6 text-center">Frequently Asked Questions</h2>
          <CareersFAQ />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-center bg-primary/5 dark:bg-primary/10 p-8 rounded-xl shadow-lg"
        >
          <h2 className="text-2xl font-bold tracking-tight text-foreground mb-4">Don't See a Suitable Position?</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            We're always looking for talented individuals to join our team. If you don't see a position that matches
            your skills, feel free to send us your resume for future opportunities.
          </p>
          <GeneralApplicationForm />
        </motion.div>
      </div>

      {selectedJob && (
        <JobDescriptionModal
          isOpen={isModalOpen}
          onClose={closeJobModal}
          job={jobListings.find((job) => job.id === selectedJob)!}
        />
      )}
    </div>
  )
}
