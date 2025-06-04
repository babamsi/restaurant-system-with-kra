import { create } from "zustand"
import { devtools } from "zustand/middleware"

interface InvoiceItem {
  id: number
  name: string
  quantity: number
  unit: string
  total_cost: number
  cost_per_unit: number
  mapped_ingredient_id?: number
  is_new_ingredient: boolean
}

interface Invoice {
  id: string
  supplier_name: string
  invoice_number: string
  date: string
  total_amount: number
  items: InvoiceItem[]
  processed_at: string
  status: "pending" | "processed" | "rejected"
}

interface SuppliersState {
  invoices: Invoice[]

  // Actions
  addInvoice: (invoice: Invoice) => void
  updateInvoice: (id: string, updates: Partial<Invoice>) => void
  processInvoice: (id: string) => void
  getInvoice: (id: string) => Invoice | undefined
  getInvoicesBySupplier: (supplierName: string) => Invoice[]
}

const initialInvoices: Invoice[] = [
  {
    id: "INV-001",
    supplier_name: "Premium Meats Co.",
    invoice_number: "PM-2024-001",
    date: "2024-01-15",
    total_amount: 245.5,
    items: [
      {
        id: 1,
        name: "Chicken Breast",
        quantity: 20,
        unit: "kg",
        total_cost: 170.0,
        cost_per_unit: 8.5,
        mapped_ingredient_id: 1,
        is_new_ingredient: false,
      },
      {
        id: 2,
        name: "Ground Beef",
        quantity: 6,
        unit: "kg",
        total_cost: 75.5,
        cost_per_unit: 12.58,
        mapped_ingredient_id: 2,
        is_new_ingredient: false,
      },
    ],
    processed_at: "2024-01-15T10:30:00Z",
    status: "processed",
  },
]

export const useSuppliersStore = create<SuppliersState>()(
  devtools(
    (set, get) => ({
      invoices: initialInvoices,

      addInvoice: (invoice) =>
        set(
          (state) => ({
            invoices: [invoice, ...state.invoices],
          }),
          false,
          "addInvoice",
        ),

      updateInvoice: (id, updates) =>
        set(
          (state) => ({
            invoices: state.invoices.map((invoice) => (invoice.id === id ? { ...invoice, ...updates } : invoice)),
          }),
          false,
          "updateInvoice",
        ),

      processInvoice: (id) =>
        set(
          (state) => ({
            invoices: state.invoices.map((invoice) =>
              invoice.id === id ? { ...invoice, status: "processed", processed_at: new Date().toISOString() } : invoice,
            ),
          }),
          false,
          "processInvoice",
        ),

      getInvoice: (id) => get().invoices.find((invoice) => invoice.id === id),

      getInvoicesBySupplier: (supplierName) =>
        get().invoices.filter((invoice) => invoice.supplier_name === supplierName),
    }),
    { name: "suppliers-store" },
  ),
)
