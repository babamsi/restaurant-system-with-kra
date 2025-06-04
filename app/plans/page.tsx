"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Check,
  Shield,
  Cloud,
  Server,
  ArrowRight,
  BarChart,
  Users,
  Zap,
  Award,
  Calculator,
  Building2,
  Globe,
  DollarSign,
  Briefcase,
  MapPin,
  UserPlus,
  Database,
  Layers,
  PieChart,
  ShieldCheck,
  Workflow,
  Calendar,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import dynamic from "next/dynamic"

// Use dynamic import with ssr: false to prevent server-side rendering
const DynamicPlanAccessForm = dynamic(() => import("@/components/plan-access-form").then((mod) => mod.PlanAccessForm), {
  ssr: false,
})

// Add this type declaration at the top of the file, after the imports
declare global {
  interface Window {
    __questionnaire_data?: Record<string, any>
  }
}

// All plan tiers data
const allPlans = [
  {
    id: "tier1",
    name: "Starter",
    description: "For small businesses just getting started",
    monthlyPrice: 58,
    annualPrice: 696, // Annual price
    revenue: "< 10k",
    useCase: "Perfect for: New businesses with 1-3 employees handling up to 500 inventory items per month",
    features: [
      {
        name: "Inventory management - Track stock levels in real-time and set low stock alerts",
        category: "Core",
        highlight: true,
      },
      { name: "Expense tracking - Categorize and monitor all business expenses", category: "Core" },
      { name: "Customer management - Store customer information and purchase history", category: "Core" },
      { name: "Employee management - Track basic employee information and schedules", category: "Core" },
      { name: "Supply chain management - Manage suppliers and purchase orders", category: "Core" },
      { name: "Dashboard analytics - View key business metrics at a glance", category: "Analytics" },
      { name: "Payment solution - Process payments with popular local methods", category: "Payments", highlight: true },
      { name: "Purchasing & invoicing - Create and manage purchase orders and invoices", category: "Core" },
      { name: "POS system - Process sales and print receipts", category: "Sales", highlight: true },
      { name: "1-3 user accounts - Provide access to key team members", category: "Access" },
      { name: "Secure cloud option - Keep your data safe in the cloud", category: "Security" },
      { name: "Local storage option - Store data on your own devices", category: "Security" },
      { name: "Private cloud option - Deploy in your own cloud environment", category: "Security" },
    ],
    color: "from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10",
    borderColor: "border-blue-200 dark:border-blue-800/30",
    icon: Zap,
  },
  {
    id: "tier2",
    name: "Growth",
    description: "For growing businesses with expanding needs",
    monthlyPrice: 145,
    annualPrice: 1740, // Annual price
    revenue: "11k - 30k",
    useCase: "Ideal for: Established businesses with 4-10 employees managing 1,000+ monthly transactions",
    features: [
      { name: "All Starter features - Everything in the Starter plan plus more", category: "Core" },
      { name: "Up to 9 user accounts - Expand access to your growing team", category: "Access", highlight: true },
      {
        name: "Online ordering - Allow customers to place orders through your website",
        category: "Sales",
        highlight: true,
      },
      {
        name: "Multi-location support - Manage inventory across up to 3 locations",
        category: "Advanced",
        highlight: true,
      },
      { name: "Online/offline operation - Continue working even without internet", category: "Core" },
    ],
    color: "from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/10",
    borderColor: "border-green-200 dark:border-green-800/30",
    icon: BarChart,
  },
  {
    id: "tier3",
    name: "Professional",
    description: "For established businesses with significant operations",
    monthlyPrice: 290,
    annualPrice: 3480, // Annual price
    revenue: "31k - 60k",
    useCase: "Perfect for: Growing businesses with 11-25 employees needing advanced reporting and analytics",
    features: [
      { name: "All Growth features - Everything in the Growth plan plus more", category: "Core" },
      {
        name: "Advanced analytics - Gain deeper insights with custom reports and dashboards",
        category: "Analytics",
        highlight: true,
      },
      { name: "Enhanced security features - Additional protection for sensitive data", category: "Security" },
      {
        name: "Priority support - Get faster responses to your support requests",
        category: "Support",
        highlight: true,
      },
      { name: "Advanced inventory forecasting - Predict stock needs based on sales trends", category: "Advanced" },
    ],
    color: "from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/10",
    borderColor: "border-purple-200 dark:border-purple-800/30",
    icon: PieChart,
  },
  {
    id: "tier4",
    name: "Business",
    description: "For larger businesses with complex requirements",
    monthlyPrice: 580,
    annualPrice: 6960, // Annual price
    revenue: "61k - 99k",
    useCase: "Ideal for: Businesses with 26-50 employees operating across multiple locations",
    features: [
      { name: "All Professional features - Everything in the Professional plan plus more", category: "Core" },
      {
        name: "Advanced multi-location management - Seamlessly manage up to 10 locations",
        category: "Advanced",
        highlight: true,
      },
      {
        name: "Custom reporting - Build reports tailored to your specific business needs",
        category: "Analytics",
        highlight: true,
      },
      { name: "API access - Integrate with other business systems and applications", category: "Advanced" },
      {
        name: "Dedicated account manager - Get personalized support from a dedicated representative",
        category: "Support",
        highlight: true,
      },
    ],
    color: "from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/10",
    borderColor: "border-orange-200 dark:border-orange-800/30",
    icon: Briefcase,
  },
  {
    id: "tier5",
    name: "Enterprise S",
    description: "For large businesses with complex operations",
    monthlyPrice: 1160,
    annualPrice: 1160 * 12 * 0.85, // Apply 15% discount
    revenue: "100k - 300k",
    useCase: "Perfect for: Medium enterprises with 51-100 employees requiring advanced customization",
    features: [
      {
        name: "Advanced inventory management - Multi-warehouse tracking with automated workflows",
        category: "Core",
        highlight: true,
      },
      { name: "Advanced expense tracking - Detailed expense categorization and approval workflows", category: "Core" },
      {
        name: "Up to 25 user accounts - Provide access to your entire team with role-based permissions",
        category: "Access",
      },
      {
        name: "Advanced supply chain management - Optimize your entire supply chain with forecasting",
        category: "Advanced",
        highlight: true,
      },
      {
        name: "Custom integrations - Connect with your existing business systems",
        category: "Advanced",
        highlight: true,
      },
      { name: "Dedicated account manager - Get personalized support and strategic guidance", category: "Support" },
      { name: "24/7 priority support - Get help whenever you need it", category: "Support" },
      {
        name: "Advanced security features - Enterprise-grade protection for your data",
        category: "Security",
        highlight: true,
      },
    ],
    color: "from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/10",
    borderColor: "border-emerald-200 dark:border-emerald-800/30",
    icon: Shield,
  },
  {
    id: "tier6",
    name: "Enterprise M",
    description: "For major businesses with extensive operations",
    monthlyPrice: 2320,
    annualPrice: 2320 * 12 * 0.85, // Apply 15% discount
    revenue: "301k - 600k",
    useCase: "Ideal for: Large enterprises with 101-250 employees across multiple regions",
    features: [
      { name: "All Enterprise S features - Everything in the Enterprise S plan plus more", category: "Core" },
      { name: "Multi-location support - Seamlessly manage up to 25 locations", category: "Advanced", highlight: true },
      {
        name: "Advanced analytics - AI-powered insights and predictive analytics",
        category: "Analytics",
        highlight: true,
      },
      { name: "Custom development - Tailored solutions for your specific business needs", category: "Advanced" },
      { name: "Quarterly business reviews - Strategic planning sessions with our experts", category: "Support" },
      {
        name: "Advanced API access - Deep integration capabilities with your tech stack",
        category: "Advanced",
        highlight: true,
      },
      { name: "Up to 50 user accounts - Comprehensive access for your entire organization", category: "Access" },
    ],
    color: "from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/10",
    borderColor: "border-indigo-200 dark:border-indigo-800/30",
    icon: Cloud,
  },
  {
    id: "tier7",
    name: "Enterprise L",
    description: "For large enterprises with complex requirements",
    monthlyPrice: 4640,
    annualPrice: 4640 * 12 * 0.85, // Apply 15% discount
    revenue: "601k - 999k",
    useCase: "Perfect for: Major enterprises with 251-500 employees requiring global operations support",
    features: [
      { name: "All Enterprise M features - Everything in the Enterprise M plan plus more", category: "Core" },
      {
        name: "Global operations support - Manage business across multiple countries",
        category: "Advanced",
        highlight: true,
      },
      {
        name: "Enterprise-grade security - Advanced security protocols and compliance",
        category: "Security",
        highlight: true,
      },
      { name: "Custom workflows - Design and implement your own business processes", category: "Advanced" },
      {
        name: "Dedicated development team - Get a team focused on your implementation",
        category: "Support",
        highlight: true,
      },
      { name: "Executive business reviews - Strategic planning with our leadership team", category: "Support" },
      { name: "Unlimited user accounts - No restrictions on user access", category: "Access", highlight: true },
    ],
    color: "from-rose-50 to-rose-100 dark:from-rose-900/20 dark:to-rose-800/10",
    borderColor: "border-rose-200 dark:border-rose-800/30",
    icon: Server,
  },
  {
    id: "tier8",
    name: "Enterprise XL",
    description: "For major corporations with global operations",
    monthlyPrice: 9000,
    annualPrice: 9000 * 12 * 0.85, // Apply 15% discount
    revenue: "1m+",
    useCase: "Ideal for: Global corporations with 500+ employees requiring maximum customization",
    features: [
      { name: "All Enterprise L features - Everything in the Enterprise L plan plus more", category: "Core" },
      {
        name: "Unlimited everything - No restrictions on any platform capabilities",
        category: "Access",
        highlight: true,
      },
      { name: "Custom infrastructure - Dedicated hosting and infrastructure", category: "Advanced", highlight: true },
      { name: "White-glove onboarding - Comprehensive implementation support", category: "Support" },
      { name: "Executive support line - Direct access to senior support staff", category: "Support", highlight: true },
      { name: "Strategic partnership - Become a strategic partner in our roadmap", category: "Support" },
    ],
    color: "from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/10",
    borderColor: "border-amber-200 dark:border-amber-800/30",
    icon: Award,
  },
]

