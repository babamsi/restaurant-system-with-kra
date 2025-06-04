"use client"

import { useState } from "react"
import { KitchenStats } from "@/components/kitchen/kitchen-stats"
import { IngredientUsageForm } from "@/components/kitchen/ingredient-usage-form"
import { PreparedFoodList } from "@/components/kitchen/prepared-food-list"
import { KitchenIngredients } from "@/components/kitchen/kitchen-ingredients"
import { KitchenRecipes } from "@/components/kitchen/kitchen-recipes"
import { KitchenMenu } from "@/components/kitchen/kitchen-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface KitchenDashboardProps {
  view?: "dashboard" | "ingredients" | "recipes" | "menu"
}

export function KitchenDashboard({ view = "dashboard" }: KitchenDashboardProps) {
  const [activeTab, setActiveTab] = useState("dashboard")

  return (
    <div className="space-y-6">
      <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
          <TabsTrigger value="recipes">Recipes</TabsTrigger>
          <TabsTrigger value="menu">Menu</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="m-0 animate-fade-in">
          <KitchenStats />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <IngredientUsageForm />
            <PreparedFoodList />
          </div>
        </TabsContent>

        <TabsContent value="ingredients" className="m-0 animate-fade-in">
          <KitchenIngredients />
        </TabsContent>

        <TabsContent value="recipes" className="m-0 animate-fade-in">
          <KitchenRecipes />
        </TabsContent>

        <TabsContent value="menu" className="m-0 animate-fade-in">
          <KitchenMenu />
        </TabsContent>
      </Tabs>
    </div>
  )
}
