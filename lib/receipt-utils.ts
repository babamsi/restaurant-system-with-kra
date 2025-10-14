// Utility functions for KRA receipts with PDF generation and QR codes

import * as QRCode from 'qrcode'

export interface KRAReceiptData {
  curRcptNo: string
  totRcptNo: string
  intrlData: string
  rcptSign: string
  sdcDateTime: string
  invcNo: number
  trdInvcNo: string
}

export interface ReceiptItem {
  name: string
  unit_price: number
  quantity: number
  total: number
  tax_rate: number
  tax_amount: number
  tax_type: 'A' | 'B' | 'C' | 'D' | 'E' // A-EX=Exempt, B=16% VAT, C=0%, D=Non-VAT, E=8%
}

export interface ReceiptRequest {
  kraData: KRAReceiptData
  items: ReceiptItem[]
  customer: {
    name: string
    pin?: string
  }
  payment_method: string
  total_amount: number
  tax_amount: number
  net_amount: number
  order_id: string
  discount_amount?: number
  discount_percentage?: number
  discount_narration?: string
}

// Business configuration
const BUSINESS_CONFIG = {
  name: "Restaurant POS",
  address: "Nairobi, Kenya",
  pin: "P600001926A",
  bhfId: "00",
  commercialMessage: "Welcome to our restaurant",
  thankYouMessage: "THANK YOU\nWE LOOK FORWARD TO SERVE YOU AGAIN"
}

// Tax configuration
const TAX_CONFIG = {
  vat16: 16,
  vat8: 8,
  exempt: 0,
  zeroRated: 0,
  nonVatable: 0
}

// Format currency for receipt
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-KE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

// Format date time for receipt
export function formatDateTime(dateTimeString: string): { date: string; time: string } {
  try {
    // Handle KRA sdcDateTime format: "YYYYMMDDHHMMSS" (e.g., "20250724113711")
    if (dateTimeString && dateTimeString.length === 14 && /^\d{14}$/.test(dateTimeString)) {
      const year = dateTimeString.substring(0, 4)
      const month = dateTimeString.substring(4, 6)
      const day = dateTimeString.substring(6, 8)
      const hour = dateTimeString.substring(8, 10)
      const minute = dateTimeString.substring(10, 12)
      const second = dateTimeString.substring(12, 14)
      
      const dateStr = `${day}/${month}/${year}`
      const timeStr = `${hour}:${minute}:${second}`
      
      return { date: dateStr, time: timeStr }
    }
    
    // Fallback to standard date parsing for other formats
    const date = new Date(dateTimeString)
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date')
    }
    
    const dateStr = date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
    const timeStr = date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
    return { date: dateStr, time: timeStr }
  } catch (error) {
    console.warn('Error parsing date time:', dateTimeString, error)
    // Return current date/time as fallback
    const now = new Date()
    return {
      date: now.toLocaleDateString('en-GB'),
      time: now.toLocaleTimeString('en-GB', { hour12: false })
    }
  }
}