// Integration fees (one-time)
const integrationFees = [
  {
    id: "inventory",
    name: "Inventory Management",
    price: 1000,
    description: "Data migration from your existing inventory system",
    icon: BarChart,
  },
  {
    id: "expenses",
    name: "Expenses",
    price: 1000,
    description: "Import historical expense data from your current system",
    icon: Calculator,
  },
  {
    id: "customer",
    name: "Customer Management",
    price: 1000,
    description: "Migrate customer database and purchase history",
    icon: Users,
  },
  {
    id: "employee",
    name: "Employee Management",
    price: 1000,
    description: "Transfer employee records and schedules from existing HR system",
    icon: UserPlus,
  },
  {
    id: "supply",
    name: "Supply Chain Management",
    price: 1000,
    description: "Import supplier data and purchase history",
    icon: Workflow,
  },
  {
    id: "dashboard",
    name: "Dashboard",
    price: 2000,
    description: "Custom dashboard setup with your specific KPIs",
    icon: PieChart,
  },
  {
    id: "payment",
    name: "Payment Solution",
    price: 3000,
    description: "Integration with eDahab, WAAFI, and Mpesa payment systems",
    icon: DollarSign,
  },
  {
    id: "purchasing",
    name: "Purchasing & Invoicing",
    price: 1500,
    description: "Import purchase orders and invoice templates",
    icon: Briefcase,
  },
  {
    id: "pos",
    name: "POS",
    price: 500,
    description: "Setup and configuration of point of sale hardware",
    icon: Zap,
  },
]

