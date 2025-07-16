# Responsive Sidebar System

This document describes the responsive sidebar implementation that provides an optimal user experience across all device sizes.

## Overview

The responsive sidebar system automatically adapts to different screen sizes and provides a consistent navigation experience across mobile, tablet, and desktop devices.

## Features

### 🎯 Responsive Behavior
- **Mobile (< 768px)**: Overlay sheet with hamburger menu trigger
- **Tablet (768px - 1023px)**: Icon-only sidebar (auto-collapsed)
- **Desktop (≥ 1024px)**: Full sidebar with user preference persistence

### 🔄 State Management
- Automatic state persistence using localStorage
- Smart auto-collapse on tablet devices
- User preference preservation on desktop
- Smooth transitions between states

### 🎨 User Experience
- Smooth animations and transitions
- Tooltips for collapsed state
- Auto-close on mobile navigation
- Accessible with proper ARIA labels
- Keyboard shortcuts support

## Components

### Core Components

#### `Sidebar` (`components/sidebar.tsx`)
The main sidebar component that handles all responsive behavior.

```tsx
import { Sidebar } from "@/components/sidebar"

// Usage in layout
<Sidebar />
```

#### `ResponsiveLayout` (`components/responsive-layout.tsx`)
Layout wrapper that handles responsive spacing and transitions.

```tsx
import { ResponsiveLayout } from "@/components/responsive-layout"

<ResponsiveLayout showSidebar={true}>
  {children}
</ResponsiveLayout>
```

#### `MobileMenuTrigger` (`components/mobile-menu-trigger.tsx`)
Dedicated mobile menu trigger button.

```tsx
import { MobileMenuTrigger } from "@/components/mobile-menu-trigger"

<MobileMenuTrigger onClick={() => setIsOpen(true)} />
```

### Custom Hooks

#### `useResponsive` (`hooks/use-responsive.tsx`)
Hook that provides responsive state information.

```tsx
import { useResponsive } from "@/hooks/use-responsive"

const { isMobile, isTablet, isDesktop, width } = useResponsive()
```

#### `useSidebarState` (`hooks/use-responsive.tsx`)
Hook that manages sidebar state with persistence.

```tsx
import { useSidebarState } from "@/hooks/use-responsive"

const { collapsed, setCollapsed, isMobile, isTablet, isDesktop } = useSidebarState()
```

## Implementation Details

### Breakpoints
```tsx
const BREAKPOINTS = {
  mobile: 768,   // < 768px
  tablet: 1024,  // 768px - 1023px
}
```

### State Persistence
The sidebar state is automatically saved to localStorage and restored on page load:

```tsx
// Save state
localStorage.setItem('sidebar-collapsed', JSON.stringify(collapsed))

// Load state
const savedCollapsed = localStorage.getItem('sidebar-collapsed')
if (savedCollapsed !== null) {
  setCollapsed(JSON.parse(savedCollapsed))
}
```

### Responsive Logic
```tsx
// Auto-adjust based on screen size
if (isMobile) {
  setCollapsed(false)  // Always expanded on mobile (overlay)
} else if (isTablet) {
  setCollapsed(true)   // Auto-collapse on tablet
}
// On desktop, keep user preference
```

## CSS Classes

### Layout Classes
- `.app-layout`: Main layout container
- `.app-sidebar`: Sidebar container
- `.app-main`: Main content area

### Responsive Classes
- `md:hidden`: Hide on tablet and up
- `hidden md:flex`: Hide on mobile, show on tablet and up
- `md:ml-16`: Margin for collapsed sidebar (64px)
- `md:ml-64`: Margin for expanded sidebar (256px)

### Transition Classes
- `transition-all duration-300 ease-in-out`: Smooth transitions
- `data-collapsed="true"`: Collapsed state attribute

## Usage Examples

