"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

export function NutritionInfo() {
  // Example nutrition data for the current order
  const nutritionData = {
    calories: {
      current: 440,
      recommended: 800,
      percentage: 55,
    },
    protein: {
      current: 28,
      recommended: 50,
      percentage: 56,
    },
    carbs: {
      current: 45,
      recommended: 100,
      percentage: 45,
    },
    fat: {
      current: 18,
      recommended: 30,
      percentage: 60,
    },
    fiber: {
      current: 8,
      recommended: 25,
      percentage: 32,
    },
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nutrition Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Calories</span>
              <span>
                {nutritionData.calories.current} / {nutritionData.calories.recommended} kcal
              </span>
            </div>
            <Progress value={nutritionData.calories.percentage} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Protein</span>
              <span>
                {nutritionData.protein.current}g / {nutritionData.protein.recommended}g
              </span>
            </div>
            <Progress value={nutritionData.protein.percentage} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Carbohydrates</span>
              <span>
                {nutritionData.carbs.current}g / {nutritionData.carbs.recommended}g
              </span>
            </div>
            <Progress value={nutritionData.carbs.percentage} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Fat</span>
              <span>
                {nutritionData.fat.current}g / {nutritionData.fat.recommended}g
              </span>
            </div>
            <Progress value={nutritionData.fat.percentage} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Fiber</span>
              <span>
                {nutritionData.fiber.current}g / {nutritionData.fiber.recommended}g
              </span>
            </div>
            <Progress value={nutritionData.fiber.percentage} className="h-2" />
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            * Based on a 2000 calorie diet. Your daily values may be higher or lower depending on your calorie needs.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
