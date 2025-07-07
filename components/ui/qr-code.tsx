"use client"

import { useEffect, useRef } from 'react'

interface QRCodeProps {
  value: string
  size?: number
  className?: string
  dataTable?: number
}

export function QRCode({ value, size = 200, className = "", dataTable }: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const generateQRCode = async () => {
      if (!canvasRef.current || !value) return

      try {
        // Dynamic import of qrcode library
        const QRCodeLib = await import('qrcode')
        
        await QRCodeLib.toCanvas(canvasRef.current, value, {
          width: size,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        })
      } catch (error) {
        console.error('Error generating QR code:', error)
        // Fallback: create a simple text representation
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.fillStyle = '#f3f4f6'
          ctx.fillRect(0, 0, size, size)
          ctx.fillStyle = '#6b7280'
          ctx.font = '12px Arial'
          ctx.textAlign = 'center'
          ctx.fillText('QR Code', size / 2, size / 2 - 10)
          ctx.fillText('Not Available', size / 2, size / 2 + 10)
        }
      }
    }

    generateQRCode()
  }, [value, size])

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={className}
      data-table={dataTable}
      style={{ maxWidth: '100%', height: 'auto' }}
    />
  )
} 