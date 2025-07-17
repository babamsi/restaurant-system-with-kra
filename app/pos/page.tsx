import { CorrectedPOSSystem } from "@/components/pos/corrected-pos-system"
import { EnhancedPOSMenu } from "@/components/pos/enhanced-pos-menu"
import { AdvancedPOSSystem } from "@/components/pos/advanced-pos-system"
import { CleanPOSMenu } from "@/components/pos/clean-pos-menu"
import { ModernPOSDashboard } from "@/components/pos/modern-pos-dashboard"
import ProtectedRoute from '@/components/ui/ProtectedRoute';

export default function POSPage() {
  return (
    <ProtectedRoute>
      <CorrectedPOSSystem />
    </ProtectedRoute>
  );
}