// Security options
const securityOptions = [
  {
    id: "secure",
    name: "Secure Cloud",
    description:
      "Your data is securely stored in our enterprise-grade cloud infrastructure with end-to-end encryption, regular backups, and strict access controls.",
    icon: Shield,
    features: [
      "End-to-end encryption",
      "Regular automated backups",
      "Strict access controls",
      "99.9% uptime guarantee",
      "Compliance with industry standards",
    ],
  },
  {
    id: "local",
    name: "Local Storage",
    description:
      "Keep your data on your own servers with our on-premises solution. You maintain complete control while still benefiting from our powerful software.",
    icon: Server,
    features: [
      "Complete data control",
      "No internet dependency",
      "Custom security policies",
      "Integration with existing systems",
      "Regular security updates",
    ],
  },
  {
    id: "private",
    name: "Private Cloud",
    description:
      "Deploy Maamul in your own private cloud environment. Ideal for businesses with specific compliance or regulatory requirements.",
    icon: Cloud,
    features: [
      "Dedicated cloud resources",
      "Custom compliance settings",
      "Enhanced security features",
      "Flexible deployment options",
      "Dedicated support team",
    ],
  },
]

// Business needs for the questionnaire
const businessNeeds = [
  {
    id: "inventory",
    label: "Inventory Management",
    description: "Track and manage your product inventory",
    icon: Layers,
  },
  { id: "pos", label: "Point of Sale", description: "Process sales and transactions", icon: Zap },
  {
    id: "customers",
    label: "Customer Management",
    description: "Manage customer information and relationships",
    icon: Users,
  },
  {
    id: "employees",
    label: "Employee Management",
    description: "Track employee information and performance",
    icon: UserPlus,
  },
  {
    id: "expenses",
    label: "Expense Tracking",
    description: "Monitor and categorize business expenses",
    icon: DollarSign,
  },
  {
    id: "reporting",
    label: "Advanced Reporting",
    description: "Generate detailed business reports and analytics",
    icon: PieChart,
  },
  { id: "multi", label: "Multiple Locations", description: "Manage multiple business locations", icon: MapPin },
  {
    id: "supply",
    label: "Supply Chain Management",
    description: "Optimize your supply chain processes",
    icon: Workflow,
  },
  {
    id: "security",
    label: "Enhanced Security",
    description: "Advanced security features for sensitive data",
    icon: ShieldCheck,
  },
  { id: "api", label: "API Access", description: "Connect with other systems via API", icon: Database },
]

