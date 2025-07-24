// Utility functions for KRA receipts with PDF generation and QR codes

import QRCode from 'qrcode'

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
  tax_type: 'A-EX' | 'B' | 'C' | 'D' | 'E' // A-EX=Exempt, B=16% VAT, C=0%, D=Non-VAT, E=8%
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
  pin: "P052380018M",
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

// Calculate tax breakdown
export function calculateTaxBreakdown(items: ReceiptItem[]) {
  const breakdown = {
    exempt: { amount: 0, tax: 0 },
    vat16: { amount: 0, tax: 0 },
    zeroRated: { amount: 0, tax: 0 },
    nonVatable: { amount: 0, tax: 0 },
    vat8: { amount: 0, tax: 0 }
  }

  items.forEach(item => {
    switch (item.tax_type) {
      case 'A-EX':
        breakdown.exempt.amount += item.total
        breakdown.exempt.tax += 0
        break
      case 'B':
        breakdown.vat16.amount += item.total
        breakdown.vat16.tax += item.tax_amount
        break
      case 'C':
        breakdown.zeroRated.amount += item.total
        breakdown.zeroRated.tax += 0
        break
      case 'D':
        breakdown.nonVatable.amount += item.total
        breakdown.nonVatable.tax += 0
        break
      case 'E':
        breakdown.vat8.amount += item.total
        breakdown.vat8.tax += item.tax_amount
        break
    }
  })

  return breakdown
}

