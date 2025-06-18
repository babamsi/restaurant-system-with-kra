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

export const predefinedBatches: PredefinedBatch[] = [] 