// Industry options
const industryOptions = [
  { id: "retail", label: "Retail", icon: Building2 },
  { id: "wholesale", label: "Wholesale", icon: Briefcase },
  { id: "manufacturing", label: "Manufacturing", icon: Layers },
  { id: "logistics", label: "Logistics & Distribution", icon: Workflow },
  { id: "hospitality", label: "Hospitality", icon: Users },
  { id: "healthcare", label: "Healthcare", icon: Shield },
  { id: "agriculture", label: "Agriculture", icon: Globe },
  { id: "other", label: "Other", icon: Building2 },
]

// Questions for the typeform-like experience
const questions = [
  {
    id: "welcome",
    type: "welcome",
    title: "Find Your Perfect Enterprise Solution",
    description: "Answer a few questions to get a tailored plan recommendation for your business.",
  },
  {
    id: "industry",
    type: "single-select",
    title: "What industry is your business in?",
    description: "This helps us understand your specific needs.",
    options: industryOptions,
  },
  {
    id: "company-size",
    type: "single-select",
    title: "How many employees does your company have?",
    description: "This helps us determine the scale of your operations.",
    options: [
      { id: "micro", label: "1-3 employees", icon: Users },
      { id: "small", label: "4-10 employees", icon: Users },
      { id: "medium", label: "11-50 employees", icon: Users },
      { id: "large", label: "51-200 employees", icon: Users },
      { id: "enterprise", label: "200+ employees", icon: Users },
    ],
  },
  {
    id: "revenue",
    type: "single-select",
    title: "What is your monthly revenue?",
    description: "This helps us recommend the right plan tier.",
    options: [
      { id: "tier1", label: "Less than $10K", icon: DollarSign },
      { id: "tier2", label: "$11K - $30K", icon: DollarSign },
      { id: "tier3", label: "$31K - $60K", icon: DollarSign },
      { id: "tier4", label: "$61K - $99K", icon: DollarSign },
      { id: "tier5", label: "$100K - $300K", icon: DollarSign },
      { id: "tier6", label: "$301K - $600K", icon: DollarSign },
      { id: "tier7", label: "$601K - $999K", icon: DollarSign },
      { id: "tier8", label: "Over $1M", icon: DollarSign },
    ],
  },
  {
    id: "locations",
    type: "slider",
    title: "How many locations does your business operate in?",
    description: "This helps us determine your multi-location needs.",
    min: 1,
    max: 20,
    step: 1,
    defaultValue: 1,
  },
  {
    id: "needs",
    type: "multi-select",
    title: "What are your primary business needs?",
    description: "Select all that apply.",
    options: businessNeeds,
  },
  {
    id: "security",
    type: "single-select",
    title: "What type of data storage solution do you prefer?",
    description: "This helps us determine your security and compliance needs.",
    options: [
      { id: "secure", label: "Secure Cloud", description: "Enterprise-grade cloud infrastructure", icon: Shield },
      { id: "local", label: "Local Storage", description: "On-premises solution", icon: Server },
      { id: "private", label: "Private Cloud", description: "Your own private cloud environment", icon: Cloud },
    ],
  },
  {
    id: "users",
    type: "slider",
    title: "How many user accounts do you need?",
    description: "This helps us determine your access requirements.",
    min: 5,
    max: 100,
    step: 5,
    defaultValue: 10,
  },
  {
    id: "implementation-timeline",
    type: "single-select",
    title: "What is your preferred implementation timeline?",
    description: "This helps us plan resources for your onboarding.",
    options: [
      { id: "immediate", label: "Immediate (1-2 weeks)", icon: Calendar },
      { id: "1-3months", label: "1-3 months", icon: Calendar },
      { id: "3-6months", label: "3-6 months", icon: Calendar },
      { id: "6+months", label: "6+ months", icon: Calendar },
    ],
  },
  {
    id: "integrations",
    type: "multi-select",
    title: "Which integrations are you interested in?",
    description: "These are one-time setup fees.",
    options: integrationFees.map((fee) => ({
      id: fee.id,
      label: fee.name,
      description: `${fee.description} ($${fee.price} one-time)`,
      icon: fee.icon,
    })),
  },
  {
    id: "billing",
    type: "single-select",
    title: "Which billing cycle do you prefer?",
    description: "Annual billing saves 15% compared to quarterly.",
    options: [
      { id: "quarterly", label: "Quarterly Billing", icon: Calculator },
      { id: "annual", label: "Annual Billing (Save 15%)", icon: Calculator },
    ],
  },
]

