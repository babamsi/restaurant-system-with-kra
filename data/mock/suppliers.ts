import type { Supplier } from "@/stores/supplier-store"

export const mockSuppliers: Supplier[] = [
  {
    id: "1",
    name: "Fresh Produce Co.",
    email: "orders@freshproduce.com",
    phone: "+1 (555) 123-4567",
    address: "123 Market St, Foodville, FL 12345",
    categories: ["Vegetables", "Fruits"],
    payment_terms: "Net 30",
    orders: []
  },
  {
    id: "2",
    name: "Quality Meats Ltd.",
    email: "sales@qualitymeats.com",
    phone: "+1 (555) 234-5678",
    address: "456 Butcher Ave, Meatville, MT 23456",
    categories: ["Proteins"],
    payment_terms: "Net 15",
    orders: []
  },
  {
    id: "3",
    name: "Dairy Delights",
    email: "orders@dairydelights.com",
    phone: "+1 (555) 345-6789",
    address: "789 Milk Rd, Dairyville, DA 34567",
    categories: ["Dairy"],
    payment_terms: "Net 30",
    orders: []
  },
  {
    id: "4",
    name: "Spice World",
    email: "sales@spiceworld.com",
    phone: "+1 (555) 456-7890",
    address: "321 Spice Lane, Spiceville, SP 45678",
    categories: ["Spices"],
    payment_terms: "Net 30",
    orders: []
  },
  {
    id: "5",
    name: "Grain Masters",
    email: "orders@grainmasters.com",
    phone: "+1 (555) 567-8901",
    address: "654 Wheat St, Grainville, GR 56789",
    categories: ["Grains"],
    payment_terms: "Net 15",
    orders: []
  }
] 