import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface IngredientSourcePromptDialogProps {
  open: boolean;
  onClose: () => void;
  ingredientName: string;
  requiredQuantity: number;
  kitchenAvailable: number;
  freezerAvailable: number;
  unit: string;
  onConfirm: (split: { fromKitchen: number; fromFreezer: number }) => void;
}

export const IngredientSourcePromptDialog: React.FC<IngredientSourcePromptDialogProps> = ({
  open,
  onClose,
  ingredientName,
  requiredQuantity,
  kitchenAvailable,
  freezerAvailable,
  unit,
  onConfirm,
}) => {
  const [fromKitchen, setFromKitchen] = useState(0);
  const [fromFreezer, setFromFreezer] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    // Default: use as much as possible from kitchen, rest from freezer
    const kitchenToUse = Math.min(requiredQuantity, kitchenAvailable);
    setFromKitchen(kitchenToUse);
    setFromFreezer(requiredQuantity - kitchenToUse);
    setError("");
  }, [open, requiredQuantity, kitchenAvailable, freezerAvailable]);

  const handleKitchenChange = (val: string) => {
    const num = parseFloat(val) || 0;
    if (num < 0 || num > kitchenAvailable) return;
    setFromKitchen(num);
    setFromFreezer(requiredQuantity - num);
    setError("");
  };

  const handleFreezerChange = (val: string) => {
    const num = parseFloat(val) || 0;
    if (num < 0 || num > freezerAvailable) return;
    setFromFreezer(num);
    setFromKitchen(requiredQuantity - num);
    setError("");
  };

  const handleConfirm = () => {
    if (fromKitchen < 0 || fromFreezer < 0) {
      setError("Quantities cannot be negative.");
      return;
    }
    if (fromKitchen > kitchenAvailable) {
      setError("Not enough in kitchen storage.");
      return;
    }
    if (fromFreezer > freezerAvailable) {
      setError("Not enough in freezer.");
      return;
    }
    if (fromKitchen + fromFreezer !== requiredQuantity) {
      setError("Total must equal required quantity.");
      return;
    }
    setError("");
    onConfirm({ fromKitchen, fromFreezer });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Choose Ingredient Source</DialogTitle>
          <DialogDescription>
            <span>
              How do you want to allocate <b>{requiredQuantity} {unit}</b> of <b>{ingredientName}</b>?
            </span>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="flex flex-col gap-2">
            <Label>From Kitchen Storage (Available: {kitchenAvailable} {unit})</Label>
            <Input
              type="number"
              min={0}
              max={kitchenAvailable}
              value={fromKitchen}
              onChange={e => handleKitchenChange(e.target.value)}
              step="any"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>From Freezer (Available: {freezerAvailable} {unit})</Label>
            <Input
              type="number"
              min={0}
              max={freezerAvailable}
              value={fromFreezer}
              onChange={e => handleFreezerChange(e.target.value)}
              step="any"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            Total: <b>{fromKitchen + fromFreezer}</b> / {requiredQuantity} {unit}
          </div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={fromKitchen + fromFreezer !== requiredQuantity || fromKitchen < 0 || fromFreezer < 0}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 