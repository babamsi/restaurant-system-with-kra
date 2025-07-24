export interface KRAConfig {
  // API Endpoints
  baseUrl: string
  endpoints: {
    initialization: string
    codeList: string
    itemClassification: string
    branchList: string
    notices: string
    customerInfo: string
    userAccount: string
    insurance: string
    importItems: string
    items: string
    itemComposition: string
    purchases: string
    sales: string
    stockIO: string
    stockMaster: string
    stockMoves: string
  }
  
  // Authentication
  tin: string
  bhfId: string
  cmcKey: string
  
  // Business Info
  businessName: string
  address: string
  phone: string
  email: string
  
  // Default Values
  defaultTaxRate: number
  defaultCurrency: string
  defaultCountry: string
}

export const kraConfig: KRAConfig = {
  baseUrl: 'https://etims-api-test.kra.go.ke/etims-api',
  endpoints: {
    initialization: '/selectInitOsdcInfo',
    codeList: '/selectCodeList',
    itemClassification: '/selectItemClsList',
    branchList: '/selectBhfList',
    notices: '/selectNotices',
    customerInfo: '/saveBhfCustomer',
    userAccount: '/saveBhfUser',
    insurance: '/saveBhfInsurance',
    importItems: '/selectImportItemList',
    items: '/saveItem',
    itemComposition: '/saveItemComposition',
    purchases: '/insertTrnsPurchase',
    sales: '/saveTrnsSalesOsdc',
    stockIO: '/insertStockIO',
    stockMaster: '/saveStockMaster',
    stockMoves: '/selectStockMoveList'
  },
  
  // Replace with your actual KRA credentials
  tin: process.env.KRA_TIN || 'P051402944X',
  bhfId: process.env.KRA_BHF_ID || '00',
  cmcKey: process.env.KRA_CMC_KEY || 'B7294E9830B24224936A6CF86D469773CA858A464C7A4431AEB3',
  
  // Your business information
  businessName: process.env.BUSINESS_NAME || 'Your Restaurant Name',
  address: process.env.BUSINESS_ADDRESS || 'Your Business Address',
  phone: process.env.BUSINESS_PHONE || 'Your Phone Number',
  email: process.env.BUSINESS_EMAIL || 'your@email.com',
  
  // Default values
  defaultTaxRate: 16,
  defaultCurrency: 'KES',
  defaultCountry: 'KE'
}

export function getKRAHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'tin': kraConfig.tin,
    'bhfId': kraConfig.bhfId,
    'cmcKey': kraConfig.cmcKey
  }
}

export function getKRAUrl(endpoint: keyof KRAConfig['endpoints']): string {
  return `${kraConfig.baseUrl}${kraConfig.endpoints[endpoint]}`
} 