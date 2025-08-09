"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Edit, Trash2, Search, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { TaxTypeBadge } from "./tax-type-badge"
import { TestKRAItem, kraTestItemsService } from "@/lib/kra-test-items-service"

interface TestItemsTableProps {
  items: TestKRAItem[]
  onItemUpdated: () => void
  onEditItem: (item: TestKRAItem) => void
}

export function TestItemsTable({ items, onItemUpdated, onEditItem }: TestItemsTableProps) {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedTaxType, setSelectedTaxType] = useState<string>("all")

  // Get unique categories and tax types for filters
  const categories = Array.from(new Set(items.map(item => item.category)))
  const taxTypes = Array.from(new Set(items.map(item => item.tax_ty_cd).filter(Boolean)))

  // Filter items based on criteria
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory
    const matchesTaxType = selectedTaxType === "all" || item.tax_ty_cd === selectedTaxType

    return matchesSearch && matchesCategory && matchesTaxType
  })

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedCategory("all")
    setSelectedTaxType("all")
  }

  const handleDeleteItem = async (item: TestKRAItem) => {
    try {
      const result = await kraTestItemsService.deleteTestItem(item.id)
      if (result.success) {
        toast({
          title: "Test Item Deleted",
          description: `${item.name} has been removed.`,
        })
        onItemUpdated()
      } else {
        toast({
          title: "Error Deleting Test Item",
          description: result.error || "Failed to delete test item",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error Deleting Test Item",
        description: "Failed to delete test item",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search test items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedTaxType} onValueChange={setSelectedTaxType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tax Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tax Types</SelectItem>
                {taxTypes.map(taxType => (
                  <SelectItem key={taxType || ''} value={taxType || ''}>
                    {taxType}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(searchQuery || selectedCategory !== "all" || selectedTaxType !== "all") && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="h-10"
              >
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Active Filters Display */}
        {(searchQuery || selectedCategory !== "all" || selectedTaxType !== "all") && (
          <div className="flex flex-wrap gap-2 text-sm">
            {searchQuery && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Search: {searchQuery}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => setSearchQuery("")}
                />
              </Badge>
            )}
            {selectedCategory !== "all" && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Category: {selectedCategory}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => setSelectedCategory("all")}
                />
              </Badge>
            )}
            {selectedTaxType !== "all" && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Tax Type: {selectedTaxType}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => setSelectedTaxType("all")}
                />
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Test Items Table */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>KRA Classification</TableHead>
                  <TableHead>Tax Type</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Cost/Unit</TableHead>
                  <TableHead>KRA Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>
                      <div className="text-xs">
                        <div className="font-medium">{item.item_cls_cd}</div>
                        <div className="text-muted-foreground">{item.category}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <TaxTypeBadge taxType={item.tax_ty_cd} />
                    </TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell>{item.current_stock}</TableCell>
                    <TableCell>Ksh {item.cost_per_unit.toFixed(2)}</TableCell>
                    <TableCell>
                      {item.item_cd ? (
                        <div className="text-xs">
                          <div className="font-medium text-green-600">✓ Registered</div>
                          <div className="text-muted-foreground">Code: {item.item_cd}</div>
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-amber-500 border-amber-500">
                          Not Registered
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEditItem(item)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteItem(item)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
} 