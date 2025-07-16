import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useSidebarState } from "@/hooks/use-responsive"

export default function TestResponsivePage() {
  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Responsive Sidebar Test</h1>
        <p className="text-muted-foreground">
          Test the responsive sidebar behavior on different screen sizes
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Mobile View</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              On mobile devices (&lt; 768px), the sidebar becomes a slide-out menu triggered by a hamburger button.
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Hamburger menu in top-left corner</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Full-width overlay when open</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Auto-closes on navigation</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tablet View</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              On tablets (768px - 1023px), the sidebar collapses to icons only to save space.
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Icons only (64px width)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Tooltips on hover</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Expandable with toggle button</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Desktop View</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              On desktop (&gt;= 1024px), the sidebar shows full text and icons with user preference persistence.
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span>Full sidebar (256px width)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span>State persists in localStorage</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span>Manual collapse/expand</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Responsive Behavior</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Mobile: Overlay sheet with hamburger trigger</li>
                <li>• Tablet: Icon-only sidebar (auto-collapsed)</li>
                <li>• Desktop: Full sidebar with user preference</li>
                <li>• Smooth transitions between states</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">User Experience</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• State persistence across sessions</li>
                <li>• Keyboard shortcuts (Ctrl/Cmd + B)</li>
                <li>• Auto-close on mobile navigation</li>
                <li>• Accessible with proper ARIA labels</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center p-8 border rounded-lg bg-muted/50">
        <p className="text-sm text-muted-foreground">
          Try resizing your browser window to see the responsive behavior in action!
        </p>
      </div>
    </div>
  )
} 