// Generate QR code data URL
export async function generateQRCode(data: string): Promise<string> {
  try {
    const qrDataUrl = await QRCode.toDataURL(data, {
      width: 128,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
    return qrDataUrl
  } catch (error) {
    console.error('Error generating QR code:', error)
    return ''
  }
}

// Calculate tax breakdown with discount-responsive calculations
export function calculateTaxBreakdown(items: ReceiptItem[], discountAmount: number = 0, discountPercentage: number = 0) {
  const breakdown = {
    exempt: { amount: 0, tax: 0 },
    vat16: { amount: 0, tax: 0 },
    zeroRated: { amount: 0, tax: 0 },
    nonVatable: { amount: 0, tax: 0 },
    vat8: { amount: 0, tax: 0 }
  }

  // Calculate total before discount
  const totalBeforeDiscount = items.reduce((sum, item) => sum + item.total, 0)
  
  // Apply discount proportionally to each tax category
  items.forEach(item => {
    const itemRatio = item.total / totalBeforeDiscount
    const itemDiscount = discountAmount * itemRatio
    const discountedAmount = item.total - itemDiscount
    
    switch (item.tax_type) {
      case 'A':
        breakdown.exempt.amount += discountedAmount
        breakdown.exempt.tax += 0
        break
      case 'B':
        breakdown.vat16.amount += discountedAmount
        // Calculate tax on discounted amount (16% VAT)
        breakdown.vat16.tax += discountedAmount * 0.16
        break
      case 'C':
        breakdown.zeroRated.amount += discountedAmount
        breakdown.zeroRated.tax += 0
        break
      case 'D':
        breakdown.nonVatable.amount += discountedAmount
        breakdown.nonVatable.tax += 0
        break
      case 'E':
        breakdown.vat8.amount += discountedAmount
        // Calculate tax on discounted amount (8% VAT)
        breakdown.vat8.tax += discountedAmount * 0.08
        break
    }
  })

  return breakdown
}

// Generate KRA receipt text with proper discount handling
export function generateKRAReceiptText(data: ReceiptRequest): string {
  const { kraData, items, customer, payment_method, total_amount, tax_amount, net_amount, discount_amount = 0, discount_percentage = 0, discount_narration = '' } = data
  
  // Parse KRA date time
  const { date, time } = formatDateTime(kraData.sdcDateTime)
  
  // Calculate totals with proper discount handling
  const totalBeforeDiscount = items.reduce((sum, item) => sum + item.total, 0)
  const totalDiscount = discount_amount
  const subtotal = totalBeforeDiscount - totalDiscount
  
  // Calculate tax breakdown with discount - this gives us the correct VAT after discount
  const taxBreakdown = calculateTaxBreakdown(items, discount_amount, discount_percentage)
  
  // Use the calculated VAT from tax breakdown instead of the passed tax_amount
  const correctVATAmount = taxBreakdown.vat16.tax + taxBreakdown.vat8.tax
  
  // Format items for receipt
  const itemsText = items.map(item => {
    const unitPrice = formatCurrency(item.unit_price)
    const quantity = item.quantity
    const total = formatCurrency(item.total)
    const taxType = item.tax_type
    
    return `${item.name}\n${unitPrice}x ${quantity} ${total} ${taxType} ()`
  }).join('\n')
  
  // Format tax breakdown table
  const taxTable = `Rate Taxable Amount VAT
EX ${formatCurrency(taxBreakdown.exempt.amount)} ${formatCurrency(taxBreakdown.exempt.tax)}
16% ${formatCurrency(taxBreakdown.vat16.amount)} ${formatCurrency(taxBreakdown.vat16.tax)}
0% ${formatCurrency(taxBreakdown.zeroRated.amount)} ${formatCurrency(taxBreakdown.zeroRated.tax)}
Non-VAT ${formatCurrency(taxBreakdown.nonVatable.amount)} ${formatCurrency(taxBreakdown.nonVatable.tax)}
8% ${formatCurrency(taxBreakdown.vat8.amount)} ${formatCurrency(taxBreakdown.vat8.tax)}`
  
  // Generate receipt text matching KRA format exactly
  const receiptText = `
${BUSINESS_CONFIG.name}
${BUSINESS_CONFIG.address}
PIN: ${BUSINESS_CONFIG.pin}
TAX INVOICE
--------------------------------------------------
${BUSINESS_CONFIG.commercialMessage}
${customer.pin ? `Buyer PIN: ${customer.pin}` : ''}
--------------------------------------------------
${itemsText}
${discount_narration ? `\nDiscount narration and value: ${discount_percentage}% (${formatCurrency(totalDiscount)})` : ''}
-----------------------------------------------------
TOTAL BEFORE DISCOUNT ${formatCurrency(totalBeforeDiscount)}
${totalDiscount > 0 ? `TOTAL DISCOUNT AWARDED (${formatCurrency(totalDiscount)})` : ''}
SUB TOTAL ${formatCurrency(subtotal)}
VAT ${formatCurrency(correctVATAmount)}
TOTAL ${formatCurrency(total_amount)}
--------------------------------------------------
${payment_method.toUpperCase()} ${formatCurrency(total_amount)}
ITEMS NUMBER ${items.length}
------------------------------------------------
${taxTable}
------------------------------------------------
SCU INFORMATION
Date: ${date} Time: ${time}
SCU ID: ${kraData.curRcptNo}
CU INVOICE NO.: ${kraData.curRcptNo}/${kraData.invcNo}
Internal Data:
${kraData.intrlData}
Receipt Signature:
${kraData.rcptSign}
----------------------------------------------
TIS INFORMATION
RECEIPT NUMBER: ${kraData.totRcptNo}
DATE: ${date} TIME: ${time}
--------------------------------------------
${BUSINESS_CONFIG.thankYouMessage}
`.trim()

  return receiptText
}

// Generate QR code URL for KRA verification
export function generateKRAQRCodeURL(kraData: KRAReceiptData): string {
  const qrData = `${BUSINESS_CONFIG.pin}${BUSINESS_CONFIG.bhfId}${kraData.rcptSign}`
  return `https://etims-sbx.kra.go.ke/common/link/etims/receipt/indexEtimsReceiptData?Data=${encodeURIComponent(qrData)}`
}

// Generate receipt filename
export function generateReceiptFilename(orderId: string, kraInvoiceNo: number): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const time = new Date().toISOString().slice(11, 19).replace(/:/g, '')
  return `KRA-Receipt-${kraInvoiceNo}-${orderId}-${date}-${time}.pdf`
}

// Download receipt as PDF
export async function downloadReceiptAsPDF(pdfBlob: Blob, filename: string) {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    console.warn('PDF download attempted in server environment. Skipping download.')
    return Promise.resolve()
  }

  const url = URL.createObjectURL(pdfBlob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
  
  return Promise.resolve()
}

// Generate PDF receipt using jsPDF with exact KRA format
export async function generatePDFReceipt(data: ReceiptRequest): Promise<Blob> {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    throw new Error('PDF generation is only available in browser environment')
  }

  // Dynamic import for jsPDF to avoid SSR issues
  const { jsPDF } = await import('jspdf')
  
  // Use narrow receipt format (80mm width) instead of A4
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, 297] // 80mm width, standard receipt length
  })
  
  console.log('Generating PDF receipt...', data)
  
  const { kraData, items, customer, payment_method, total_amount, tax_amount, net_amount, discount_amount = 0, discount_percentage = 0, discount_narration = '' } = data
  
  // Parse KRA date time
  const { date, time } = formatDateTime(kraData.sdcDateTime)
  
  // Calculate totals with proper discount handling
  const totalBeforeDiscount = items.reduce((sum, item) => sum + item.total, 0)
  const totalDiscount = discount_amount
  const subtotal = totalBeforeDiscount - totalDiscount
  
  // Calculate tax breakdown with discount - this gives us the correct VAT after discount
  const taxBreakdown = calculateTaxBreakdown(items, discount_amount, discount_percentage)
  
  // Use the calculated VAT from tax breakdown instead of the passed tax_amount
  const correctVATAmount = taxBreakdown.vat16.tax + taxBreakdown.vat8.tax
  
  // Generate QR code
  const qrCodeURL = generateKRAQRCodeURL(kraData)
  const qrCodeDataUrl = await generateQRCode(qrCodeURL)
  
  // Set font and styling
  doc.setFont('helvetica')
  doc.setFontSize(8) // Smaller font for narrow receipt
  
  let yPosition = 10
  
  // Header - Business Name
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text(BUSINESS_CONFIG.name, 40, yPosition, { align: 'center' })
  yPosition += 6
  
  // Address
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(BUSINESS_CONFIG.address, 40, yPosition, { align: 'center' })
  yPosition += 5
  
  // PIN
  doc.text(`PIN: ${BUSINESS_CONFIG.pin}`, 40, yPosition, { align: 'center' })
  yPosition += 6
  
  // TAX INVOICE title
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('TAX INVOICE', 40, yPosition, { align: 'center' })
  yPosition += 6
  
  // Separator line
  doc.line(5, yPosition, 75, yPosition)
  yPosition += 5
  
  // Commercial message
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.text(BUSINESS_CONFIG.commercialMessage, 5, yPosition)
  yPosition += 5
  
  // Buyer PIN
  if (customer.pin) {
    doc.text(`Customer: ${customer.name}`, 5, yPosition)
    yPosition += 5
    doc.text(`Buyer PIN: ${customer.pin}`, 5, yPosition)
    yPosition += 5
  }
  
  // Separator line
  doc.line(5, yPosition, 75, yPosition)
  yPosition += 5
  
  // Items
  doc.setFontSize(7)
  items.forEach(item => {
    const itemText = `${item.name}`
    const priceText = `${formatCurrency(item.unit_price)}x ${item.quantity} ${formatCurrency(item.total)}${item.tax_type}`
    
    doc.text(itemText, 5, yPosition)
    yPosition += 3
    doc.text(priceText, 5, yPosition)
    yPosition += 5
  })
  
  // Discount
  if (discount_narration) {
    doc.text(`Discount: ${discount_percentage}% (${formatCurrency(totalDiscount)})`, 5, yPosition)
    yPosition += 5
  }
  
  // Separator line
  doc.line(5, yPosition, 75, yPosition)
  yPosition += 5
  
  // Totals section
  doc.text(`TOTAL BEFORE DISCOUNT ${formatCurrency(totalBeforeDiscount)}`, 5, yPosition)
  yPosition += 4
  
  if (totalDiscount > 0) {
    doc.text(`DISCOUNT (${formatCurrency(totalDiscount)})`, 5, yPosition)
    yPosition += 4
  }
  
  doc.text(`SUB TOTAL ${formatCurrency(subtotal)}`, 5, yPosition)
  yPosition += 4
  doc.text(`VAT ${formatCurrency(correctVATAmount)}`, 5, yPosition)
  yPosition += 4
  doc.text(`TOTAL ${formatCurrency(total_amount)}`, 5, yPosition)
  yPosition += 5
  
  // Separator line
  doc.line(5, yPosition, 75, yPosition)
  yPosition += 5
  
  // Payment method and items count
  doc.text(`${payment_method.toUpperCase()} ${formatCurrency(total_amount)}`, 5, yPosition)
  yPosition += 4
  doc.text(`ITEMS: ${items.length}`, 5, yPosition)
  yPosition += 5
  
  // Separator line
  doc.line(5, yPosition, 75, yPosition)
  yPosition += 5
  
  // Tax breakdown table (simplified for narrow format)
  doc.setFontSize(6)
  doc.text('Rate Amount VAT', 5, yPosition)
  yPosition += 3
  doc.text(`B-16% ${formatCurrency(taxBreakdown.vat16.amount)} ${formatCurrency(taxBreakdown.vat16.tax)}`, 5, yPosition)
  yPosition += 3
  doc.text(`E-8% ${formatCurrency(taxBreakdown.vat8.amount)} ${formatCurrency(taxBreakdown.vat8.tax)}`, 5, yPosition)
  yPosition += 3
  doc.text(`A-EX ${formatCurrency(taxBreakdown.exempt.amount)} ${formatCurrency(taxBreakdown.exempt.tax)}`, 5, yPosition)
  yPosition += 5
  doc.text(`D-Non VAT ${formatCurrency(taxBreakdown.nonVatable.amount)} ${formatCurrency(taxBreakdown.exempt.tax)}`, 5, yPosition)
  yPosition += 5
  // Separator line
  doc.line(5, yPosition, 75, yPosition)
  yPosition += 5
  
  // SCU INFORMATION
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.text('SCU INFORMATION', 5, yPosition)
  yPosition += 4
  
  doc.setFont('helvetica', 'normal')
  doc.text(`Date: ${date} Time: ${time}`, 5, yPosition)
  yPosition += 3
  doc.text(`SCU ID: ${kraData.curRcptNo}`, 5, yPosition)
  yPosition += 3
  doc.text(`Invoice: ${kraData.invcNo}`, 5, yPosition)
  yPosition += 3
  doc.text('Internal Data:', 5, yPosition)
  yPosition += 3
  doc.text(kraData.intrlData.substring(0, 30) + '...', 5, yPosition) // Truncate for narrow format
  yPosition += 3
  doc.text('Signature:', 5, yPosition)
  yPosition += 3
  doc.text(kraData.rcptSign.substring(0, 30) + '...', 5, yPosition) // Truncate for narrow format
  yPosition += 5
  
  // Separator line
  doc.line(5, yPosition, 75, yPosition)
  yPosition += 5
  
  // TIS INFORMATION
  doc.setFont('helvetica', 'bold')
  doc.text('TIS INFORMATION', 5, yPosition)
  yPosition += 4
  
  doc.setFont('helvetica', 'normal')
  doc.text(`RECEIPT: ${kraData.invcNo}`, 5, yPosition)
  yPosition += 3
  doc.text(`DATE: ${date} TIME: ${time}`, 5, yPosition)
  yPosition += 5
  
  // Separator line
  doc.line(5, yPosition, 75, yPosition)
  yPosition += 5
  
  // Thank you message
  doc.setFontSize(8)
  doc.text(BUSINESS_CONFIG.thankYouMessage, 40, yPosition, { align: 'center' })
  yPosition += 8
  
  // QR Code (smaller for narrow format)
  if (qrCodeDataUrl && yPosition < 250) {
    try {
      doc.addImage(qrCodeDataUrl, 'PNG', 55, yPosition, 20, 20)
      doc.setFontSize(6)
      doc.text('Scan to verify', 40, yPosition + 25, { align: 'center' })
    } catch (error) {
      console.error('Error adding QR code to PDF:', error)
    }
  }
  
  return doc.output('blob')
}

// Send receipt to API and download as PDF
export async function generateAndDownloadReceipt(receiptData: ReceiptRequest) {
  try {
    // Generate PDF receipt
    const pdfBlob = await generatePDFReceipt(receiptData)
    
    // Generate filename
    const filename = generateReceiptFilename(
      receiptData.order_id, 
      receiptData.kraData.invcNo
    )
    
    // Download the PDF receipt
    await downloadReceiptAsPDF(pdfBlob, filename)
    
    // Also save to database via API
    const response = await fetch('/api/kra/generate-receipt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(receiptData)
    })

    if (!response.ok) {
      console.warn('Failed to save receipt to database, but PDF was generated')
    }

    const result = await response.json()
    
    return {
      success: true,
      pdfBlob,
      filename,
      databaseResult: result
    }
  } catch (error) {
    console.error('Error generating receipt:', error)
    throw error
  }
}