"use client"

import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Upload, X, Image as ImageIcon, Camera } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
  onRemove?: () => void
  disabled?: boolean
  className?: string
  accept?: string
  maxSize?: number // in MB
}

export function ImageUpload({
  value,
  onChange,
  onRemove,
  disabled = false,
  className = "",
  accept = "image/*",
  maxSize = 5
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileSelect = async (file: File) => {
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast({ title: "Invalid file type", description: "Please select an image file.", variant: "destructive" })
      return
    }
    if (file.size > maxSize * 1024 * 1024) {
      toast({ title: "File too large", description: `Please select an image smaller than ${maxSize}MB.`, variant: "destructive" })
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'recipe-image')

      const response = await fetch('/api/upload-image', { method: 'POST', body: formData })
      if (!response.ok) throw new Error('Upload failed')

      const data = await response.json()
      if (data.success && data.url) {
        onChange(data.url)
        toast({ title: "Image uploaded successfully", description: "Your recipe image has been uploaded." })
      } else {
        throw new Error(data.error || 'Upload failed')
      }
    } catch (error: any) {
      console.error('Upload error:', error)
      toast({ title: "Upload failed", description: error?.message || "Failed to upload image. Please try again.", variant: "destructive" })
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }

  const handleRemoveImage = () => {
    onChange('')
    onRemove?.()
  }

  const openFileDialog = () => fileInputRef.current?.click()

  return (
    <div className={`space-y-2 ${className}`}>
      <Label>Recipe Image</Label>
      {value ? (
        <Card className="relative group">
          <CardContent className="p-0">
            <div className="relative">
              <img src={value} alt="Recipe preview" className="w-full h-48 object-cover rounded-lg" />
              {!disabled && (
                <Button variant="destructive" size="icon" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={handleRemoveImage}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card
          className={`border-2 border-dashed transition-colors cursor-pointer ${dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={disabled ? undefined : openFileDialog}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <CardContent className="flex flex-col items-center justify-center py-8 px-4">
            {isUploading ? (
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Uploading...</p>
              </div>
            ) : (
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium mb-1">Upload recipe image</p>
                <p className="text-xs text-muted-foreground mb-3">Drag and drop or click to select</p>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); openFileDialog() }} disabled={disabled}>
                    <Upload className="h-4 w-4 mr-2" />
                    Choose File
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); openFileDialog() }} disabled={disabled}>
                    <Camera className="h-4 w-4 mr-2" />
                    Camera
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Max size: {maxSize}MB</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Input ref={fileInputRef} type="file" accept={accept} onChange={handleFileInputChange} className="hidden" disabled={disabled} />
    </div>
  )
}