export default function PlansPage() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({
    industry: "",
    "company-size": "",
    revenue: "",
    locations: 1,
    needs: [] as string[],
    security: "",
    users: 10,
    "implementation-timeline": "",
    integrations: [] as string[],
    billing: "quarterly",
  })
  const [showBetaForm, setShowBetaForm] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [recommendedPlan, setRecommendedPlan] = useState<string | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [totalCost, setTotalCost] = useState({
    monthly: 0,
    annual: 0,
    oneTime: 0,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Handle scroll events
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Calculate progress percentage
  const progressPercentage = (currentQuestionIndex / questions.length) * 100

  // Handle next question
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      window.scrollTo(0, 0)
    } else {
      // Process answers and show results
      processAnswers()
    }
  }

  // Handle previous question
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
      window.scrollTo(0, 0)
    }
  }

  // Handle answer changes
  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }))
  }

  // Process answers to determine recommended plan
  const processAnswers = () => {
    setIsSubmitting(true)

    // Simulate processing delay
    setTimeout(() => {
      // Determine plan based on revenue directly
      let recommendedPlanId = answers.revenue || "tier1" // Default to Starter if no revenue selected

      // Adjust based on company size
      if (answers["company-size"] === "enterprise" && !["tier7", "tier8"].includes(recommendedPlanId)) {
        // Upgrade one tier for very large companies
        const currentTierIndex = Number.parseInt(recommendedPlanId.replace("tier", ""))
        recommendedPlanId = `tier${Math.min(currentTierIndex + 1, 8)}`
      }

      // Adjust based on number of locations
      if (answers.locations > 5 && !["tier7", "tier8"].includes(recommendedPlanId)) {
        // Upgrade one tier for many locations
        const currentTierIndex = Number.parseInt(recommendedPlanId.replace("tier", ""))
        recommendedPlanId = `tier${Math.min(currentTierIndex + 1, 8)}`
      }

      // Adjust based on needs complexity
      if (answers.needs.length > 6 && !["tier7", "tier8"].includes(recommendedPlanId)) {
        // Upgrade one tier for complex needs
        const currentTierIndex = Number.parseInt(recommendedPlanId.replace("tier", ""))
        recommendedPlanId = `tier${Math.min(currentTierIndex + 1, 8)}`
      }

      // Calculate costs
      const plan = allPlans.find((p) => p.id === recommendedPlanId)
      if (!plan) return

      // Calculate one-time integration costs
      const oneTimeCost = answers.integrations.reduce((total: number, integrationId: string) => {
        const integration = integrationFees.find((i) => i.id === integrationId)
        return total + (integration ? integration.price : 0)
      }, 0)

      // Calculate monthly and annual costs
      const monthlyCost = plan.monthlyPrice
      const annualCost = plan.annualPrice

      // Set recommended plan and costs
      setRecommendedPlan(recommendedPlanId)
      setTotalCost({
        monthly: monthlyCost,
        annual: annualCost,
        oneTime: oneTimeCost,
      })

      // Store questionnaire data for the beta access form
      if (typeof window !== "undefined") {
        window.__questionnaire_data = {
          recommendedPlan: recommendedPlanId,
          industry: answers.industry,
          companySize: answers["company-size"],
          revenue: answers.revenue,
          locations: answers.locations,
          needs: answers.needs.join(", "),
          security: answers.security,
          users: answers.users,
          implementationTimeline: answers["implementation-timeline"],
          integrations: answers.integrations.join(", "),
          billingPreference: answers.billing,
          monthlyPrice: monthlyCost,
          annualPrice: annualCost,
          oneTimeCost: oneTimeCost,
        }
      }

      setIsSubmitting(false)
      setShowResults(true)
    }, 1500)
  }

  // Reset the questionnaire
  const resetQuestionnaire = () => {
    setCurrentQuestionIndex(0)
    setAnswers({
      industry: "",
      "company-size": "",
      revenue: "",
      locations: 1,
      needs: [] as string[],
      security: "",
      users: 10,
      "implementation-timeline": "",
      integrations: [] as string[],
      billing: "quarterly",
    })
    setRecommendedPlan(null)
    setShowResults(false)
    setTotalCost({
      monthly: 0,
      annual: 0,
      oneTime: 0,
    })
  }

  // Get current question
  const currentQuestion = questions[currentQuestionIndex]

  // Check if current question is answered
  const isCurrentQuestionAnswered = () => {
    if (!currentQuestion) return true

    switch (currentQuestion.type) {
      case "welcome":
        return true
      case "single-select":
        return !!answers[currentQuestion.id]
      case "multi-select":
        return Array.isArray(answers[currentQuestion.id]) && answers[currentQuestion.id].length > 0
      case "slider":
        return answers[currentQuestion.id] !== undefined
      default:
        return true
    }
  }

  // Render question based on type
  const renderQuestion = () => {
    if (!currentQuestion) return null

    switch (currentQuestion.type) {
      case "welcome":
        return (
          <div key="welcome" className="text-center max-w-2xl mx-auto animate-fade-in">
            <div className="mb-8">
              <div className="text-primary mx-auto mb-4 text-6xl font-serif">𐒑</div>
              <h1 className="text-4xl font-bold tracking-tight mb-4">{currentQuestion.title}</h1>
              <p className="text-lg text-muted-foreground">{currentQuestion.description}</p>
            </div>
            <Button
              size="lg"
              onClick={handleNextQuestion}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )

      case "single-select":
        return (
          <div key={currentQuestion.id} className="max-w-2xl mx-auto animate-fade-in">
            <h2 className="text-2xl font-bold mb-2">{currentQuestion.title}</h2>
            <p className="text-muted-foreground mb-6">{currentQuestion.description}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              {currentQuestion.options.map((option) => (
                <div
                  key={option.id}
                  onClick={() => handleAnswerChange(currentQuestion.id, option.id)}
                  className={`
                    p-4 rounded-lg border cursor-pointer transition-all duration-200
                    ${
                      answers[currentQuestion.id] === option.id
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      {React.createElement(option.icon, { className: "h-5 w-5 text-primary" })}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{option.label}</div>
                      {option.description && (
                        <div className="text-xs text-muted-foreground mt-1">{option.description}</div>
                      )}
                    </div>
                    {answers[currentQuestion.id] === option.id && <Check className="h-5 w-5 text-primary" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      case "multi-select":
        return (
          <div key={currentQuestion.id} className="max-w-2xl mx-auto animate-fade-in">
            <h2 className="text-2xl font-bold mb-2">{currentQuestion.title}</h2>
            <p className="text-muted-foreground mb-6">{currentQuestion.description}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              {currentQuestion.options.map((option) => {
                const isSelected =
                  Array.isArray(answers[currentQuestion.id]) && answers[currentQuestion.id].includes(option.id)

                return (
                  <div
                    key={option.id}
                    onClick={() => {
                      const currentAnswers = Array.isArray(answers[currentQuestion.id])
                        ? [...answers[currentQuestion.id]]
                        : []

                      if (isSelected) {
                        handleAnswerChange(
                          currentQuestion.id,
                          currentAnswers.filter((id) => id !== option.id),
                        )
                      } else {
                        handleAnswerChange(currentQuestion.id, [...currentAnswers, option.id])
                      }
                    }}
                    className={`
                      p-4 rounded-lg border cursor-pointer transition-all duration-200
                      ${
                        isSelected
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border hover:border-primary/50 hover:bg-muted/50"
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-full">
                        {React.createElement(option.icon, { className: "h-5 w-5 text-primary" })}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{option.label}</div>
                        {option.description && (
                          <div className="text-xs text-muted-foreground mt-1">{option.description}</div>
                        )}
                      </div>
                      {isSelected && <Check className="h-5 w-5 text-primary" />}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )

      case "slider":
        return (
          <div key={currentQuestion.id} className="max-w-2xl mx-auto animate-fade-in">
            <h2 className="text-2xl font-bold mb-2">{currentQuestion.title}</h2>
            <p className="text-muted-foreground mb-6">{currentQuestion.description}</p>

            <div className="space-y-8 mt-8">
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>{currentQuestion.min}</span>
                <span>{currentQuestion.max}</span>
              </div>

              <Slider
                value={[answers[currentQuestion.id] || currentQuestion.defaultValue]}
                min={currentQuestion.min}
                max={currentQuestion.max}
                step={currentQuestion.step}
                onValueChange={(value) => handleAnswerChange(currentQuestion.id, value[0])}
              />

              <div className="text-center text-2xl font-bold">
                {answers[currentQuestion.id] || currentQuestion.defaultValue}
                {currentQuestion.id === "locations" && ` location${answers[currentQuestion.id] !== 1 ? "s" : ""}`}
                {currentQuestion.id === "users" && ` user${answers[currentQuestion.id] !== 1 ? "s" : ""}`}
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  // Render results
  const renderResults = () => {
    if (!recommendedPlan) return null

    const plan = allPlans.find((p) => p.id === recommendedPlan)
    if (!plan) return null

    const selectedIntegrations = answers.integrations
      .map((id: string) => integrationFees.find((integration) => integration.id === id))
      .filter(Boolean)

    const billingCycle = answers.billing || "quarterly"
    const monthlyDisplayPrice = billingCycle === "quarterly" ? plan.monthlyPrice : Math.round(plan.annualPrice / 12)

    return (
      <div className="max-w-4xl mx-auto animate-fade-in px-4 sm:px-0">
        {/* Header Section */}
        <div className="text-center mb-6">
          <Badge className="mb-2 px-3 py-1 bg-primary text-primary-foreground text-sm font-medium">
            Recommended Solution
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">{plan.name} Plan</h2>
          <p className="text-muted-foreground">{plan.description}</p>
        </div>

        {/* Plan Card */}
        <div className="mb-8 bg-background rounded-xl shadow-md border border-primary/20 overflow-hidden">
          <div className="p-6">
            {/* Plan Details */}
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-primary/10 p-2 rounded-lg">
                {React.createElement(plan.icon, { className: "h-5 w-5 text-primary" })}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{plan.useCase}</p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-2/3">
                <h4 className="font-semibold text-base mb-3 flex items-center">
                  <Check className="h-4 w-4 text-primary mr-2" />
                  Key Features
                </h4>
                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
                  {plan.features
                    .filter((feature) => feature.highlight)
                    .map((feature, idx) => (
                      <div key={idx} className="flex items-start">
                        <div className="text-primary mr-2 mt-1 flex-shrink-0">
                          <Check className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="text-sm">{feature.name}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Pricing Details */}
              <div className="md:w-1/3 bg-muted/20 p-4 rounded-lg">
                <div className="mb-4">
                  <div className="flex justify-between items-baseline mb-2">
                    <div className="flex items-baseline">
                      <span className="text-2xl font-bold">${monthlyDisplayPrice}</span>
                      <span className="text-muted-foreground ml-1">/month</span>
                    </div>
                    <Badge variant={billingCycle === "annual" ? "default" : "outline"} className="font-normal text-xs">
                      {billingCycle === "annual" ? "Annual Billing" : "Quarterly Billing"}
                    </Badge>
                  </div>

                  {billingCycle === "annual" && (
                    <div className="bg-primary/5 rounded-lg p-2 border border-primary/10 text-xs mt-2">
                      <div className="flex justify-between font-medium">
                        <span>Annual payment:</span>
                        <span>${plan.annualPrice}/year</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground mt-1">
                        <span>You save:</span>
                        <span>${plan.monthlyPrice * 12 - plan.annualPrice}/year</span>
                      </div>
                    </div>
                  )}
                </div>

                {totalCost.oneTime > 0 && (
                  <div className="text-xs mb-3 pb-3 border-b border-border/40">
                    <div className="font-medium mb-1">One-Time Setup</div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Integration fees</span>
                      <span className="font-medium">${totalCost.oneTime}</span>
                    </div>
                  </div>
                )}

                <div className="text-xs font-medium">
                  First Payment: <span className="text-base font-bold">${monthlyDisplayPrice + totalCost.oneTime}</span>
                </div>
              </div>
            </div>

            {selectedIntegrations.length > 0 && (
              <div className="mt-6 pt-4 border-t border-border/40">
                <h4 className="font-semibold text-base mb-3 flex items-center">
                  <Layers className="h-4 w-4 text-primary mr-2" />
                  Selected Integrations
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {selectedIntegrations.map((integration, idx) => (
                    <div
                      key={idx}
                      className="bg-muted/40 rounded-lg p-2 flex items-center gap-2 border border-border/50 text-sm"
                    >
                      {React.createElement(integration?.icon || Check, {
                        className: "h-4 w-4 text-primary flex-shrink-0",
                      })}
                      <span className="font-medium">{integration?.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => {
              // Make sure questionnaire data is available
              if (typeof window !== "undefined" && !window.__questionnaire_data) {
                window.__questionnaire_data = {
                  recommendedPlan: recommendedPlan,
                  monthlyPrice: totalCost.monthly,
                  annualPrice: totalCost.annual,
                  oneTimeCost: totalCost.oneTime,
                  billingPreference: answers.billing || "quarterly",
                  selectedIntegrations: answers.integrations.join(", "),
                }
              }
              setShowBetaForm(true)
            }}
          >
            Request This Plan
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={resetQuestionnaire}>
            Restart Questionnaire
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background dark:bg-gray-900">
      {/* Sticky header with navigation */}
      <header
        className={`sticky top-0 z-40 w-full backdrop-blur-sm transition-all duration-200 ${
          isScrolled ? "bg-background/80 dark:bg-gray-900/80 border-b shadow-sm" : "bg-transparent"
        }`}
      >
        <div className="container max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>

          <div className="flex items-center space-x-4">
            <Tabs
              value={answers.billing || "quarterly"}
              onValueChange={(value) => handleAnswerChange("billing", value)}
              className="hidden sm:block"
            >
              <TabsList className="h-8">
                <TabsTrigger value="quarterly" className="text-xs px-3">
                  Quarterly
                </TabsTrigger>
                <TabsTrigger value="annual" className="text-xs px-3">
                  Annual (Save 15%)
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <Button variant="outline" size="sm" onClick={() => setShowBetaForm(true)} className="text-xs">
              Contact Sales
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-4 pt-12 pb-24">
        {!showResults ? (
          <>
            {/* Progress bar */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="flex justify-between text-xs text-muted-foreground mb-2">
                <span>Start</span>
                <span>Complete</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>

            {/* Question content */}
            <div className="min-h-[50vh] flex items-center justify-center py-8">
              <React.Fragment>{renderQuestion()}</React.Fragment>
            </div>

            {/* Navigation buttons */}
            {currentQuestion.type !== "welcome" && (
              <div className="max-w-2xl mx-auto flex justify-between mt-8">
                <Button variant="outline" onClick={handlePreviousQuestion} disabled={currentQuestionIndex === 0}>
                  Back
                </Button>
                <Button
                  onClick={handleNextQuestion}
                  disabled={!isCurrentQuestionAnswered() || isSubmitting}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {currentQuestionIndex === questions.length - 1 ? (
                    isSubmitting ? (
                      <>
                        <span className="mr-2">Processing</span>
                        <svg
                          className="animate-spin h-4 w-4"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                      </>
                    ) : (
                      "See Your Plan"
                    )
                  ) : (
                    "Next"
                  )}
                </Button>
              </div>
            )}
          </>
        ) : (
          // Results section
          renderResults()
        )}
      </main>

      {/* Beta form dialog */}
      {showBetaForm && <DynamicPlanAccessForm onClose={() => setShowBetaForm(false)} />}
    </div>
  )
}
