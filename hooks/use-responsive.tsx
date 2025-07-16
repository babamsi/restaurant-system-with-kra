import { useState, useEffect } from 'react'

export interface ResponsiveState {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  width: number
}

const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
}

export function useResponsive(): ResponsiveState {
  const [state, setState] = useState<ResponsiveState>({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    width: 0,
  })

  useEffect(() => {
    const updateState = () => {
      const width = window.innerWidth
      setState({
        isMobile: width < BREAKPOINTS.mobile,
        isTablet: width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet,
        isDesktop: width >= BREAKPOINTS.tablet,
        width,
      })
    }

    // Set initial state
    updateState()

    // Add event listener
    window.addEventListener('resize', updateState)
    
    // Cleanup
    return () => window.removeEventListener('resize', updateState)
  }, [])

  return state
}

export function useSidebarState() {
  const [collapsed, setCollapsed] = useState(false)
  const { isMobile, isTablet, isDesktop } = useResponsive()

  // Load sidebar state from localStorage
  useEffect(() => {
    const savedCollapsed = localStorage.getItem('sidebar-collapsed')
    if (savedCollapsed !== null) {
      setCollapsed(JSON.parse(savedCollapsed))
    }
  }, [])

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(collapsed))
  }, [collapsed])

  // Auto-adjust based on screen size
  useEffect(() => {
    if (isMobile) {
      setCollapsed(false)
    } else if (isTablet) {
      setCollapsed(true)
    }
    // On desktop, keep user preference
  }, [isMobile, isTablet])

  return {
    collapsed,
    setCollapsed,
    isMobile,
    isTablet,
    isDesktop,
  }
} 