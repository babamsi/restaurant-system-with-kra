"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Save, Loader2, Search, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { TaxTypeBadge } from "./tax-type-badge"
import { KRAItemClassification } from "@/hooks/use-kra-classifications"
import { kraTestItemsService, CreateTestItemData } from "@/lib/kra-test-items-service"

// KRA Unit Codes mapping
const KRA_UNIT_CODES = {
  '4B': { name: 'Pair', description: 'Pair' },
  'AV': { name: 'Cap', description: 'Cap' },
  'BA': { name: 'Barrel', description: 'Barrel' },
  'BE': { name: 'bundle', description: 'bundle' },
  'BG': { name: 'bag', description: 'bag' },
  'BL': { name: 'block', description: 'block' },
  'BLL': { name: 'BLL Barrel', description: 'BLL Barrel (petroleum) (158,987 dm3)' },
  'BX': { name: 'box', description: 'box' },
  'CA': { name: 'Can', description: 'Can' },
  'CEL': { name: 'Cell', description: 'Cell' },
  'CMT': { name: 'centimetre', description: 'centimetre' },
  'CR': { name: 'CARAT', description: 'CARAT' },
  'DR': { name: 'Drum', description: 'Drum' },
  'DZ': { name: 'Dozen', description: 'Dozen' },
  'GLL': { name: 'Gallon', description: 'Gallon' },
  'GRM': { name: 'Gram', description: 'Gram' },
  'GRO': { name: 'Gross', description: 'Gross' },
  'KG': { name: 'Kilo-Gramme', description: 'Kilo-Gramme' },
  'KTM': { name: 'kilometre', description: 'kilometre' },
  'KWT': { name: 'kilowatt', description: 'kilowatt' },
  'L': { name: 'Litre', description: 'Litre' },
  'LBR': { name: 'pound', description: 'pound' },
  'LK': { name: 'link', description: 'link' },
  'LTR': { name: 'Litre', description: 'Litre' },
  'M': { name: 'Metre', description: 'Metre' },
  'M2': { name: 'Square Metre', description: 'Square Metre' },
  'M3': { name: 'Cubic Metre', description: 'Cubic Metre' },
  'MGM': { name: 'milligram', description: 'milligram' },
  'MTR': { name: 'metre', description: 'metre' },
  'MWT': { name: 'megawatt hour', description: 'megawatt hour (1000 kW.h)' },
  'NO': { name: 'Number', description: 'Number' },
  'NX': { name: 'part per thousand', description: 'part per thousand' },
  'PA': { name: 'packet', description: 'packet' },
  'PG': { name: 'plate', description: 'plate' },
  'PR': { name: 'pair', description: 'pair' },
  'RL': { name: 'reel', description: 'reel' },
  'RO': { name: 'roll', description: 'roll' },
  'SET': { name: 'set', description: 'set' },
  'ST': { name: 'sheet', description: 'sheet' },
  'TNE': { name: 'tonne', description: 'tonne (metric ton)' },
  'TU': { name: 'tube', description: 'tube' },
  'U': { name: 'Pieces/item', description: 'Pieces/item [Number]' },
  'YRD': { name: 'yard', description: 'yard' }
}

// Tax Type Options
const TAX_TYPE_OPTIONS = [
  { value: 'A', label: 'A - Exempt (0%)', description: 'Exempt from VAT' },
  { value: 'B', label: 'B - Standard (16%)', description: 'Standard VAT rate' },
  { value: 'C', label: 'C - Zero Rated (0%)', description: 'Zero-rated for VAT' },
  { value: 'D', label: 'D - Non-VAT', description: 'Not subject to VAT' },
  { value: 'E', label: 'E - Reduced (8%)', description: 'Reduced VAT rate' }
]

interface AddTestItemDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  classifications: KRAItemClassification[]
  onItemAdded: () => void
}

