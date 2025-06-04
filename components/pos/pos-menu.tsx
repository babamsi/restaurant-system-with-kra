"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Filter, Clock, Info } from "lucide-react"
import { motion } from "framer-motion"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider"

interface FoodItem {
  id: number
  name: string
  price: number
  pricePerUnit: number
  available: number
  image: string
  category: string
  mealPeriod: "breakfast" | "lunch" | "dinner" | "all"
  nutritionalInfo: {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
  unit: string
  status: "Available" | "Low Stock" | "Out of Stock"
}

interface POSMenuProps {
  onAddToCart: (item: FoodItem, quantity: number, portionSize: string) => void
}

export function POSMenu({ onAddToCart }: POSMenuProps) {
  const [mealPeriods] = useState([
    { id: "all", name: "All Items" },
    { id: "breakfast", name: "Breakfast" },
    { id: "lunch", name: "Lunch" },
    { id: "dinner", name: "Dinner" },
  ])

  const [categories] = useState([
    { id: "all", name: "All Categories" },
    { id: "proteins", name: "Proteins" },
    { id: "starches", name: "Starches" },
    { id: "vegetables", name: "Vegetables" },
    { id: "fruits", name: "Fruits" },
    { id: "drinks", name: "Drinks" },
  ])

  const [foodItems] = useState<FoodItem[]>([
    // Breakfast Items
    {
      id: 1,
      name: "Scrambled Eggs",
      price: 2.5,
      pricePerUnit: 2.5,
      available: 20,
      image: "/fluffy-scrambled-eggs.png",
      category: "proteins",
      mealPeriod: "breakfast",
      nutritionalInfo: {
        calories: 140,
        protein: 12,
        carbs: 1,
        fat: 10,
      },
      unit: "serving",
      status: "Available",
    },
    {
      id: 2,
      name: "Oatmeal",
      price: 1.75,
      pricePerUnit: 1.75,
      available: 15,
      image: "/bowl-of-oatmeal.png",
      category: "starches",
      mealPeriod: "breakfast",
      nutritionalInfo: {
        calories: 150,
        protein: 5,
        carbs: 27,
        fat: 3,
      },
      unit: "serving",
      status: "Available",
    },
    {
      id: 3,
      name: "Fresh Fruit",
      price: 1.25,
      pricePerUnit: 1.25,
      available: 25,
      image: "/fresh-fruit-mix.png",
      category: "fruits",
      mealPeriod: "breakfast",
      nutritionalInfo: {
        calories: 70,
        protein: 1,
        carbs: 18,
        fat: 0,
      },
      unit: "serving",
      status: "Available",
    },
    {
      id: 4,
      name: "Breakfast Potatoes",
      price: 1.5,
      pricePerUnit: 1.5,
      available: 18,
      image: "/breakfast-potatoes.png",
      category: "starches",
      mealPeriod: "breakfast",
      nutritionalInfo: {
        calories: 120,
        protein: 2,
        carbs: 22,
        fat: 4,
      },
      unit: "serving",
      status: "Available",
    },

    // Lunch Items
    {
      id: 5,
      name: "Grilled Chicken",
      price: 3.5,
      pricePerUnit: 3.5,
      available: 15,
      image: "/grilled-chicken.png",
      category: "proteins",
      mealPeriod: "lunch",
      nutritionalInfo: {
        calories: 180,
        protein: 28,
        carbs: 0,
        fat: 7,
      },
      unit: "serving",
      status: "Available",
    },
    {
      id: 6,
      name: "Steamed Rice",
      price: 1.25,
      pricePerUnit: 1.25,
      available: 30,
      image: "/steamed-rice.png",
      category: "starches",
      mealPeriod: "lunch",
      nutritionalInfo: {
        calories: 150,
        protein: 3,
        carbs: 32,
        fat: 0,
      },
      unit: "serving",
      status: "Available",
    },
    {
      id: 7,
      name: "Steamed Vegetables",
      price: 1.75,
      pricePerUnit: 1.75,
      available: 20,
      image: "/steamed-vegetables.png",
      category: "vegetables",
      mealPeriod: "lunch",
      nutritionalInfo: {
        calories: 60,
        protein: 2,
        carbs: 12,
        fat: 0,
      },
      unit: "serving",
      status: "Available",
    },
    {
      id: 8,
      name: "Garden Salad",
      price: 2.0,
      pricePerUnit: 2.0,
      available: 15,
      image: "/garden-salad.png",
      category: "vegetables",
      mealPeriod: "lunch",
      nutritionalInfo: {
        calories: 45,
        protein: 2,
        carbs: 8,
        fat: 1,
      },
      unit: "serving",
      status: "Available",
    },

    // Dinner Items
    {
      id: 9,
      name: "Beef Stew",
      price: 4.0,
      pricePerUnit: 4.0,
      available: 12,
      image: "/hearty-beef-stew.png",
      category: "proteins",
      mealPeriod: "dinner",
      nutritionalInfo: {
        calories: 220,
        protein: 22,
        carbs: 15,
        fat: 10,
      },
      unit: "serving",
      status: "Available",
    },
    {
      id: 10,
      name: "Mashed Potatoes",
      price: 1.75,
      pricePerUnit: 1.75,
      available: 18,
      image: "/creamy-mashed-potatoes.png",
      category: "starches",
      mealPeriod: "dinner",
      nutritionalInfo: {
        calories: 160,
        protein: 3,
        carbs: 30,
        fat: 4,
      },
      unit: "serving",
      status: "Available",
    },
    {
      id: 11,
      name: "Roasted Vegetables",
      price: 2.25,
      pricePerUnit: 2.25,
      available: 15,
      image: "/roasted-vegetables.png",
      category: "vegetables",
      mealPeriod: "dinner",
      nutritionalInfo: {
        calories: 90,
        protein: 3,
        carbs: 15,
        fat: 3,
      },
      unit: "serving",
      status: "Available",
    },

    // All-day Items
    {
      id: 12,
      name: "Fresh Fruit Juice",
      price: 1.5,
      pricePerUnit: 1.5,
      available: 25,
      image: "/fruit-smoothie.png",
      category: "drinks",
      mealPeriod: "all",
      nutritionalInfo: {
        calories: 120,
        protein: 1,
        carbs: 30,
        fat: 0,
      },
      unit: "glass",
      status: "Available",
    },
    {
      id: 13,
      name: "Iced Tea",
      price: 1.0,
      pricePerUnit: 1.0,
      available: 30,
      image: "/iced-tea.png",
      category: "drinks",
      mealPeriod: "all",
      nutritionalInfo: {
        calories: 40,
        protein: 0,
        carbs: 10,
        fat: 0,
      },
      unit: "glass",
      status: "Available",
    },
    {
      id: 14,
      name: "Water",
      price: 0.5,
      pricePerUnit: 0.5,
      available: 50,
      image: "/water-glass.png",
      category: "drinks",
      mealPeriod: "all",
      nutritionalInfo: {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
      },
      unit: "glass",
      status: "Available",
    },
  ])

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedMealPeriod, setSelectedMealPeriod] = useState("all")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedItem, setSelectedItem] = useState<FoodItem | null>(null)
  const [portionSizes, setPortionSizes] = useState<Record<number, string>>({})
  const [quantities, setQuantities] = useState<Record<number, number>>({})
  const [customPortions, setCustomPortions] = useState<Record<number, number>>({})
  const [isCustomizing, setIsCustomizing] = useState(false)

  // Set default portion sizes
  useEffect(() => {
    const defaultSizes: Record<number, string> = {}
    foodItems.forEach((item) => {
      defaultSizes[item.id] = "medium"
    })
    setPortionSizes(defaultSizes)
  }, [foodItems])

  const handlePortionSizeChange = (itemId: number, size: string) => {
    setPortionSizes((prev) => ({
      ...prev,
      [itemId]: size,
    }))
  }

  const handleCustomPortionChange = (itemId: number, value: number[]) => {
    setCustomPortions((prev) => ({
      ...prev,
      [itemId]: value[0],
    }))
  }

  const handleQuantityChange = (itemId: number, value: number) => {
    setQuantities((prev) => ({
      ...prev,
      [itemId]: Math.max(0, (prev[itemId] || 0) + value),
    }))
  }

  const handleAddToCart = (item: FoodItem) => {
    const quantity = quantities[item.id] || 1
    const portionSize = portionSizes[item.id] || "medium"

    // If custom portion, calculate a custom multiplier
    let effectivePortionSize = portionSize
    if (portionSize === "custom" && customPortions[item.id]) {
      // Map the custom portion (0-100) to a size name for the cart
      const customValue = customPortions[item.id]
      if (customValue <= 30) effectivePortionSize = "small"
      else if (customValue <= 70) effectivePortionSize = "medium"
      else effectivePortionSize = "large"
    }

    onAddToCart(item, quantity, effectivePortionSize)

    // Reset after adding to cart
    setQuantities((prev) => ({
      ...prev,
      [item.id]: 0,
    }))
    setSelectedItem(null)
  }

  const getFilteredItems = () => {
    return foodItems.filter((item) => {
      // Filter by search term
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())

      // Filter by meal period
      const matchesMealPeriod =
        selectedMealPeriod === "all" || item.mealPeriod === selectedMealPeriod || item.mealPeriod === "all"

      // Filter by category
      const matchesCategory = selectedCategory === "all" || item.category === selectedCategory

      return matchesSearch && matchesMealPeriod && matchesCategory
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Low Stock":
        return (
          <Badge variant="outline" className="absolute top-2 right-2 text-amber-500 border-amber-500">
            Low Stock
          </Badge>
        )
      case "Out of Stock":
        return (
          <Badge variant="destructive" className="absolute top-2 right-2">
            Out of Stock
          </Badge>
        )
      default:
        return null
    }
  }

  // Calculate adjusted nutritional info based on portion size
  const getAdjustedNutrition = (item: FoodItem, portionSize: string) => {
    let multiplier = 1

    if (portionSize === "small") {
      multiplier = 0.7
    } else if (portionSize === "medium") {
      multiplier = 1
    } else if (portionSize === "large") {
      multiplier = 1.3
    } else if (portionSize === "custom" && customPortions[item.id]) {
      // Map 0-100 to 0.5-1.5 range
      multiplier = 0.5 + (customPortions[item.id] / 100) * 1
    }

    return {
      calories: Math.round(item.nutritionalInfo.calories * multiplier),
      protein: Math.round(item.nutritionalInfo.protein * multiplier * 10) / 10,
      carbs: Math.round(item.nutritionalInfo.carbs * multiplier * 10) / 10,
      fat: Math.round(item.nutritionalInfo.fat * multiplier * 10) / 10,
      price: Math.round(item.price * multiplier * 100) / 100,
    }
  }

  return (
    <Card className="h-full">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row items-center gap-5 mb-6">
          <div className="relative w-full md:flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search menu..."
              className="pl-9 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" className="h-10 w-10 shrink-0">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        <Tabs defaultValue="all" value={selectedMealPeriod} onValueChange={setSelectedMealPeriod}>
          <TabsList className="mb-4 w-full justify-start overflow-auto">
            {mealPeriods.map((period) => (
              <TabsTrigger key={period.id} value={period.id}>
                {period.name}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="mb-4">
            <TabsList className="w-full justify-start overflow-auto">
              {categories.map((category) => (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={selectedCategory === category.id ? "bg-primary text-primary-foreground" : ""}
                >
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {selectedItem ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-card rounded-lg border p-4 mb-4"
            >
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative h-40 md:w-1/3">
                  <Image
                    src={selectedItem.image || "/placeholder.svg"}
                    alt={selectedItem.name}
                    fill
                    className="object-cover rounded-md"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-medium">{selectedItem.name}</h3>
                      <p className="text-sm text-muted-foreground capitalize">{selectedItem.category}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setSelectedItem(null)} className="h-8 w-8">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-x"
                      >
                        <path d="M18 6 6 18" />
                        <path d="m6 6 12 12" />
                      </svg>
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Portion Size</h4>
                      <RadioGroup
                        value={portionSizes[selectedItem.id] || "medium"}
                        onValueChange={(value) => handlePortionSizeChange(selectedItem.id, value)}
                        className="flex flex-wrap gap-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="small" id="small" />
                          <Label htmlFor="small">Small</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="medium" id="medium" />
                          <Label htmlFor="medium">Medium</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="large" id="large" />
                          <Label htmlFor="large">Large</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="custom" id="custom" />
                          <Label htmlFor="custom">Custom</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {portionSizes[selectedItem.id] === "custom" && (
                      <div className="pt-2">
                        <div className="flex justify-between mb-2">
                          <span className="text-xs">Smaller</span>
                          <span className="text-xs">Larger</span>
                        </div>
                        <Slider
                          defaultValue={[50]}
                          max={100}
                          step={1}
                          value={[customPortions[selectedItem.id] || 50]}
                          onValueChange={(value) => handleCustomPortionChange(selectedItem.id, value)}
                          className="mb-4"
                        />
                      </div>
                    )}

                    <div className="bg-muted/30 p-3 rounded-md">
                      <h4 className="text-sm font-medium mb-2">Nutritional Information</h4>
                      <div className="grid grid-cols-4 gap-2 text-center">
                        {(() => {
                          const adjustedNutrition = getAdjustedNutrition(
                            selectedItem,
                            portionSizes[selectedItem.id] || "medium",
                          )
                          return (
                            <>
                              <div className="text-xs">
                                <p className="font-medium">{adjustedNutrition.calories}</p>
                                <p className="text-muted-foreground">Calories</p>
                              </div>
                              <div className="text-xs">
                                <p className="font-medium">{adjustedNutrition.protein}g</p>
                                <p className="text-muted-foreground">Protein</p>
                              </div>
                              <div className="text-xs">
                                <p className="font-medium">{adjustedNutrition.carbs}g</p>
                                <p className="text-muted-foreground">Carbs</p>
                              </div>
                              <div className="text-xs">
                                <p className="font-medium">{adjustedNutrition.fat}g</p>
                                <p className="text-muted-foreground">Fat</p>
                              </div>
                            </>
                          )
                        })()}
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleQuantityChange(selectedItem.id, -1)}
                          disabled={!quantities[selectedItem.id]}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="lucide lucide-minus"
                          >
                            <path d="M5 12h14" />
                          </svg>
                        </Button>
                        <span className="w-6 text-center">{quantities[selectedItem.id] || 0}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleQuantityChange(selectedItem.id, 1)}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="lucide lucide-plus"
                          >
                            <path d="M5 12h14" />
                            <path d="M12 5v14" />
                          </svg>
                        </Button>
                      </div>

                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          $
                          {getAdjustedNutrition(selectedItem, portionSizes[selectedItem.id] || "medium").price.toFixed(
                            2,
                          )}
                        </p>
                        <Button
                          onClick={() => handleAddToCart(selectedItem)}
                          disabled={!(quantities[selectedItem.id] || 0)}
                        >
                          <Plus className="h-4 w-4 mr-1" /> Add to Meal
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : null}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[calc(100vh-22rem)] overflow-y-auto p-1">
            {getFilteredItems().map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="cursor-pointer"
                onClick={() => setSelectedItem(item)}
              >
                <div className="border rounded-lg overflow-hidden hover:shadow-md transition-all duration-200">
                  <div className="relative h-32">
                    <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
                    {getStatusBadge(item.status)}
                    <Badge className="absolute top-2 left-2 bg-primary">
                      <Clock className="h-3 w-3 mr-1" />
                      {item.mealPeriod === "all" ? "All Day" : item.mealPeriod}
                    </Badge>
                  </div>
                  <div className="p-3">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-sm">{item.name}</h3>
                      <p className="font-semibold text-sm">${item.price.toFixed(2)}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="text-xs text-muted-foreground">
                        {item.nutritionalInfo.calories} cal | P: {item.nutritionalInfo.protein}g
                      </div>
                      <div className="flex justify-between items-center">
                        <Badge variant="outline" className="text-xs capitalize">
                          {item.category}
                        </Badge>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Info className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-60" onClick={(e) => e.stopPropagation()}>
                            <div className="space-y-2">
                              <h4 className="font-medium">{item.name}</h4>
                              <div className="text-sm">
                                <div className="grid grid-cols-2 gap-1">
                                  <span className="text-muted-foreground">Calories:</span>
                                  <span>{item.nutritionalInfo.calories}</span>
                                  <span className="text-muted-foreground">Protein:</span>
                                  <span>{item.nutritionalInfo.protein}g</span>
                                  <span className="text-muted-foreground">Carbs:</span>
                                  <span>{item.nutritionalInfo.carbs}g</span>
                                  <span className="text-muted-foreground">Fat:</span>
                                  <span>{item.nutritionalInfo.fat}g</span>
                                </div>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </Tabs>
      </CardContent>
    </Card>
  )
}
