"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Monitor, Moon, Sun } from "lucide-react"

export function ThemeStatus() {
  const { theme, systemTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <Badge variant="outline">Loading theme...</Badge>
  }

  const getThemeIcon = () => {
    switch (resolvedTheme) {
      case "dark":
        return <Moon className="h-3 w-3" />
      case "light":
        return <Sun className="h-3 w-3" />
      default:
        return <Monitor className="h-3 w-3" />
    }
  }

  const getThemeLabel = () => {
    if (theme === "system") {
      return `System (${systemTheme})`
    }
    return theme?.charAt(0).toUpperCase() + theme?.slice(1)
  }

  return (
    <Badge variant="outline" className="gap-1">
      {getThemeIcon()}
      {getThemeLabel()}
    </Badge>
  )
}