export function AddTestItemDialog({ 
  isOpen, 
  onOpenChange, 
  classifications, 
  onItemAdded 
}: AddTestItemDialogProps) {
  const { toast } = useToast()
  const [isRegisteringWithKRA, setIsRegisteringWithKRA] = useState(false)
  const [classificationSearch, setClassificationSearch] = useState("")
  const [selectedClassification, setSelectedClassification] = useState<KRAItemClassification | null>(null)
  const [showManualTaxSelection, setShowManualTaxSelection] = useState(false)
  const [newItem, setNewItem] = useState<Partial<CreateTestItemData>>({
    name: "",
    description: "",
    category: "",
    unit: "",
    cost_per_unit: 0,
    current_stock: 0,
    item_cls_cd: "",
    tax_ty_cd: "B"
  })

  // Filter classifications based on search
  const filteredClassifications = classifications.filter(classification =>
    classification.itemClsNm.toLowerCase().includes(classificationSearch.toLowerCase()) ||
    classification.itemClsCd.toLowerCase().includes(classificationSearch.toLowerCase())
  )

  // Handle category selection and update item classification data
  const handleCategoryChange = (categoryName: string) => {
    setNewItem({ ...newItem, category: categoryName })
    
    // Find the selected classification to get itemClsCd and taxTyCd
    const selectedClassification = classifications.find(
      classification => classification.itemClsNm === categoryName
    )
    
    if (selectedClassification) {
      setSelectedClassification(selectedClassification)
      
      // Check if the classification has a null taxTyCd
      if (selectedClassification.taxTyCd === null) {
        setShowManualTaxSelection(true)
        setNewItem(prev => ({
          ...prev,
          category: categoryName,
          item_cls_cd: selectedClassification.itemClsCd,
          tax_ty_cd: 'B' // Default to 'B' for manual selection
        }))
      } else {
        setShowManualTaxSelection(false)
        setNewItem(prev => ({
          ...prev,
          category: categoryName,
          item_cls_cd: selectedClassification.itemClsCd,
          tax_ty_cd: selectedClassification.taxTyCd || 'B' // Ensure it's always a string
        }))
      }
    } else {
      toast({
        title: "Classification Error",
        description: `Could not find classification details for "${categoryName}"`,
        variant: "destructive",
      })
    }
  }

  // Handle manual tax type selection
  const handleTaxTypeChange = (taxType: string) => {
    setNewItem(prev => ({
      ...prev,
      tax_ty_cd: taxType
    }))
  }

  const handleAddItem = async () => {
    if (!newItem.name || !newItem.category || !newItem.unit || !newItem.item_cls_cd) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields including category.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsRegisteringWithKRA(true)
      
      // Create the test item in database
      const createResult = await kraTestItemsService.createTestItem({
        name: newItem.name!,
        description: newItem.description || undefined,
        category: newItem.category!,
        unit: newItem.unit!,
        cost_per_unit: newItem.cost_per_unit || 0,
        current_stock: newItem.current_stock || 0,
        item_cls_cd: newItem.item_cls_cd!,
        tax_ty_cd: newItem.tax_ty_cd || 'B'
      })

      if (createResult.success && createResult.data) {
        // Register with KRA
        try {
          const kraResponse = await fetch('/api/kra/register-test-item', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: newItem.name,
              category: newItem.category,
              unit: newItem.unit,
              cost_per_unit: newItem.cost_per_unit || 0,
              description: newItem.description || '',
              itemClsCd: newItem.item_cls_cd,
              taxTyCd: newItem.tax_ty_cd || 'B'
            })
          })

          const kraResult = await kraResponse.json()

          if (kraResult.success) {
            // Update the item with KRA item code
            await kraTestItemsService.updateKRAItemCode(createResult.data.id, kraResult.itemCd)
            
            toast({
              title: "Test Item Added & Registered",
              description: `${newItem.name} has been added and registered with KRA successfully.`,
            })
          } else {
            toast({
              title: "Test Item Added (KRA Registration Failed)",
              description: `${newItem.name} has been added, but KRA registration failed: ${kraResult.error}`,
              variant: "warning",
            })
          }
        } catch (error) {
          toast({
            title: "Test Item Added (KRA Registration Failed)",
            description: `${newItem.name} has been added, but KRA registration failed due to network error.`,
            variant: "warning",
          })
        }

        // Reset form
        setNewItem({
          name: "",
          description: "",
          category: "",
          unit: "",
          cost_per_unit: 0,
          current_stock: 0,
          item_cls_cd: "",
          tax_ty_cd: "B"
        })
        setSelectedClassification(null)
        setShowManualTaxSelection(false)
        setClassificationSearch("")
        onOpenChange(false)
        onItemAdded()
      } else {
        toast({
          title: "Error Adding Test Item",
          description: createResult.error || "Failed to add test item",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error Adding Test Item",
        description: "Failed to add test item",
        variant: "destructive",
      })
    } finally {
      setIsRegisteringWithKRA(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Test Item
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Test Item</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Basic Information</TabsTrigger>
            <TabsTrigger value="stock">Stock & Pricing</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="item-name">Item Name *</Label>
                <Input
                  id="item-name"
                  value={newItem.name || ""}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="Enter item name"
                />
              </div>
              <div>
                <Label htmlFor="item-category">KRA Classification *</Label>
                <Select
                  value={newItem.category || ""}
                  onValueChange={handleCategoryChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select KRA classification" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Search input for classifications */}
                    <div className="flex items-center px-3 py-2">
                      <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                      <Input
                        placeholder="Search classifications..."
                        value={classificationSearch}
                        onChange={(e) => setClassificationSearch(e.target.value)}
                        className="border-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                    </div>
                    <div className="border-t" />
                    {filteredClassifications.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        No classifications found
                      </div>
                    ) : (
                      filteredClassifications.map((classification) => (
                        <SelectItem key={classification.itemClsCd} value={classification.itemClsNm}>
                          <div className="flex flex-col w-full min-w-0">
                            <div className="font-medium truncate">
                              {classification.itemClsNm}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-2">
                              <span className="truncate">Code: {classification.itemClsCd}</span>
                              {classification.taxTyCd ? (
                                <span className="flex-shrink-0">• Tax: {classification.taxTyCd}</span>
                              ) : (
                                <span className="flex-shrink-0 text-orange-600">• Tax: Not Set</span>
                              )}
                            </div>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Manual Tax Type Selection */}
            {showManualTaxSelection && (
              <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-medium text-orange-800 dark:text-orange-200 mb-2">
                        Manual Tax Type Selection Required
                      </h4>
                      <p className="text-sm text-orange-700 dark:text-orange-300 mb-3">
                        The selected classification "{selectedClassification?.itemClsNm}" has no predefined tax type. 
                        Please select the appropriate tax type for this item.
                      </p>
                      <div>
                        <Label htmlFor="tax-type-select">Tax Type *</Label>
                        <Select
                          value={newItem.tax_ty_cd || "B"}
                          onValueChange={handleTaxTypeChange}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select tax type" />
                          </SelectTrigger>
                          <SelectContent>
                            {TAX_TYPE_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                <div className="flex flex-col">
                                  <span className="font-medium">{option.label}</span>
                                  <span className="text-xs text-muted-foreground">{option.description}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="item-unit">Unit *</Label>
                <Select
                  value={newItem.unit || ""}
                  onValueChange={(value) => setNewItem({ ...newItem, unit: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(KRA_UNIT_CODES).map(([code, unit]) => (
                      <SelectItem key={code} value={code}>
                        {code} - {unit.name} ({unit.description})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="item-description">Description</Label>
                <Input
                  id="item-description"
                  value={newItem.description || ""}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  placeholder="Enter description"
                />
              </div>
            </div>

            {/* Display selected classification info */}
            {newItem.item_cls_cd && (
              <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Classification Code:</span>
                      <span className="ml-2">{newItem.item_cls_cd}</span>
                    </div>
                    <div>
                      <span className="font-medium">Tax Type:</span>
                      <span className="ml-2">
                        <TaxTypeBadge taxType={newItem.tax_ty_cd} />
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="stock" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="item-cost">Cost per Unit *</Label>
                <Input
                  id="item-cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newItem.cost_per_unit || ""}
                  onChange={(e) => setNewItem({ ...newItem, cost_per_unit: parseFloat(e.target.value) || 0 })}
                  placeholder="Enter cost per unit"
                />
              </div>
              <div>
                <Label htmlFor="item-stock">Initial Stock *</Label>
                <Input
                  id="item-stock"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newItem.current_stock || ""}
                  onChange={(e) => setNewItem({ ...newItem, current_stock: parseFloat(e.target.value) || 0 })}
                  placeholder="Enter initial stock"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAddItem} disabled={isRegisteringWithKRA}>
            {isRegisteringWithKRA ? (
              <span className="flex items-center justify-center">
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                Registering with KRA...
              </span>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Test Item
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 