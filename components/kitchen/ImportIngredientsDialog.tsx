import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ArrowUpDown } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { insertSystemLog } from "@/lib/kitchenSupabase";

interface Ingredient {
  id: number;
  name: string;
  category: string;
  available_quantity: number;
  unit: string;
  threshold?: number;
  current_stock?: number;
}

interface KitchenStorageItem {
  id: string;
  ingredient_id: string;
  quantity: number;
  unit: string;
  reference_weight_per_bunch?: number;
  reference_weight_unit?: string;
  last_updated?: string;
  open_container_remaining?: number;
  open_container_unit?: string;
  used_liters?: number;
}

interface ImportIngredientsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inventoryIngredientsList: Ingredient[];
  kitchenStorage: KitchenStorageItem[];
  setKitchenStorage: React.Dispatch<React.SetStateAction<KitchenStorageItem[]>>;
  onImportSuccess?: () => void;
  fetchIngredients: () => Promise<Ingredient[]>;
  upsertKitchenStorage: (item: any) => Promise<any>;
  toast: (opts: any) => void;
}

export const ImportIngredientsDialog: React.FC<ImportIngredientsDialogProps> = ({
  open,
  onOpenChange,
  inventoryIngredientsList,
  kitchenStorage,
  setKitchenStorage,
  onImportSuccess,
  fetchIngredients,
  upsertKitchenStorage,
  toast,
}) => {
  const [selectedIngredients, setSelectedIngredients] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importSearchQuery, setImportSearchQuery] = useState("");
  // Reference weight dialog state
  const [showReferenceWeightDialog, setShowReferenceWeightDialog] = useState(false);
  const [referenceWeightIngredient, setReferenceWeightIngredient] = useState<Ingredient | null>(null);
  const [referenceWeightValue, setReferenceWeightValue] = useState<string>("");
  const [referenceWeightUnit, setReferenceWeightUnit] = useState<string>("g");
  const [pendingImportIngredient, setPendingImportIngredient] = useState<any>(null);
  const [isSavingReferenceWeight, setIsSavingReferenceWeight] = useState(false);
  // Add a flag to indicate that we should resume import after the dialog closes
  const [resumeImportAfterDialog, setResumeImportAfterDialog] = useState(false);

  // Effect: when the reference weight dialog closes and resumeImportAfterDialog is true, resume import
  useEffect(() => {
    if (!showReferenceWeightDialog && resumeImportAfterDialog) {
      setResumeImportAfterDialog(false);
      handleImportIngredients();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showReferenceWeightDialog]);

  // Handle import
  const handleImportIngredients = async () => {
    if (selectedIngredients.length === 0) {
      toast({
        title: "No Ingredients Selected",
        description: "Please select at least one ingredient to import.",
        variant: "destructive",
      });
      return;
    }
    // Validate all quantities before proceeding
    const invalidImports = selectedIngredients.filter(ingredient => {
      const syncedIngredient = inventoryIngredientsList.find(i => i.id.toString() === ingredient.ingredientId)
      return !syncedIngredient || 
             Number(syncedIngredient.current_stock) <= 0 || 
             ingredient.requiredQuantity <= 0 ||
             ingredient.requiredQuantity > Number(syncedIngredient.current_stock)
    })
    if (invalidImports.length > 0) {
      const invalidNames = invalidImports.map(ing => {
        const syncedIngredient = inventoryIngredientsList.find(i => i.id.toString() === ing.ingredientId)
        return syncedIngredient?.name
      }).filter(Boolean).join(", ")
      toast({
        title: "Invalid Import",
        description: `Cannot import: ${invalidNames}. Please check stock availability.`,
        variant: "destructive",
      });
      return;
    }
    // Check for any selected ingredient with unit 'bunch' missing reference weight BEFORE importing any
    const missingBunch = selectedIngredients.find(ingredient => {
      const syncedIngredient = inventoryIngredientsList.find(i => i.id.toString() === ingredient.ingredientId)
      const existingItem = kitchenStorage.find(item => item.ingredient_id === ingredient.ingredientId)
      return syncedIngredient && syncedIngredient.unit === 'bunch' && (!existingItem || !('reference_weight_per_bunch' in existingItem) || !existingItem.reference_weight_per_bunch)
    });
    if (missingBunch) {
      const syncedIngredient = inventoryIngredientsList.find(i => i.id.toString() === missingBunch.ingredientId)
      setReferenceWeightIngredient(syncedIngredient || null)
      setPendingImportIngredient(missingBunch)
      setShowReferenceWeightDialog(true)
      return // Pause import until user provides value
    }
    setIsImporting(true)
    try {
      for (const ingredient of selectedIngredients) {
        const syncedIngredient = inventoryIngredientsList.find(i => i.id.toString() === ingredient.ingredientId)
        if (syncedIngredient) {
          const existingItem = kitchenStorage.find(item => item.ingredient_id === ingredient.ingredientId)
          const storageItem: any = {
            ...(existingItem?.id ? { id: existingItem.id } : {}),
            ingredient_id: ingredient.ingredientId,
            quantity: (existingItem?.quantity || 0) + ingredient.requiredQuantity,
            unit: syncedIngredient.unit,
            last_updated: new Date().toISOString()
          }
          
          // Handle bunch ingredients with reference weight
          if (syncedIngredient.unit === 'bunch' && existingItem?.reference_weight_per_bunch) {
            storageItem.reference_weight_per_bunch = existingItem.reference_weight_per_bunch;
            storageItem.reference_weight_unit = existingItem.reference_weight_unit || 'g';
          }
          
          // Initialize new columns if they don't exist
          if (existingItem) {
            storageItem.open_container_remaining = existingItem.open_container_remaining || null;
            storageItem.open_container_unit = existingItem.open_container_unit || null;
            storageItem.used_liters = existingItem.used_liters || null;
          } else {
            storageItem.open_container_remaining = null;
            storageItem.open_container_unit = null;
            storageItem.used_liters = null;
          }
          await upsertKitchenStorage(storageItem)
          setKitchenStorage(prevStorage => {
            const index = prevStorage.findIndex(item => item.ingredient_id === ingredient.ingredientId)
            const ensureId = (item: any) => ({
              ...item,
              id: item.id || crypto.randomUUID?.() || Date.now().toString(),
            })
            if (index >= 0) {
              const updatedStorage = [...prevStorage]
              updatedStorage[index] = ensureId(storageItem)
              return updatedStorage
            }
            return [...prevStorage, ensureId(storageItem)]
          })
          // Deduct from main ingredient table
          await supabase
            .from('ingredients')
            .update({ current_stock: Number(syncedIngredient.current_stock) - ingredient.requiredQuantity })
            .eq('id', ingredient.ingredientId)
          
          // Log the import (don't let this fail the main operation)
          try {
            await insertSystemLog({ 
              type: "storage", 
              action: "Import", 
              details: `Imported ${ingredient.requiredQuantity} ${ingredient.unit} of ${syncedIngredient.name}`, 
              status: "success" 
            })
          } catch (logError) {
            console.warn('Failed to log import:', logError)
          }
        }
      }
      setSelectedIngredients([])
      onOpenChange(false)
      toast({
        title: "Ingredients Imported Successfully",
        description: "Selected ingredients have been imported to kitchen storage.",
      })
      if (onImportSuccess) onImportSuccess();
      await fetchIngredients(); // Ensure inventoryIngredientsList is updated
    } catch (error) {
      console.error('Import error:', error)
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "An error occurred while importing ingredients. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsImporting(false)
    }
  }

  // Handle reference weight dialog submission
  const handleReferenceWeightSubmit = async () => {
    if (!referenceWeightIngredient || !pendingImportIngredient) return;
    const value = parseFloat(referenceWeightValue)
    if (!value || value <= 0) {
      toast({
        title: "Invalid Value",
        description: "Please enter a valid positive number for the conversion.",
        variant: "destructive"
      })
      return;
    }
    setIsSavingReferenceWeight(true);
    try {
      // Upsert only the bunch ingredient and deduct from main table
      const existingItem = kitchenStorage.find(item => item.ingredient_id === referenceWeightIngredient.id.toString())
      const storageItem: any = {
        ...(existingItem?.id ? { id: existingItem.id } : {}),
        ingredient_id: referenceWeightIngredient.id.toString(),
        quantity: (existingItem?.quantity || 0) + pendingImportIngredient.requiredQuantity,
        unit: referenceWeightIngredient.unit,
        reference_weight_per_bunch: value,
        reference_weight_unit: referenceWeightUnit,
        last_updated: new Date().toISOString()
      }
      
      // Initialize new columns if they don't exist
      if (existingItem) {
        storageItem.open_container_remaining = existingItem.open_container_remaining || null;
        storageItem.open_container_unit = existingItem.open_container_unit || null;
        storageItem.used_liters = existingItem.used_liters || null;
      } else {
        storageItem.open_container_remaining = null;
        storageItem.open_container_unit = null;
        storageItem.used_liters = null;
      }
      await upsertKitchenStorage(storageItem)
      setKitchenStorage(prevStorage => {
        const index = prevStorage.findIndex(item => item.ingredient_id === referenceWeightIngredient.id.toString())
        const ensureId = (item: any) => ({
          ...item,
          id: item.id || crypto.randomUUID?.() || Date.now().toString(),
        })
        if (index >= 0) {
          const updatedStorage = [...prevStorage]
          updatedStorage[index] = ensureId(storageItem)
          return updatedStorage
        }
        return [...prevStorage, ensureId(storageItem)]
      })
      // Deduct from main ingredient table for this ingredient
      const syncedIngredient = inventoryIngredientsList.find(i => i.id.toString() === referenceWeightIngredient.id.toString())
      if (syncedIngredient) {
        await supabase
          .from('ingredients')
          .update({ current_stock: Number(syncedIngredient.current_stock) - pendingImportIngredient.requiredQuantity })
          .eq('id', referenceWeightIngredient.id)
      }
      // Remove this ingredient from selectedIngredients and check if any other bunches need conversion
      setSelectedIngredients(prev => prev.filter(i => i.ingredientId !== referenceWeightIngredient.id.toString()))
      setShowReferenceWeightDialog(false)
      setReferenceWeightIngredient(null)
      setReferenceWeightValue("")
      setReferenceWeightUnit("g")
      setPendingImportIngredient(null)
      // After closing, re-trigger handleImportIngredients to check for other bunches or import
      setResumeImportAfterDialog(true);
      
      // Log the import (don't let this fail the main operation)
      try {
        await insertSystemLog({ 
          type: "storage", 
          action: "Import", 
          details: `Imported ${pendingImportIngredient.requiredQuantity} ${pendingImportIngredient.unit} of ${referenceWeightIngredient.name} (conversion set)`, 
          status: "success" 
        })
      } catch (logError) {
        console.warn('Failed to log import:', logError)
      }
    } finally {
      setIsSavingReferenceWeight(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl min-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import Ingredients</DialogTitle>
            <DialogDescription>
              Select ingredients to import from the main inventory to kitchen storage.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="mb-4">
              <Input
                type="text"
                placeholder="Search ingredients..."
                value={importSearchQuery}
                onChange={e => setImportSearchQuery(e.target.value)}
              />
            </div>
            <ScrollArea className="h-[400px] pr-4">
              <div className="grid gap-4">
                {inventoryIngredientsList
                  .filter(ingredient => ingredient.name.toLowerCase().includes(importSearchQuery.toLowerCase()))
                  .map((ingredient) => {
                    const stock = ingredient.current_stock ?? ingredient.available_quantity ?? 0;
                    return (
                      <div key={ingredient.id} className="flex items-center space-x-4">
                        <Checkbox
                          id={`ingredient-${ingredient.id}`}
                          checked={selectedIngredients.some(
                            (i) => i.ingredientId === ingredient.id.toString()
                          )}
                          disabled={Number(stock) <= 0}
                          onCheckedChange={(checked: boolean) => {
                            if (checked) {
                              setSelectedIngredients([
                                ...selectedIngredients,
                                {
                                  ingredientId: ingredient.id.toString(),
                                  requiredQuantity: 1,
                                  unit: ingredient.unit,
                                  status: "available"
                                },
                              ])
                            } else {
                              setSelectedIngredients(
                                selectedIngredients.filter(
                                  (i) => i.ingredientId !== ingredient.id.toString()
                                )
                              )
                            }
                          }}
                        />
                        <div className="flex-1">
                          <Label 
                            htmlFor={`ingredient-${ingredient.id}`}
                            className={Number(stock) <= 0 ? "text-muted-foreground" : ""}
                          >
                            {ingredient.name}
                          </Label>
                          <p className={`text-sm ${Number(stock) > 0 ? "text-muted-foreground" : "text-red-500"}`}>
                            {Number(stock) > 0
                              ? `Available: ${stock} ${ingredient.unit || ""}`
                              : "Out of stock"}
                          </p>
                        </div>
                        {selectedIngredients.some(i => i.ingredientId === ingredient.id.toString()) && (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="0"
                              step="any"
                              value={selectedIngredients.find(i => i.ingredientId === ingredient.id.toString())?.requiredQuantity || ""}
                              onChange={(e) => {
                                const value = e.target.value;
                                const newQuantity = value === "" ? 0 : parseFloat(value);
                                if (value === "" || (newQuantity > 0 && newQuantity <= Number(stock))) {
                                  setSelectedIngredients(
                                    selectedIngredients.map(i =>
                                      i.ingredientId === ingredient.id.toString()
                                        ? { ...i, requiredQuantity: newQuantity }
                                        : i
                                    )
                                  )
                                }
                              }}
                              className="w-24"
                            />
                            <span className="text-sm text-muted-foreground">{ingredient.unit || ""}</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
              </div>
            </ScrollArea>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleImportIngredients}
              disabled={selectedIngredients.length === 0 || isImporting}
            >
              {isImporting ? "Importing..." : "Import Selected"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Reference Weight Prompt Dialog */}
      <Dialog open={showReferenceWeightDialog} onOpenChange={isSavingReferenceWeight ? () => {} : setShowReferenceWeightDialog}>
        <DialogContent className="max-w-md w-full">
          <DialogHeader>
            <DialogTitle>Set Conversion for Bunch</DialogTitle>
            <DialogDescription>
              {referenceWeightIngredient && (
                <>How many grams are in <span className="font-semibold">one bunch</span> of <span className="font-semibold">{referenceWeightIngredient.name}</span>?</>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="1"
                value={referenceWeightValue}
                onChange={e => setReferenceWeightValue(e.target.value)}
                placeholder="e.g. 30"
                className="w-32"
                disabled={isSavingReferenceWeight}
              />
              <Select value={referenceWeightUnit} onValueChange={setReferenceWeightUnit} disabled={isSavingReferenceWeight}>
                <SelectTrigger className="w-24">
                  <SelectValue placeholder="Unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="g">Grams (g)</SelectItem>
                  <SelectItem value="kg">Kilograms (kg)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-muted-foreground text-sm">This value will be used to convert bunches to grams for batch preparation and deduction.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReferenceWeightDialog(false)} disabled={isSavingReferenceWeight}>Cancel</Button>
            <Button onClick={handleReferenceWeightSubmit} disabled={!referenceWeightValue || parseFloat(referenceWeightValue) <= 0 || isSavingReferenceWeight}>
              {isSavingReferenceWeight ? (
                <span className="flex items-center"><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />Saving...</span>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}; 