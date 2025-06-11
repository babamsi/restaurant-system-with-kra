import { create } from "zustand"
import { devtools, subscribeWithSelector } from "zustand/middleware"
import type { Recipe, BatchPreparation, NutritionInfo } from "@/types/unified-system"
import { useCompleteInventoryStore } from "./complete-inventory-store"

interface KitchenState {
  recipes: Recipe[]
  batchPreparations: BatchPreparation[]
  lastUpdated: string

  // Actions
  addRecipe: (recipe: Omit<Recipe, "id" | "created_at" | "last_updated">) => Recipe
  updateRecipe: (id: number, updates: Partial<Recipe>) => void
  deleteRecipe: (id: number) => void
  publishRecipe: (id: number) => void
  unpublishRecipe: (id: number) => void
  prepareBatch: (recipeId: number, batchCount: number, preparedBy: string) => BatchPreparation
  updateAvailablePortions: (recipeId: number, portionsUsed: number) => void

  // Getters
  getRecipe: (id: number) => Recipe | undefined
  getPublishedRecipes: () => Recipe[]
  getAvailableRecipes: () => Recipe[]
  canMakeBatch: (recipeId: number, batchCount: number) => boolean
  calculateNutritionForRecipe: (ingredients: any[]) => NutritionInfo
}

const initialRecipes: Recipe[] = [
  {
    id: 1,
    name: "Grilled Chicken with Rice",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSVhtBlSl70N394EBCAS2pz1oyvw3NEAB-zxQ&s",
    category: "Main Course",
    description: "Tender grilled chicken breast served with basmati rice and steamed vegetables",
    yield_per_batch: 8,
    prep_time_minutes: 25,
    ingredients: [
      {
        ingredient_id: 1,
        ingredient_name: "Chicken Breast",
        quantity_needed: 1.2,
        unit: "kg",
        cost_per_unit: 8.5,
        total_cost: 10.2,
      },
      {
        ingredient_id: 2,
        ingredient_name: "Basmati Rice",
        quantity_needed: 0.8,
        unit: "kg",
        cost_per_unit: 3.2,
        total_cost: 2.56,
      },
      {
        ingredient_id: 3,
        ingredient_name: "Fresh Broccoli",
        quantity_needed: 0.6,
        unit: "kg",
        cost_per_unit: 4.8,
        total_cost: 2.88,
      },
    ],
    total_raw_cost: 15.64,
    selling_price: 23.5,
    markup_percentage: 50,
    available_portions: 16,
    is_published: true,
    nutrition_per_portion: {
      calories: 420,
      protein: 35,
      carbs: 28,
      fat: 12,
      fiber: 3,
      sodium: 180,
    },
    created_at: "2024-01-10",
    last_updated: "2024-01-15",
  },
  {
    id: 2,
    name: "Vegetable Stir Fry",
    image: "https://s.lightorangebean.com/media/20240914144639/Thai-Vegetable-Stir-Fry-with-Lime-and-Ginger_done.png",
    category: "Vegetarian",
    description: "Fresh mixed vegetables stir-fried with aromatic spices",
    yield_per_batch: 10,
    prep_time_minutes: 15,
    ingredients: [
      {
        ingredient_id: 3,
        ingredient_name: "Fresh Broccoli",
        quantity_needed: 0.8,
        unit: "kg",
        cost_per_unit: 4.8,
        total_cost: 3.84,
      },
      {
        ingredient_id: 4,
        ingredient_name: "Potatoes",
        quantity_needed: 1.0,
        unit: "kg",
        cost_per_unit: 2.1,
        total_cost: 2.1,
      },
    ],
    total_raw_cost: 5.94,
    selling_price: 12.0,
    markup_percentage: 100,
    available_portions: 20,
    is_published: true,
    nutrition_per_portion: {
      calories: 180,
      protein: 6,
      carbs: 32,
      fat: 4,
      fiber: 5,
      sodium: 45,
    },
    created_at: "2024-01-10",
    last_updated: "2024-01-15",
  },
]

export const useCompleteKitchenStore = create<KitchenState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      recipes: initialRecipes,
      batchPreparations: [],
      lastUpdated: new Date().toISOString(),

      addRecipe: (recipeData) => {
        const newRecipe: Recipe = {
          ...recipeData,
          id: Math.max(...get().recipes.map((r) => r.id), 0) + 1,
          available_portions: 0,
          is_published: false,
          created_at: new Date().toISOString().split("T")[0],
          last_updated: new Date().toISOString(),
        }

        set(
          (state) => ({
            recipes: [...state.recipes, newRecipe],
            lastUpdated: new Date().toISOString(),
          }),
          false,
          "addRecipe",
        )

        return newRecipe
      },

      updateRecipe: (id, updates) => {
        set(
          (state) => ({
            recipes: state.recipes.map((recipe) =>
              recipe.id === id ? { ...recipe, ...updates, last_updated: new Date().toISOString() } : recipe,
            ),
            lastUpdated: new Date().toISOString(),
          }),
          false,
          "updateRecipe",
        )
      },

      deleteRecipe: (id) => {
        set(
          (state) => ({
            recipes: state.recipes.filter((recipe) => recipe.id !== id),
            lastUpdated: new Date().toISOString(),
          }),
          false,
          "deleteRecipe",
        )
      },

      publishRecipe: (id) => {
        get().updateRecipe(id, { is_published: true })
      },

      unpublishRecipe: (id) => {
        get().updateRecipe(id, { is_published: false })
      },

      prepareBatch: (recipeId, batchCount, preparedBy) => {
        const recipe = get().getRecipe(recipeId)
        if (!recipe || !get().canMakeBatch(recipeId, batchCount)) {
          throw new Error("Cannot prepare batch: insufficient ingredients or recipe not found")
        }

        // Deduct ingredients from inventory
        const inventoryStore = useCompleteInventoryStore.getState()
        recipe.ingredients.forEach((ingredient) => {
          const totalNeeded = ingredient.quantity_needed * batchCount
          inventoryStore.updateStock(
            ingredient.ingredient_id,
            totalNeeded,
            "subtract",
            `Batch preparation: ${recipe.name}`,
          )
        })

        // Create batch preparation record
        const batchPreparation: BatchPreparation = {
          id: Date.now(),
          recipe_id: recipeId,
          recipe_name: recipe.name,
          batch_count: batchCount,
          portions_produced: recipe.yield_per_batch * batchCount,
          prepared_by: preparedBy,
          preparation_date: new Date().toISOString(),
          total_cost: recipe.total_raw_cost * batchCount,
        }

        // Update recipe available portions
        const newPortions = recipe.available_portions + recipe.yield_per_batch * batchCount

        set(
          (state) => ({
            recipes: state.recipes.map((r) =>
              r.id === recipeId ? { ...r, available_portions: newPortions, last_updated: new Date().toISOString() } : r,
            ),
            batchPreparations: [...state.batchPreparations, batchPreparation],
            lastUpdated: new Date().toISOString(),
          }),
          false,
          "prepareBatch",
        )

        return batchPreparation
      },

      updateAvailablePortions: (recipeId, portionsUsed) => {
        const recipe = get().getRecipe(recipeId)
        if (!recipe) return

        const newPortions = Math.max(0, recipe.available_portions - portionsUsed)
        get().updateRecipe(recipeId, { available_portions: newPortions })
      },

      getRecipe: (id) => get().recipes.find((recipe) => recipe.id === id),

      getPublishedRecipes: () => get().recipes.filter((recipe) => recipe.is_published),

      getAvailableRecipes: () => get().recipes.filter((recipe) => recipe.available_portions > 0),

      canMakeBatch: (recipeId, batchCount) => {
        const recipe = get().getRecipe(recipeId)
        if (!recipe) return false

        const inventoryStore = useCompleteInventoryStore.getState()

        return recipe.ingredients.every((ingredient) => {
          const inventoryItem = inventoryStore.getIngredient(ingredient.ingredient_id)
          if (!inventoryItem) return false

          const totalNeeded = ingredient.quantity_needed * batchCount
          return inventoryItem.current_stock >= totalNeeded
        })
      },

      calculateNutritionForRecipe: (ingredients) => {
        const totalNutrition = ingredients.reduce(
          (total, ingredient) => {
            const nutrition = ingredient.nutrition_per_unit
            const quantity = ingredient.quantity_needed

            return {
              calories: total.calories + nutrition.calories * quantity,
              protein: total.protein + nutrition.protein * quantity,
              carbs: total.carbs + nutrition.carbs * quantity,
              fat: total.fat + nutrition.fat * quantity,
              fiber: total.fiber + nutrition.fiber * quantity,
              sodium: total.sodium + nutrition.sodium * quantity,
            }
          },
          { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0 },
        )

        const yieldPerBatch = 10
        return {
          calories: Math.round(totalNutrition.calories / yieldPerBatch),
          protein: Math.round((totalNutrition.protein / yieldPerBatch) * 10) / 10,
          carbs: Math.round((totalNutrition.carbs / yieldPerBatch) * 10) / 10,
          fat: Math.round((totalNutrition.fat / yieldPerBatch) * 10) / 10,
          fiber: Math.round((totalNutrition.fiber / yieldPerBatch) * 10) / 10,
          sodium: Math.round(totalNutrition.sodium / yieldPerBatch),
        }
      },
    })),
    { name: "complete-kitchen-store" },
  ),
)
