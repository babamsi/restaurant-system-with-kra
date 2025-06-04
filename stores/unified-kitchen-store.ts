import { create } from "zustand"

export type Ingredient = {
  id: string
  name: string
  category: string
  quantity: number
  unit: string
  price_per_unit: number
  cooked: boolean
  sellable: boolean
  nutrition: {
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber: number
    sodium: number
  }
}

export type Recipe = {
  id: string
  name: string
  category: string
  ingredients: { id: string; quantity: number; unit: string }[]
  prep_time_minutes: number
  price_per_portion: number
  available_portions: number
  published: boolean
  nutrition_per_portion: {
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber: number
    sodium: number
  }
}

export type MenuItemForSale = {
  id: string
  name: string
  type: "individual" | "recipe"
  category: string
  price: number
  available_quantity: number
  unit: string
  display_unit: string
  bulk_unit: string
  conversion_factor: number
  prep_time_minutes?: number
  nutrition: {
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber: number
    sodium: number
  }
}

type KitchenState = {
  ingredients: Ingredient[]
  recipes: Recipe[]
  publishedRecipes: Recipe[]
  lastUpdated: string | null
}

type KitchenActions = {
  addIngredient: (ingredient: Ingredient) => void
  updateIngredient: (id: string, updates: Partial<Ingredient>) => void
  removeIngredient: (id: string) => void
  addRecipe: (recipe: Recipe) => void
  updateRecipe: (id: string, updates: Partial<Recipe>) => void
  removeRecipe: (id: string) => void
  publishRecipe: (id: string) => void
  unpublishRecipe: (id: string) => void
  notifyPOS: () => void
  loadInitialData: (initialState: KitchenState) => void
}

export const useUnifiedKitchenStore = create<KitchenState & KitchenActions>((set, get) => ({
  ingredients: [],
  recipes: [],
  publishedRecipes: [],
  lastUpdated: null,

  loadInitialData: (initialState) => {
    set(() => ({
      ingredients: initialState.ingredients,
      recipes: initialState.recipes,
      publishedRecipes: initialState.publishedRecipes,
      lastUpdated: initialState.lastUpdated,
    }))
  },

  addIngredient: (ingredient) => {
    set(
      (state) => ({
        ingredients: [...state.ingredients, ingredient],
      }),
      false,
      "addIngredient",
    )
  },

  updateIngredient: (id, updates) => {
    set(
      (state) => ({
        ingredients: state.ingredients.map((ingredient) =>
          ingredient.id === id ? { ...ingredient, ...updates } : ingredient,
        ),
      }),
      false,
      "updateIngredient",
    )
  },

  removeIngredient: (id) => {
    set(
      (state) => ({
        ingredients: state.ingredients.filter((ingredient) => ingredient.id !== id),
      }),
      false,
      "removeIngredient",
    )
  },

  addRecipe: (recipe) => {
    set(
      (state) => ({
        recipes: [...state.recipes, recipe],
      }),
      false,
      "addRecipe",
    )
  },

  updateRecipe: (id, updates) => {
    set(
      (state) => ({
        recipes: state.recipes.map((recipe) => (recipe.id === id ? { ...recipe, ...updates } : recipe)),
      }),
      false,
      "updateRecipe",
    )
  },

  removeRecipe: (id) => {
    set(
      (state) => ({
        recipes: state.recipes.filter((recipe) => recipe.id !== id),
      }),
      false,
      "removeRecipe",
    )
  },

  publishRecipe: (id) => {
    set(
      (state) => ({
        recipes: state.recipes.map((recipe) => (recipe.id === id ? { ...recipe, published: true } : recipe)),
        publishedRecipes: [...state.publishedRecipes, state.recipes.find((recipe) => recipe.id === id)!],
      }),
      false,
      "publishRecipe",
    )
  },

  unpublishRecipe: (id) => {
    set(
      (state) => ({
        recipes: state.recipes.map((recipe) => (recipe.id === id ? { ...recipe, published: false } : recipe)),
        publishedRecipes: state.publishedRecipes.filter((recipe) => recipe.id !== id),
      }),
      false,
      "unpublishRecipe",
    )
  },

  notifyPOS: () => {
    const state = get()
    const menuItems: MenuItemForSale[] = []

    // Add individual ingredients that are marked as cooked and sellable
    state.ingredients.forEach((ingredient) => {
      if (ingredient.cooked && ingredient.sellable) {
        // Convert units: kg → g, L → ml
        let displayUnit = ingredient.unit
        let conversionFactor = 1
        let availableInDisplayUnit = ingredient.quantity

        if (ingredient.unit === "kg") {
          displayUnit = "g"
          conversionFactor = 1000
          availableInDisplayUnit = ingredient.quantity * 1000
        } else if (ingredient.unit === "L") {
          displayUnit = "ml"
          conversionFactor = 1000
          availableInDisplayUnit = ingredient.quantity * 1000
        }

        menuItems.push({
          id: `ingredient-${ingredient.id}`,
          name: ingredient.name,
          type: "individual",
          category: ingredient.category,
          price: ingredient.price_per_unit / conversionFactor, // Price per gram/ml
          available_quantity: availableInDisplayUnit,
          unit: ingredient.unit, // Original bulk unit (kg, L)
          display_unit: displayUnit, // Display unit (g, ml)
          bulk_unit: ingredient.unit,
          conversion_factor: conversionFactor,
          nutrition: {
            calories: ingredient.nutrition.calories / conversionFactor, // Per gram/ml
            protein: ingredient.nutrition.protein / conversionFactor,
            carbs: ingredient.nutrition.carbs / conversionFactor,
            fat: ingredient.nutrition.fat / conversionFactor,
            fiber: ingredient.nutrition.fiber / conversionFactor,
            sodium: ingredient.nutrition.sodium / conversionFactor,
          },
        })
      }
    })

    // Add published recipes
    state.publishedRecipes.forEach((recipe) => {
      menuItems.push({
        id: `recipe-${recipe.id}`,
        name: recipe.name,
        type: "recipe",
        category: recipe.category,
        price: recipe.price_per_portion,
        available_quantity: recipe.available_portions,
        unit: "portion",
        display_unit: "portion",
        bulk_unit: "portion",
        conversion_factor: 1,
        prep_time_minutes: recipe.prep_time_minutes,
        nutrition: recipe.nutrition_per_portion,
      })
    })

    // Dispatch event to notify POS
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("menu-updated", {
          detail: { menuItems },
        }),
      )
    }

    set(
      (state) => ({
        lastUpdated: new Date().toISOString(),
      }),
      false,
      "notifyPOS",
    )
  },
}))
