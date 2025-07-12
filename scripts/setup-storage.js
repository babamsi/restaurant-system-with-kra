#!/usr/bin/env node

/**
 * Supabase Storage Setup Script
 * 
 * This script helps set up the storage bucket for supplier receipts.
 * Run this after setting up your Supabase project.
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  console.error('\nPlease check your .env.local file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupStorage() {
  console.log('🚀 Setting up Supabase Storage for Receipts...\n')

  try {
    // Create receipts bucket
    console.log('📦 Creating receipts storage bucket...')
    const { data: bucketData, error: bucketError } = await supabase.storage.createBucket('receipts', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      fileSizeLimit: 10485760, // 10MB
    })

    if (bucketError) {
      if (bucketError.message.includes('already exists')) {
        console.log('✅ Receipts bucket already exists')
      } else {
        throw bucketError
      }
    } else {
      console.log('✅ Receipts bucket created successfully')
    }

    console.log('\n🎉 Storage setup completed!')
    console.log('\n📝 Next steps:')
    console.log('   1. Make sure your database schema is up to date')
    console.log('   2. Test uploading a receipt image')
    console.log('   3. Check that images are accessible via public URLs')

  } catch (error) {
    console.error('❌ Storage setup failed:', error.message)
    console.log('\n💡 Manual setup instructions:')
    console.log('   1. Go to your Supabase dashboard')
    console.log('   2. Navigate to Storage')
    console.log('   3. Create a new bucket called "receipts"')
    console.log('   4. Set it as public')
    console.log('   5. Configure policies for authenticated access')
    process.exit(1)
  }
}

// Run the setup
setupStorage() 