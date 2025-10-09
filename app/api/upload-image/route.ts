import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
    try {
      const formData = await request.formData()
      const file = formData.get('file') as File
      const type = formData.get('type') as string
  
      if (!file) {
        return NextResponse.json(
          { error: 'No file provided' },
          { status: 400 }
        )
      }
  
      // Validate file type
      if (!file.type.startsWith('image/')) {
        return NextResponse.json(
          { error: 'Invalid file type. Please upload an image.' },
          { status: 400 }
        )
      }
  
      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) {
        return NextResponse.json(
          { error: 'File too large. Maximum size is 5MB.' },
          { status: 400 }
        )
      }
  
      // Generate unique filename
      const timestamp = Date.now()
      const randomString = Math.random().toString(36).substring(2, 15)
      const fileExtension = file.name.split('.').pop()
      const fileName = `${type}-${timestamp}-${randomString}.${fileExtension}`
  
      // Convert file to buffer
      const fileBuffer = await file.arrayBuffer()
  
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('recipe-images')
        .upload(fileName, fileBuffer, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: false
        })
  
      if (error) {
        console.error('Supabase upload error:', error)
        return NextResponse.json(
          { error: 'Failed to upload image' },
          { status: 500 }
        )
      }
  
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('recipe-images')
        .getPublicUrl(fileName)
  
      return NextResponse.json({
        success: true,
        url: urlData.publicUrl,
        fileName: fileName
      })
  
    } catch (error) {
      console.error('Upload error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }