"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { QRCode } from "@/components/ui/qr-code"
import { Table, QrCode, Printer, Download } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

interface TableQR {
  id: number
  number: string
  qrUrl: string
}

export default function QRCodesPage() {
  const { toast } = useToast()
  const [tables, setTables] = useState<TableQR[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initializeQRCodes = async () => {
      setLoading(true)
      try {
        // Get current open session
        const { data: session } = await supabase
          .from('sessions')
          .select('*')
          .is('closed_at', null)
          .order('opened_at', { ascending: false })
          .limit(1)
          .single()

        if (session) {
          setSessionId(session.id)
          const baseUrl = window.location.origin
          
          // Generate QR codes for tables 1-12
          const tableQRs: TableQR[] = Array.from({ length: 12 }, (_, i) => ({
            id: i + 1,
            number: `T${i + 1}`,
            qrUrl: `${baseUrl}/customer-portal?table=${i + 1}&session=${session.id}`
          }))
          
          setTables(tableQRs)
        } else {
          toast({
            title: "No Open Session",
            description: "Please open a day in the POS system first",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error initializing QR codes:", error)
        toast({
          title: "Error",
          description: "Failed to load QR codes",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    initializeQRCodes()
  }, [toast])

  const handlePrintAll = () => {
    window.print()
  }

  const handleDownloadQR = (table: TableQR) => {
    const canvas = document.querySelector(`canvas[data-table="${table.id}"]`) as HTMLCanvasElement
    if (canvas) {
      const link = document.createElement('a')
      link.download = `qr-code-${table.number}.png`
      link.href = canvas.toDataURL()
      link.click()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading QR codes...</p>
        </div>
      </div>
    )
  }

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <QrCode className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Open Session</h2>
          <p className="text-muted-foreground">Please open a day in the POS system first</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <QrCode className="h-8 w-8 text-primary" />
                Table QR Codes
              </h1>
              <p className="text-muted-foreground mt-2">
                Print these QR codes and place them at each table for customer ordering
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handlePrintAll}>
                <Printer className="h-4 w-4 mr-2" />
                Print All
              </Button>
            </div>
          </div>
        </div>

        {/* QR Codes Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
          {tables.map((table) => (
            <Card key={table.id} className="print:break-inside-avoid">
              <CardHeader className="pb-3">
                <CardTitle className="text-center flex items-center justify-center gap-2">
                  <Table className="h-5 w-5" />
                  {table.number}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <div className="flex justify-center">
                  <QRCode 
                    value={table.qrUrl} 
                    size={120}
                    className="border rounded-lg p-2 bg-white"
                    dataTable={table.id}
                  />
                </div>
                <div className="space-y-2">
                  <Badge variant="secondary" className="w-full">
                    Scan to Order
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => handleDownloadQR(table)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Instructions */}
        <div className="mt-12 p-6 bg-muted/50 rounded-lg print:hidden">
          <h3 className="text-lg font-semibold mb-4">Instructions</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">For Staff:</h4>
              <ol className="text-sm text-muted-foreground space-y-1">
                <li>1. Print all QR codes</li>
                <li>2. Cut out each QR code</li>
                <li>3. Place QR codes at their respective tables</li>
                <li>4. Ensure QR codes are easily visible to customers</li>
              </ol>
            </div>
            <div>
              <h4 className="font-medium mb-2">For Customers:</h4>
              <ol className="text-sm text-muted-foreground space-y-1">
                <li>1. Scan the QR code at your table</li>
                <li>2. Browse the menu and add items to cart</li>
                <li>3. Place your order - it will be prepared and served to your table</li>
                <li>4. You can add more items to your existing order anytime</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:break-inside-avoid {
            break-inside: avoid;
          }
        }
      `}</style>
    </div>
  )
} 