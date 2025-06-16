export interface PredefinedBatch {
  name: string;
  ingredients: {
    id: string;
    name: string;
    quantity: number;
    unit: string;
  }[];
  yield: number;
  yieldUnit: string;
  portions: number;
}

export const predefinedBatches: PredefinedBatch[] = [
  {
    name: "Pousin Chicken for Pizza",
    ingredients: [
      { id: "chicken-breast", name: "Chicken breast (boneless)", quantity: 150, unit: "g" },
      { id: "unsalted-butter", name: "Unsalted Butter", quantity: 50, unit: "g" },
      { id: "frying-oil", name: "Frying Oil", quantity: 50, unit: "ml" },
      { id: "chilli-flakes", name: "Dried red chilli flakes", quantity: 0.33, unit: "tsp" },
      { id: "paprika", name: "Paprika (spanish)", quantity: 1, unit: "tsp" },
      { id: "garlic", name: "Garlic", quantity: 10, unit: "g" },
      { id: "lemon-juice", name: "Imported lemon juice", quantity: 1, unit: "tbsp" },
      { id: "black-pepper", name: "Black Pepper", quantity: 1, unit: "pinch" }
    ],
    yield: 200,
    yieldUnit: "g",
    portions: 1
  },
  {
    name: "Tomato Sauce Pizza",
    ingredients: [
      { id: "pomodoro", name: "Pomodoro Mixture", quantity: 2, unit: "ltr" },
      { id: "garlic", name: "Garlic", quantity: 2, unit: "clove" },
      { id: "white-onion", name: "White Onions", quantity: 100, unit: "g" },
      { id: "olive-oil", name: "Olive oil cooking", quantity: 5, unit: "tbsp" },
      { id: "salt", name: "Salt", quantity: 2, unit: "tsp" },
      { id: "basil", name: "Fresh Basil", quantity: 5, unit: "piece" }
    ],
    yield: 2,
    yieldUnit: "ltr",
    portions: 1
  }
] 