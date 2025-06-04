import { PageHeader } from "@/components/page-header"
import { OperationalReports } from "@/components/reports/operational-reports"

export default function ReportsPage() {
  return (
    <div className="relative min-h-screen">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-background to-muted/20" />
      <div className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />

      <div className="relative z-10 container mx-auto py-8 space-y-6">
        <PageHeader title="Operational Reports" description="Track yields, margins, and operational efficiency" />
        <OperationalReports />
      </div>
    </div>
  )
}
