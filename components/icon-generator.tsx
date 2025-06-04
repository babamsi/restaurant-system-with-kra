"use client"

import { useTheme } from "next-themes"
import { useEffect } from "react"

function downloadSVG(svgString: string, filename: string) {
  const blob = new Blob([svgString], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export default function IconGenerator() {
  useEffect(() => {
    // Generate apple-icon.png (192x192)
    const appleIcon = `
      <svg width="192" height="192" viewBox="0 0 192 192" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="192" height="192" fill="#D6B98F"/>
        <circle cx="96" cy="96" r="86" fill="#D6B98F" stroke="#392A17" stroke-width="4"/>
        <text x="96" y="134" text-anchor="middle" font-size="96" font-family="serif" fill="#392A17">𐒑</text>
      </svg>
    `
    downloadSVG(appleIcon, 'apple-icon.svg')

    // Generate apple-icon-180.png (180x180)
    const appleIcon180 = `
      <svg width="180" height="180" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="180" height="180" fill="#D6B98F"/>
        <circle cx="90" cy="90" r="81" fill="#D6B98F" stroke="#392A17" stroke-width="4"/>
        <text x="90" y="126" text-anchor="middle" font-size="90" font-family="serif" fill="#392A17">𐒑</text>
      </svg>
    `
    downloadSVG(appleIcon180, 'apple-icon-180.svg')

    // Generate apple-icon-precomposed.png (192x192)
    const appleIconPrecomposed = `
      <svg width="192" height="192" viewBox="0 0 192 192" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="192" height="192" fill="#D6B98F"/>
        <circle cx="96" cy="96" r="86" fill="#D6B98F" stroke="#392A17" stroke-width="4"/>
        <text x="96" y="134" text-anchor="middle" font-size="96" font-family="serif" fill="#392A17">𐒑</text>
      </svg>
    `
    downloadSVG(appleIconPrecomposed, 'apple-icon-precomposed.svg')
  }, [])

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Icon Generator</h1>
      <p>Your icons are being generated and downloaded automatically.</p>
      <ul className="list-disc ml-6 mt-4">
        <li>apple-icon.svg (192x192)</li>
        <li>apple-icon-180.svg (180x180)</li>
        <li>apple-icon-precomposed.svg (192x192)</li>
      </ul>
      <p className="mt-4 text-sm text-muted-foreground">
        Once downloaded, convert these SVG files to PNG format and place them in your public directory.
      </p>
    </div>
  )
}
