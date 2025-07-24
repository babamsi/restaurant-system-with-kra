// Test script to verify KRA invoice number generation
// Run this script to test the invoice number generation logic

const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client (replace with your actual credentials)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testInvoiceNumberGeneration() {
  console.log('Testing KRA invoice number generation...')
  
  try {
    // Test 1: Get current highest invoice number
    const { data: currentData, error: currentError } = await supabase
      .from('kra_transactions')
      .select('kra_invoice_no')
      .not('kra_invoice_no', 'is', null)
      .order('kra_invoice_no', { ascending: false })
      .limit(1)
    
    if (currentError) {
      console.error('Error fetching current data:', currentError)
      return
    }
    
    const currentHighest = currentData && currentData.length > 0 ? currentData[0].kra_invoice_no : 0
    console.log('Current highest invoice number:', currentHighest)
    
    // Test 2: Generate next invoice number
    const nextInvoiceNo = currentHighest + 1
    console.log('Next invoice number would be:', nextInvoiceNo)
    
    // Test 3: Simulate multiple transactions
    console.log('\nSimulating multiple transactions:')
    for (let i = 1; i <= 5; i++) {
      const simulatedNext = currentHighest + i
      console.log(`Transaction ${i}: Invoice number ${simulatedNext}`)
    }
    
    // Test 4: Check for any duplicate invoice numbers
    const { data: allData, error: allError } = await supabase
      .from('kra_transactions')
      .select('kra_invoice_no, transaction_type, created_at')
      .not('kra_invoice_no', 'is', null)
      .order('kra_invoice_no', { ascending: false })
    
    if (allError) {
      console.error('Error fetching all data:', allError)
      return
    }
    
    // Check for duplicates
    const invoiceNumbers = allData.map(t => t.kra_invoice_no)
    const uniqueNumbers = new Set(invoiceNumbers)
    
    console.log('\nDuplicate check:')
    console.log(`Total transactions: ${invoiceNumbers.length}`)
    console.log(`Unique invoice numbers: ${uniqueNumbers.size}`)
    
    if (invoiceNumbers.length !== uniqueNumbers.size) {
      console.warn('⚠️  DUPLICATE INVOICE NUMBERS DETECTED!')
      const duplicates = invoiceNumbers.filter((num, index) => invoiceNumbers.indexOf(num) !== index)
      console.log('Duplicate numbers:', [...new Set(duplicates)])
    } else {
      console.log('✅ No duplicate invoice numbers found')
    }
    
    // Show recent transactions
    console.log('\nRecent transactions:')
    allData.slice(0, 10).forEach(t => {
      console.log(`Invoice: ${t.kra_invoice_no}, Type: ${t.transaction_type}, Date: ${t.created_at}`)
    })
    
  } catch (error) {
    console.error('Test failed:', error)
  }
}

// Run the test
testInvoiceNumberGeneration()
  .then(() => {
    console.log('\nTest completed')
    process.exit(0)
  })
  .catch(error => {
    console.error('Test failed:', error)
    process.exit(1)
  }) 