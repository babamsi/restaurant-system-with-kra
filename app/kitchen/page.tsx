"use client"

import { CorrectedKitchenManager } from "@/components/kitchen/corrected-kitchen-manager"
import ProtectedRoute from '@/components/ui/ProtectedRoute';

export default function KitchenPage() {
  return (
    <ProtectedRoute>
      <div className="container mx-auto p-6">
        <CorrectedKitchenManager />
      </div>
    </ProtectedRoute>
  );
}
