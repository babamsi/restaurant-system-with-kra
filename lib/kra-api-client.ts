import { kraConfig, getKRAHeaders, getKRAUrl } from './kra-config'

export interface KRAResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  kraData?: any
  resultCode?: string
  resultMsg?: string
}

export interface KRAItem {
  itemCd: string
  itemClsCd: string
  itemTyCd: string
  itemNm: string
  itemStdNm?: string
  orgnNatCd: string
  pkgUnitCd: string
  qtyUnitCd: string
  taxTyCd: string
  btchNo?: string
  bcd?: string
  dftPrc: number
  grpPrcL1: number
  grpPrcL2: number
  grpPrcL3: number
  grpPrcL4: number
  grpPrcL5?: number
  addInfo?: string
  sftyQty?: number
  isrcAplcbYn: string
  useYn: string
  regrNm: string
  regrId: string
  modrNm: string
  modrId: string
}

export interface KRASalesTransaction {
  invcNo: number
  orgInvcNo: number
  custTin?: string
  custNm?: string
  salesTyCd: string
  rcptTyCd: string
  pmtTyCd: string
  salesSttsCd: string
  cfmDt: string
  salesDt: string
  stockRlsDt: string
  cnclReqDt?: string
  cnclDt?: string
  rfdDt?: string
  rfdRsnCd?: string
  totItemCnt: number
  taxblAmtA: number
  taxblAmtB: number
  taxblAmtC: number
  taxblAmtD: number
  taxblAmtE: number
  taxRtA: number
  taxRtB: number
  taxRtC: number
  taxRtD: number
  taxRtE: number
  taxAmtA: number
  taxAmtB: number
  taxAmtC: number
  taxAmtD: number
  taxAmtE: number
  totTaxblAmt: number
  totTaxAmt: number
  totAmt: number
  prchrAcptcYn: string
  remark?: string
  regrId: string
  regrNm: string
  modrId: string
  modrNm: string
  receipt?: any
  itemList: any[]
}

export interface KRAPurchaseTransaction {
  invcNo: number
  orgInvcNo: number
  spplrTin?: string
  spplrBhfId?: string
  spplrNm?: string
  spplrInvcNo?: string
  regTyCd: string
  pchsTyCd: string
  rcptTyCd: string
  pmtTyCd: string
  pchsSttsCd: string
  cfmDt: string
  pchsDt: string
  wrhsDt?: string
  cnclReqDt?: string
  cnclDt?: string
  rfdDt?: string
  totItemCnt: number
  taxblAmtA: number
  taxblAmtB: number
  taxblAmtC: number
  taxblAmtD: number
  taxblAmtE: number
  taxRtA: number
  taxRtB: number
  taxRtC: number
  taxRtD: number
  taxRtE: number
  taxAmtA: number
  taxAmtB: number
  taxAmtC: number
  taxAmtD: number
  taxAmtE: number
  totTaxblAmt: number
  totTaxAmt: number
  totAmt: number
  remark?: string
  regrNm: string
  regrId: string
  modrNm: string
  modrId: string
  itemList: any[]
}

export interface KRAStockIO {
  sarNo: number
  orgSarNo: number
  regTyCd: string
  custTin?: string
  custNm?: string
  custBhfId?: string
  sarTyCd: string
  ocrnDt: string
  totItemCnt: number
  totTaxblAmt: number
  totTaxAmt: number
  totAmt: number
  remark?: string
  regrId: string
  regrNm: string
  modrNm: string
  modrId: string
  itemList: any[]
}

class KRAApiClient {
  private async makeRequest<T>(
    endpoint: keyof typeof kraConfig.endpoints,
    payload: any,
    retries: number = 3
  ): Promise<KRAResponse<T>> {
    const url = getKRAUrl(endpoint)
    const headers = getKRAHeaders()
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`KRA API Request (attempt ${attempt}/${retries}):`, {
          endpoint,
          url,
          payload: JSON.stringify(payload, null, 2)
        })
        
        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        })
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const data = await response.json()
        console.log(`KRA API Response:`, data)
        
        // Check KRA-specific error codes
        if (data.resultCd && data.resultCd !== '000') {
          return {
            success: false,
            error: data.resultMsg || 'KRA API error',
            kraData: data,
            resultCode: data.resultCd,
            resultMsg: data.resultMsg
          }
        }
        
        return {
          success: true,
          data,
          kraData: data
        }
        
      } catch (error: any) {
        console.error(`KRA API Error (attempt ${attempt}/${retries}):`, error)
        
        if (attempt === retries) {
          return {
            success: false,
            error: error.message || 'Network error',
            resultCode: 'NETWORK_ERROR'
          }
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
      }
    }
    
    return {
      success: false,
      error: 'Max retries exceeded'
    }
  }
  
  // Item Management
  async registerItem(item: KRAItem): Promise<KRAResponse> {
    return this.makeRequest('items', item)
  }
  
  async getItemList(lastReqDt: string = '20160523000000'): Promise<KRAResponse> {
    return this.makeRequest('items', { lastReqDt })
  }
  
  async saveItemComposition(itemCd: string, cpstItemCd: string, cpstQty: number): Promise<KRAResponse> {
    return this.makeRequest('itemComposition', {
      itemCd,
      cpstItemCd,
      cpstQty,
      regrId: kraConfig.businessName,
      regrNm: kraConfig.businessName
    })
  }
  
  // Sales Management
  async sendSalesTransaction(salesData: KRASalesTransaction): Promise<KRAResponse> {
    return this.makeRequest('sales', salesData)
  }
  
  // Purchase Management
  async sendPurchaseTransaction(purchaseData: KRAPurchaseTransaction): Promise<KRAResponse> {
    return this.makeRequest('purchases', purchaseData)
  }
  
  // Stock Management
  async sendStockIO(stockData: KRAStockIO): Promise<KRAResponse> {
    return this.makeRequest('stockIO', stockData)
  }
  
  async saveStockMaster(itemCd: string, rsdQty: number): Promise<KRAResponse> {
    return this.makeRequest('stockMaster', {
      itemCd,
      rsdQty,
      regrId: kraConfig.businessName,
      regrNm: kraConfig.businessName,
      modrNm: kraConfig.businessName,
      modrId: kraConfig.businessName
    })
  }
  
  async getStockMoves(lastReqDt: string = '20180524000000'): Promise<KRAResponse> {
    return this.makeRequest('stockMoves', { lastReqDt })
  }
  
  // Customer Management
  async saveCustomer(customerData: any): Promise<KRAResponse> {
    return this.makeRequest('customerInfo', customerData)
  }
  
  // Code Lists and Classifications
  async getCodeList(lastReqDt: string = '20220101010101'): Promise<KRAResponse> {
    return this.makeRequest('codeList', {
      tin: kraConfig.tin,
      bhfId: kraConfig.bhfId,
      lastReqDt
    })
  }
  
  async getItemClassification(lastReqDt: string = '20180523000000'): Promise<KRAResponse> {
    return this.makeRequest('itemClassification', {
      tin: kraConfig.tin,
      bhfId: kraConfig.bhfId,
      lastReqDt
    })
  }
  
  async getBranchList(lastReqDt: string = '20180520000000'): Promise<KRAResponse> {
    return this.makeRequest('branchList', { lastReqDt })
  }
  
  async getNotices(): Promise<KRAResponse> {
    return this.makeRequest('notices', {})
  }
}

export const kraApiClient = new KRAApiClient() 