### Basic Implementation
```tsx
// In your layout component
import { Sidebar } from "@/components/sidebar"
import { ResponsiveLayout } from "@/components/responsive-layout"

export default function Layout({ children }) {
  return (
    <ResponsiveLayout showSidebar={true}>
      <Sidebar />
      {children}
    </ResponsiveLayout>
  )
}
```

### Conditional Sidebar
```tsx
// Hide sidebar on specific routes
const shouldShowSidebar = !pathname.startsWith("/public")

<ResponsiveLayout showSidebar={shouldShowSidebar}>
  {shouldShowSidebar && <Sidebar />}
  {children}
</ResponsiveLayout>
```

### Custom Responsive Logic
```tsx
import { useSidebarState } from "@/hooks/use-responsive"

function MyComponent() {
  const { isMobile, collapsed, setCollapsed } = useSidebarState()
  
  return (
    <div>
      {isMobile ? (
        <p>Mobile view</p>
      ) : (
        <p>Desktop view - Sidebar {collapsed ? 'collapsed' : 'expanded'}</p>
      )}
    </div>
  )
}
```

## Customization

### Adding Navigation Items
```tsx
const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "New Page", href: "/new-page", icon: FileText },
  // Add more items...
]
```

### Custom Breakpoints
```tsx
// In hooks/use-responsive.tsx
const BREAKPOINTS = {
  mobile: 640,   // Custom mobile breakpoint
  tablet: 1024,  // Custom tablet breakpoint
}
```

### Custom Styling
```css
/* Custom sidebar styling */
.app-sidebar {
  background: linear-gradient(to bottom, #1a1a1a, #2a2a2a);
  border-right: 1px solid #333;
}

/* Custom mobile trigger */
.mobile-menu-trigger {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}
```

## Best Practices

### 1. Performance
- Use `useCallback` for event handlers
- Debounce resize events if needed
- Lazy load sidebar content for large navigation

### 2. Accessibility
- Always include `sr-only` text for screen readers
- Use proper ARIA labels and roles
- Ensure keyboard navigation works

### 3. User Experience
- Provide visual feedback for interactions
- Use consistent spacing and sizing
- Test on real devices, not just browser dev tools

### 4. State Management
- Keep state minimal and focused
- Use localStorage sparingly
- Handle edge cases (e.g., localStorage disabled)

## Troubleshooting

### Common Issues

#### Sidebar not collapsing on tablet
- Check if the responsive hook is properly detecting screen size
- Verify CSS media queries are correct
- Ensure no conflicting styles override the behavior

#### Mobile menu not opening
- Check if Sheet component is properly imported
- Verify z-index values are correct
- Ensure no other elements are blocking the trigger

#### State not persisting
- Check if localStorage is available
- Verify the state is being saved correctly
- Handle localStorage disabled scenarios

#### Smooth transitions not working
- Ensure CSS transitions are properly defined
- Check for conflicting transition properties
- Verify transform properties are set correctly

### Debug Mode
Add this to your component for debugging:

```tsx
const { isMobile, isTablet, isDesktop, width } = useResponsive()

console.log('Responsive state:', { isMobile, isTablet, isDesktop, width })
```

## Future Enhancements

### Planned Features
- [ ] Touch gestures for mobile (swipe to open/close)
- [ ] Multiple sidebar themes
- [ ] Customizable breakpoints per component
- [ ] Animation presets
- [ ] Sidebar groups and sections

### Performance Optimizations
- [ ] Virtual scrolling for large navigation lists
- [ ] Lazy loading of sidebar content
- [ ] Optimized re-renders with React.memo
- [ ] Intersection Observer for visibility detection

## Browser Support

- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## Dependencies

- React 18+
- Next.js 13+
- Tailwind CSS 3+
- Radix UI (Sheet, Tooltip)
- Lucide React (Icons)

## Contributing

When contributing to the responsive sidebar system:

1. Test on multiple devices and screen sizes
2. Ensure accessibility standards are met
3. Add proper TypeScript types
4. Update documentation for new features
5. Include visual regression tests

---

For more information, see the test page at `/test-responsive` to see the responsive behavior in action. 