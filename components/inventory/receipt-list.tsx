import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useReceiptProcessingStore } from "@/stores/receipt-processing-store"
import { ReceiptProcessingDialog } from "./receipt-processing-dialog"
import { format } from "date-fns"
import { Receipt } from "@/types/operational"

export function ReceiptList() {
  const { receipts } = useReceiptProcessingStore()
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | undefined>()
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleEdit = (receipt: Receipt) => {
    setSelectedReceipt(receipt)
    setIsDialogOpen(true)
  }

  const handleNew = () => {
    setSelectedReceipt(undefined)
    setIsDialogOpen(true)
  }

  const getStatusBadge = (status: Receipt["status"]) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>
      case "processed":
        return <Badge variant="default">Processed</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Receipts</CardTitle>
        <Button onClick={handleNew}>New Receipt</Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {receipts.map((receipt) => (
              <TableRow key={receipt.id}>
                <TableCell>{format(receipt.date, "PPp")}</TableCell>
                <TableCell>{receipt.supplier}</TableCell>
                <TableCell>{receipt.items.length}</TableCell>
                <TableCell>${receipt.total_amount.toFixed(2)}</TableCell>
                <TableCell>{getStatusBadge(receipt.status)}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(receipt)}
                    disabled={receipt.status === "processed"}
                  >
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      <ReceiptProcessingDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        receipt={selectedReceipt}
      />
    </Card>
  )
} 