import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

interface KitchenStorageItem {
  id: string;
  ingredient_id: string;
  quantity: number;
  unit: string;
  used_grams?: number;
  used_liters?: number;
  last_updated?: string;
  open_container_remaining?: number;
  open_container_unit?: string;
  reference_weight_per_bunch?: number;
  reference_weight_unit?: string;
}

interface Ingredient {
  id: number;
  name: string;
  category: string;
  available_quantity: number;
  unit: string;
  threshold?: number;
  current_stock?: number;
}

interface FreezerItem {
  id: string;
  ingredientId: string;
  ingredientName: string;
  portions: number;
  yieldPerPortion: number;
  unit: string;
  dateFrozen: string;
  bestBefore: string;
  notes?: string;
}

interface KitchenStorageTableProps {
  kitchenStorage: KitchenStorageItem[];
  inventoryIngredientsList: Ingredient[];
  freezerItems: FreezerItem[];
  getIngredientName: (ingredientId: string) => string;
  onRequestMore: (item: KitchenStorageItem) => void;
}

function formatDateSafe(dateValue: string | number | Date | undefined): string {
  if (!dateValue) return '-';
  try {
    return format(new Date(dateValue), "MMM d, yyyy HH:mm");
  } catch {
    return '-';
  }
}

function getStorageStatusBadge(item: KitchenStorageItem) {
  if (item.quantity > 0) {
    return (
      <Badge variant="default" className="bg-green-500">
        Available
      </Badge>
    )
  } else {
    return (
      <Badge variant="destructive">
        Out of Stock
      </Badge>
    )
  }
}

export const KitchenStorageTable: React.FC<KitchenStorageTableProps> = ({
  kitchenStorage,
  inventoryIngredientsList,
  freezerItems,
  getIngredientName,
  onRequestMore,
}) => {
  // Search and filter state
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("all");
  const [selectedStockStatus, setSelectedStockStatus] = React.useState("all");

  // Get unique categories
  const categories = React.useMemo(() => [
    ...new Set(inventoryIngredientsList.map(i => i.category))
  ], [inventoryIngredientsList]);

  // Filtered storage items
  const filteredStorage = kitchenStorage.filter(item => {
    const ingredient = inventoryIngredientsList.find(i => i.id.toString() === item.ingredient_id);
    const matchesSearch = !searchQuery || (ingredient && ingredient.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || (ingredient && ingredient.category === selectedCategory);
    // Stock status logic
    let matchesStock = true;
    const threshold = ingredient?.threshold ?? 5;
    if (selectedStockStatus === "available") {
      matchesStock = item.quantity > threshold;
    } else if (selectedStockStatus === "low") {
      matchesStock = item.quantity > 0 && item.quantity <= threshold;
    } else if (selectedStockStatus === "out") {
      matchesStock = item.quantity === 0;
    }
    return matchesSearch && matchesCategory && matchesStock;
  });

  return (
    <>
      {/* Filter UI */}
      <div className="flex flex-col md:flex-row md:items-center gap-2 mb-4">
        <Input
          type="text"
          placeholder="Search ingredients..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full md:w-64"
        />
        <Select
          value={selectedCategory}
          onValueChange={setSelectedCategory}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={selectedStockStatus}
          onValueChange={setSelectedStockStatus}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Stock Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stock Statuses</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="low">Low Stock</SelectItem>
            <SelectItem value="out">Out of Stock</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ingredient</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredStorage.map((item) => {
            const ingredient = inventoryIngredientsList.find(i => i.id.toString() === item.ingredient_id)
            const frozenTotal = freezerItems
              .filter(fz => fz.ingredientId === item.ingredient_id)
              .reduce((sum, fz) => sum + (fz.portions * fz.yieldPerPortion), 0)
            return (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <span>{getIngredientName(item.ingredient_id) || 'Unknown Ingredient'}</span>
                    {frozenTotal > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {frozenTotal} {item.unit} frozen
                      </Badge>
                    )}
                    {/* {(item.used_grams || 0) > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        Used: {(item.used_grams || 0).toFixed(2)}g
                      </Badge>
                    )}
                    {(item.used_liters || 0) > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        Used: {(item.used_liters || 0).toFixed(2)}l
                      </Badge>
                    )} */}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span>{item.quantity}</span>
                    {item.open_container_remaining && item.open_container_remaining > 0 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1 w-fit">
                        Open: {item.open_container_remaining} {item.open_container_unit || item.unit} left
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>{item.unit}</TableCell>
                <TableCell>{getStorageStatusBadge(item)}</TableCell>
                <TableCell>{formatDateSafe(item.last_updated)}</TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRequestMore(item)}
                  >
                    Request More
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </>
  );
}; 