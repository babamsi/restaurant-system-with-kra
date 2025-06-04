"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Minus, Plus, X, ChevronDown, ChevronUp } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"
import { Progress } from "@/components/ui/progress"

interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
  nutritionalInfo: {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
  unit: string
  mealPeriod: string
  category: string
  portionSize: string
  itemKey: string
}

interface POSCartProps {
  items: CartItem[]
  onUpdateQuantity: (itemKey: string, change: number) => void
  onRemoveItem: (itemKey: string) => void
}

export function POSCart({ items, onUpdateQuantity, onRemoveItem }: POSCartProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>("all")

  const subtotal = items.reduce((total, item) => {
    return total + item.price * item.quantity
  }, 0)

  const tax = subtotal * 0.16 // 16% VAT
  const total = subtotal + tax

  // Calculate total nutritional information
  const totalNutrition = items.reduce(
    (acc, item) => {
      return {
        calories: acc.calories + item.nutritionalInfo.calories * item.quantity,
        protein: acc.protein + item.nutritionalInfo.protein * item.quantity,
        carbs: acc.carbs + item.nutritionalInfo.carbs * item.quantity,
        fat: acc.fat + item.nutritionalInfo.fat * item.quantity,
      }
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  )

  // Calculate recommended daily values (example values)
  const recommendedValues = {
    calories: 2000,
    protein: 50,
    carbs: 275,
    fat: 78,
  }

  // Calculate percentages of daily values
  const nutritionPercentages = {
    calories: Math.min(100, (totalNutrition.calories / recommendedValues.calories) * 100),
    protein: Math.min(100, (totalNutrition.protein / recommendedValues.protein) * 100),
    carbs: Math.min(100, (totalNutrition.carbs / recommendedValues.carbs) * 100),
    fat: Math.min(100, (totalNutrition.fat / recommendedValues.fat) * 100),
  }

  // Group items by meal period for better organization
  const groupedItems: Record<string, CartItem[]> = {}
  items.forEach((item) => {
    if (!groupedItems[item.mealPeriod]) {
      groupedItems[item.mealPeriod] = []
    }
    groupedItems[item.mealPeriod].push(item)
  })

  // Sort meal periods in logical order
  const mealPeriodOrder = ["breakfast", "lunch", "dinner", "all"]
  const sortedMealPeriods = Object.keys(groupedItems).sort(
    (a, b) => mealPeriodOrder.indexOf(a) - mealPeriodOrder.indexOf(b),
  )

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3 pt-4">
        <div className="flex justify-between items-center">
          <CardTitle>Your Meal</CardTitle>
          <Badge variant="outline" className="font-normal">
            {items.length} {items.length === 1 ? "item" : "items"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-4 py-0">
        <div className="max-h-[calc(100vh-32rem)] overflow-y-auto">
          <AnimatePresence initial={false}>
            {items.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-8 text-center"
              >
                <div className="rounded-full bg-muted p-3 mb-2">
                  <ShoppingCart className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-1">Your meal is empty</p>
                <p className="text-xs text-muted-foreground">Add items from the menu to build your meal</p>
              </motion.div>
            ) : (
              <div className="space-y-4 py-2">
                {sortedMealPeriods.map((mealPeriod) => (
                  <div key={mealPeriod} className="mb-4">
                    <div
                      className="flex justify-between items-center mb-2 cursor-pointer"
                      onClick={() => toggleSection(mealPeriod)}
                    >
                      <h3 className="text-sm font-medium capitalize flex items-center">
                        {mealPeriod === "all" ? "All Day Items" : `${mealPeriod} Items`}
                        {expandedSection === mealPeriod ? (
                          <ChevronUp className="h-4 w-4 ml-1" />
                        ) : (
                          <ChevronDown className="h-4 w-4 ml-1" />
                        )}
                      </h3>
                      <Badge variant="outline">
                        {groupedItems[mealPeriod].length} {groupedItems[mealPeriod].length === 1 ? "item" : "items"}
                      </Badge>
                    </div>

                    <AnimatePresence>
                      {expandedSection === mealPeriod && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          {groupedItems[mealPeriod].map((item) => (
                            <motion.div
                              key={item.itemKey}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="space-y-2 mb-3">
                                <div className="flex justify-between">
                                  <div className="flex-1 pr-4">
                                    <p className="font-medium">{item.name}</p>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <span className="capitalize">{item.portionSize}</span>
                                      <span>•</span>
                                      <span className="capitalize">{item.category}</span>
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                    onClick={() => onRemoveItem(item.itemKey)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() => onUpdateQuantity(item.itemKey, -1)}
                                    >
                                      <Minus className="h-3 w-3" />
                                    </Button>
                                    <span className="w-6 text-center">{item.quantity}</span>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() => onUpdateQuantity(item.itemKey, 1)}
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {item.nutritionalInfo.calories * item.quantity} cal
                                    </p>
                                  </div>
                                </div>
                                <Separator />
                              </div>
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>

        {items.length > 0 && (
          <>
            <div className="space-y-2 pt-4">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax (16%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-muted/30 rounded-md">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-medium">Nutritional Information</h4>
                <span className="text-xs text-muted-foreground">% of daily values</span>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Calories</span>
                    <span>
                      {totalNutrition.calories} / {recommendedValues.calories}
                    </span>
                  </div>
                  <Progress value={nutritionPercentages.calories} className="h-2" />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Protein</span>
                    <span>
                      {totalNutrition.protein}g / {recommendedValues.protein}g
                    </span>
                  </div>
                  <Progress value={nutritionPercentages.protein} className="h-2" />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Carbs</span>
                    <span>
                      {totalNutrition.carbs}g / {recommendedValues.carbs}g
                    </span>
                  </div>
                  <Progress value={nutritionPercentages.carbs} className="h-2" />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Fat</span>
                    <span>
                      {totalNutrition.fat}g / {recommendedValues.fat}g
                    </span>
                  </div>
                  <Progress value={nutritionPercentages.fat} className="h-2" />
                </div>
              </div>

              <p className="text-xs text-muted-foreground mt-2">* Based on a 2000 calorie diet</p>
            </div>
          </>
        )}
      </CardContent>
      <CardFooter className="pt-4 pb-4">
        <Button className="w-full" disabled={items.length === 0}>
          Proceed to Payment
        </Button>
      </CardFooter>
    </Card>
  )
}

function ShoppingCart(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </svg>
  )
}
