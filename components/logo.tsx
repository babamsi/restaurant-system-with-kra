"use client"

import { useTheme } from "next-themes"

interface LogoProps {
  className?: string
  size?: number
}

export function Logo({ className = "", size = 32 }: LogoProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Maamul Logo"
    >
      <circle
        cx="50"
        cy="50"
        r="45"
        fill={isDark ? "#D6B98F" : "#392A17"}
        className="transition-colors duration-300"
      />
      <text
        x="50"
        y="70"
        textAnchor="middle"
        fontSize="50"
        fontFamily="serif"
        fill={isDark ? "#392A17" : "#D6B98F"}
        className="transition-colors duration-300"
      >
        𐒑
      </text>
    </svg>
  )
}