// Generate KRA receipt text
export function generateKRAReceiptText(data: ReceiptRequest): string {
  const { kraData, items, customer, payment_method, total_amount, tax_amount, net_amount, discount_amount = 0, discount_percentage = 0, discount_narration = '' } = data
  
  // Parse KRA date time
  const { date, time } = formatDateTime(kraData.sdcDateTime)
  
  // Calculate totals
  const totalBeforeDiscount = items.reduce((sum, item) => sum + item.total, 0)
  const totalDiscount = discount_amount
  const subtotal = totalBeforeDiscount - totalDiscount
  
  // Calculate tax breakdown
  const taxBreakdown = calculateTaxBreakdown(items)
  
  // Format items for receipt
  const itemsText = items.map(item => {
    const unitPrice = formatCurrency(item.unit_price)
    const quantity = item.quantity
    const total = formatCurrency(item.total)
    const taxType = item.tax_type
    
    return `${item.name}\n${unitPrice}x ${quantity} ${total}${taxType}`
  }).join('\n')
  
  // Format tax breakdown table
  const taxTable = `Rate Taxable Amount VAT
EX ${formatCurrency(taxBreakdown.exempt.amount)} ${formatCurrency(taxBreakdown.exempt.tax)}
16% ${formatCurrency(taxBreakdown.vat16.amount)} ${formatCurrency(taxBreakdown.vat16.tax)}
0% ${formatCurrency(taxBreakdown.zeroRated.amount)} ${formatCurrency(taxBreakdown.zeroRated.tax)}
Non-VAT ${formatCurrency(taxBreakdown.nonVatable.amount)} ${formatCurrency(taxBreakdown.nonVatable.tax)}
8% ${formatCurrency(taxBreakdown.vat8.amount)} ${formatCurrency(taxBreakdown.vat8.tax)}`
  
  // Generate receipt text
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
VAT ${formatCurrency(tax_amount)}
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
  const qrData = `${BUSINESS_CONFIG.pin}+${kraData.curRcptNo}+${kraData.rcptSign}`
  return `https://etims.kra.go.ke/common/link/etims/receipt/indexEtimsReceptData?${encodeURIComponent(qrData)}`
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

// Generate PDF receipt using jsPDF
export async function generatePDFReceipt(data: ReceiptRequest): Promise<Blob> {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    throw new Error('PDF generation is only available in browser environment')
  }

  // Dynamic import for jsPDF to avoid SSR issues
  const { jsPDF } = await import('jspdf')
  
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })
  
  const { kraData, items, customer, payment_method, total_amount, tax_amount, net_amount, discount_amount = 0, discount_percentage = 0, discount_narration = '' } = data
  
  // Parse KRA date time
  const { date, time } = formatDateTime(kraData.sdcDateTime)
  
  // Calculate totals
  const totalBeforeDiscount = items.reduce((sum, item) => sum + item.total, 0)
  const totalDiscount = discount_amount
  const subtotal = totalBeforeDiscount - totalDiscount
  
  // Calculate tax breakdown
  const taxBreakdown = calculateTaxBreakdown(items)
  
  // Generate QR code
  const qrCodeURL = generateKRAQRCodeURL(kraData)
  const qrCodeDataUrl = await generateQRCode(qrCodeURL)
  
  // Set font and styling
  doc.setFont('helvetica')
  doc.setFontSize(12)
  
  let yPosition = 20
  
  // Header
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(BUSINESS_CONFIG.name, 105, yPosition, { align: 'center' })
  yPosition += 8
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(BUSINESS_CONFIG.address, 105, yPosition, { align: 'center' })
  yPosition += 6
  
  doc.text(`PIN: ${BUSINESS_CONFIG.pin}`, 105, yPosition, { align: 'center' })
  yPosition += 8
  
  // Title
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('TAX INVOICE', 105, yPosition, { align: 'center' })
  yPosition += 8
  
  // Separator line
  doc.line(20, yPosition, 190, yPosition)
  yPosition += 6
  
  // Commercial message
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(BUSINESS_CONFIG.commercialMessage, 20, yPosition)
  yPosition += 6
  
  // Customer PIN
  if (customer.pin) {
    doc.text(`Buyer PIN: ${customer.pin}`, 20, yPosition)
    yPosition += 6
  }
  
  // Separator line
  doc.line(20, yPosition, 190, yPosition)
  yPosition += 6
  
  // Items
  doc.setFontSize(10)
  items.forEach(item => {
    const itemText = `${item.name}`
    const priceText = `${formatCurrency(item.unit_price)}x ${item.quantity} ${formatCurrency(item.total)}${item.tax_type}`
    
    doc.text(itemText, 20, yPosition)
    yPosition += 4
    doc.text(priceText, 20, yPosition)
    yPosition += 6
  })
  
  // Discount
  if (discount_narration) {
    doc.text(`Discount narration and value: ${discount_percentage}% (${formatCurrency(totalDiscount)})`, 20, yPosition)
    yPosition += 6
  }
  
  // Separator line
  doc.line(20, yPosition, 190, yPosition)
  yPosition += 6
  
  // Totals
  doc.text(`TOTAL BEFORE DISCOUNT ${formatCurrency(totalBeforeDiscount)}`, 20, yPosition)
  yPosition += 5
  
  if (totalDiscount > 0) {
    doc.text(`TOTAL DISCOUNT AWARDED (${formatCurrency(totalDiscount)})`, 20, yPosition)
    yPosition += 5
  }
  
  doc.text(`SUB TOTAL ${formatCurrency(subtotal)}`, 20, yPosition)
  yPosition += 5
  doc.text(`VAT ${formatCurrency(tax_amount)}`, 20, yPosition)
  yPosition += 5
  doc.text(`TOTAL ${formatCurrency(total_amount)}`, 20, yPosition)
  yPosition += 6
  
  // Separator line
  doc.line(20, yPosition, 190, yPosition)
  yPosition += 6
  
  // Payment method
  doc.text(`${payment_method.toUpperCase()} ${formatCurrency(total_amount)}`, 20, yPosition)
  yPosition += 5
  doc.text(`ITEMS NUMBER ${items.length}`, 20, yPosition)
  yPosition += 6
  
  // Separator line
  doc.line(20, yPosition, 190, yPosition)
  yPosition += 6
  
  // Tax breakdown table
  doc.setFontSize(9)
  doc.text('Rate Taxable Amount VAT', 20, yPosition)
  yPosition += 4
  doc.text(`EX ${formatCurrency(taxBreakdown.exempt.amount)} ${formatCurrency(taxBreakdown.exempt.tax)}`, 20, yPosition)
  yPosition += 4
  doc.text(`16% ${formatCurrency(taxBreakdown.vat16.amount)} ${formatCurrency(taxBreakdown.vat16.tax)}`, 20, yPosition)
  yPosition += 4
  doc.text(`0% ${formatCurrency(taxBreakdown.zeroRated.amount)} ${formatCurrency(taxBreakdown.zeroRated.tax)}`, 20, yPosition)
  yPosition += 4
  doc.text(`Non-VAT ${formatCurrency(taxBreakdown.nonVatable.amount)} ${formatCurrency(taxBreakdown.nonVatable.tax)}`, 20, yPosition)
  yPosition += 4
  doc.text(`8% ${formatCurrency(taxBreakdown.vat8.amount)} ${formatCurrency(taxBreakdown.vat8.tax)}`, 20, yPosition)
  yPosition += 6
  
  // Separator line
  doc.line(20, yPosition, 190, yPosition)
  yPosition += 6
  
  // SCU Information
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('SCU INFORMATION', 20, yPosition)
  yPosition += 5
  
  doc.setFont('helvetica', 'normal')
  doc.text(`Date: ${date} Time: ${time}`, 20, yPosition)
  yPosition += 4
  doc.text(`SCU ID: ${kraData.curRcptNo}`, 20, yPosition)
  yPosition += 4
  doc.text(`CU INVOICE NO.: ${kraData.curRcptNo}/${kraData.invcNo}`, 20, yPosition)
  yPosition += 4
  doc.text('Internal Data:', 20, yPosition)
  yPosition += 4
  doc.text(kraData.intrlData, 20, yPosition)
  yPosition += 4
  doc.text('Receipt Signature:', 20, yPosition)
  yPosition += 4
  doc.text(kraData.rcptSign, 20, yPosition)
  yPosition += 6
  
  // Separator line
  doc.line(20, yPosition, 190, yPosition)
  yPosition += 6
  
  // TIS Information
  doc.setFont('helvetica', 'bold')
  doc.text('TIS INFORMATION', 20, yPosition)
  yPosition += 5
  
  doc.setFont('helvetica', 'normal')
  doc.text(`RECEIPT NUMBER: ${kraData.totRcptNo}`, 20, yPosition)
  yPosition += 4
  doc.text(`DATE: ${date} TIME: ${time}`, 20, yPosition)
  yPosition += 6
  
  // Separator line
  doc.line(20, yPosition, 190, yPosition)
  yPosition += 6
  
  // Thank you message
  doc.setFontSize(10)
  doc.text(BUSINESS_CONFIG.thankYouMessage, 105, yPosition, { align: 'center' })
  yPosition += 10
  
  // QR Code (if space allows)
  if (qrCodeDataUrl && yPosition < 250) {
    try {
      doc.addImage(qrCodeDataUrl, 'PNG', 150, yPosition, 30, 30)
      doc.setFontSize(8)
      doc.text('Scan to verify', 165, yPosition + 35, { align: 'center' })
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