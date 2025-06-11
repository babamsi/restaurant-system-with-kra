import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useStocktakeStore } from "@/stores/stocktake-store"
import { StocktakeDialog } from "./stocktake-dialog"
import { format } from "date-fns"
import { Stocktake } from "@/types/operational"

export function StocktakeList() {
  const { stocktakes, getStocktakeVariance } = useStocktakeStore()
  const [selectedStocktake, setSelectedStocktake] = useState<Stocktake | undefined>()
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleEdit = (stocktake: Stocktake) => {
    setSelectedStocktake(stocktake)
    setIsDialogOpen(true)
  }

  const handleNew = () => {
    setSelectedStocktake(undefined)
    setIsDialogOpen(true)
  }

  const getStatusBadge = (status: Stocktake["status"]) => {
    switch (status) {
      case "in_progress":
        return <Badge variant="secondary">In Progress</Badge>
      case "completed":
        return <Badge variant="default">Completed</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Stocktakes</CardTitle>
        <Button onClick={handleNew}>New Stocktake</Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total Variance</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stocktakes.map((stocktake) => {
              const variance = getStocktakeVariance(stocktake.id)
              return (
                <TableRow key={stocktake.id}>
                  <TableCell>{format(stocktake.date, "PPp")}</TableCell>
                  <TableCell className="capitalize">{stocktake.location}</TableCell>
                  <TableCell>{getStatusBadge(stocktake.status)}</TableCell>
                  <TableCell>{stocktake.items.length}</TableCell>
                  <TableCell className={variance.total !== 0 ? "text-red-500" : ""}>
                    {variance.total}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(stocktake)}
                      disabled={stocktake.status === "completed"}
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>

      <StocktakeDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        stocktake={selectedStocktake}
      />
    </Card>
  )
} 