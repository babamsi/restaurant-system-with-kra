import { kraApiClient, type KRAItem, type KRASalesTransaction, type KRAPurchaseTransaction, type KRAStockIO } from './kra-api-client'
import { kraConfig } from './kra-config'
import { supabase } from './supabase'
import { inventoryService } from './inventory-service'
import { tableOrdersService } from './database'

export class KRAService {
  // Generate unique KRA item codes
  private generateItemCode(): string {
    const timestamp = Date.now().toString()
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    return `KE${timestamp.slice(-6)}${random}`
  }
  
  // Map your units to KRA unit codes
  private mapToKRAUnit(unit: string): string {
    const unitMap: Record<string, string> = {
      'bag': 'BG', 'box': 'BOX', 'can': 'CA', 'dozen': 'DZ', 
      'gram': 'GRM', 'g': 'GRM', 'kg': 'KG', 'kilogram': 'KG', 
      'litre': 'L', 'liter': 'L', 'l': 'L', 'milligram': 'MGM', 
      'mg': 'MGM', 'packet': 'PA', 'set': 'SET', 'piece': 'U', 
      'pieces': 'U', 'item': 'U', 'number': 'U', 'pcs': 'U', 'u': 'U',
      'portion': 'U', 'serving': 'U', 'plate': 'U', 'bowl': 'U'
    }
    return unitMap[unit.toLowerCase()] || 'U'
  }
  
  // Register a new item with KRA
  async registerItemWithKRA(ingredient: any, newCost?: number): Promise<{ success: boolean; itemCd?: string; itemClsCd?: string; error?: string }> {
    try {
      const itemCd = this.generateItemCode()
      const itemClsCd = '5059690800' // Default classification for food items
      
      const kraItem: KRAItem = {
        itemCd,
        itemClsCd,
        itemTyCd: '1', // Standard item
        itemNm: ingredient.name,
        itemStdNm: ingredient.name,
        orgnNatCd: kraConfig.defaultCountry,
        pkgUnitCd: 'NT', // No package
        qtyUnitCd: this.mapToKRAUnit(ingredient.unit),
        taxTyCd: 'B', // VAT applicable
        btchNo: undefined,
        bcd: undefined,
        dftPrc: newCost !== undefined ? newCost : ingredient.cost_per_unit,
        grpPrcL1: newCost !== undefined ? newCost : ingredient.cost_per_unit,
        grpPrcL2: newCost !== undefined ? newCost : ingredient.cost_per_unit,
        grpPrcL3: newCost !== undefined ? newCost : ingredient.cost_per_unit,
        grpPrcL4: newCost !== undefined ? newCost : ingredient.cost_per_unit,
        grpPrcL5: undefined,
        addInfo: ingredient.description || undefined,
        sftyQty: undefined,
        isrcAplcbYn: 'N', // No insurance
        useYn: 'Y',
        regrNm: kraConfig.businessName,
        regrId: kraConfig.businessName,
        modrNm: kraConfig.businessName,
        modrId: kraConfig.businessName
      }
      
      const response = await kraApiClient.registerItem(kraItem)
      
      if (response.success) {
        // Update ingredient with KRA codes
        await inventoryService.updateIngredient(ingredient.id, {
          itemCd,
          itemClsCd,
          kra_status: 'ok'
        })
        
        return { success: true, itemCd, itemClsCd }
      } else {
        return { success: false, error: response.error || 'Failed to register item with KRA' }
      }
    } catch (error: any) {
      return { success: false, error: error.message || 'KRA registration failed' }
    }
  }
  
  // Send sales transaction to KRA
  async sendSalesToKRA(order: any, kraData?: any): Promise<{ success: boolean; error?: string; kraData?: any }> {
    try {
      const now = new Date()
      const salesDate = now.toISOString().slice(0, 10).replace(/-/g, '')
      const confirmDate = now.toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '')
      
      // Calculate totals
      const items = order.items || []
      const totItemCnt = items.length
      const totTaxblAmt = items.reduce((sum: number, item: any) => sum + (item.unit_price * item.quantity), 0)
      const totTaxAmt = totTaxblAmt * (kraConfig.defaultTaxRate / 100)
      const totAmt = totTaxblAmt + totTaxAmt
      
      // Build item list for KRA
      const itemList = items.map((item: any, index: number) => {
        const splyAmt = item.unit_price * item.quantity
        const taxAmt = splyAmt * (kraConfig.defaultTaxRate / 100)
        
        return {
          itemSeq: index + 1,
          itemCd: item.itemCd || 'UNKNOWN',
          itemClsCd: item.itemClsCd || '5059690800',
          itemNm: item.menu_item_name,
          bcd: undefined,
          pkgUnitCd: 'NT',
          pkg: 1,
          qtyUnitCd: this.mapToKRAUnit(item.unit || 'piece'),
          qty: item.quantity,
          prc: item.unit_price,
          splyAmt,
          dcRt: 0,
          dcAmt: 0,
          isrccCd: undefined,
          isrccNm: undefined,
          isrcRt: undefined,
          isrcAmt: undefined,
          taxTyCd: 'B',
          taxblAmt: splyAmt,
          taxAmt,
          totAmt: splyAmt
        }
      })
      
      const salesTransaction: KRASalesTransaction = {
        invcNo: kraData?.invcNo || parseInt(order.id.slice(-6)),
        orgInvcNo: 0,
        custTin: order.customer_name ? 'A123456789Z' : undefined, // Default customer TIN
        custNm: order.customer_name || 'Walk-in Customer',
        salesTyCd: 'N', // Normal sale
        rcptTyCd: 'S', // Sales receipt
        pmtTyCd: '01', // Cash payment
        salesSttsCd: '02', // Confirmed
        cfmDt: confirmDate,
        salesDt: salesDate,
        stockRlsDt: confirmDate,
        cnclReqDt: undefined,
        cnclDt: undefined,
        rfdDt: undefined,
        rfdRsnCd: undefined,
        totItemCnt,
        taxblAmtA: 0,
        taxblAmtB: totTaxblAmt,
        taxblAmtC: 0,
        taxblAmtD: 0,
        taxblAmtE: 0,
        taxRtA: 0,
        taxRtB: kraConfig.defaultTaxRate,
        taxRtC: 0,
        taxRtD: 0,
        taxRtE: 0,
        taxAmtA: 0,
        taxAmtB: totTaxAmt,
        taxAmtC: 0,
        taxAmtD: 0,
        taxAmtE: 0,
        totTaxblAmt,
        totTaxAmt,
        totAmt,
        prchrAcptcYn: 'N',
        remark: undefined,
        regrId: kraConfig.businessName,
        regrNm: kraConfig.businessName,
        modrId: kraConfig.businessName,
        modrNm: kraConfig.businessName,
        receipt: {
          custTin: order.customer_name ? 'A123456789Z' : undefined,
          custMblNo: undefined,
          rptNo: 1,
          rcptPbctDt: confirmDate,
          trdeNm: kraConfig.businessName,
          adrs: kraConfig.address,
          topMsg: 'Thank you for dining with us!',
          btmMsg: 'Please come again',
          prchrAcptcYn: 'N'
        },
        itemList
      }
      
      const response = await kraApiClient.sendSalesTransaction(salesTransaction)
      
      if (response.success) {
        return { success: true, kraData: response.kraData }
      } else {
        return { success: false, error: response.error || 'Failed to send sales to KRA' }
      }
    } catch (error: any) {
      return { success: false, error: error.message || 'Sales transmission failed' }
    }
  }
  
  // Send purchase transaction to KRA
  async sendPurchaseToKRA(supplierOrder: any): Promise<{ success: boolean; error?: string; kraData?: any }> {
    try {
      const now = new Date()
      const purchaseDate = now.toISOString().slice(0, 10).replace(/-/g, '')
      const confirmDate = now.toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '')
      
      const items = supplierOrder.items || []
      const totItemCnt = items.length
      const totTaxblAmt = items.reduce((sum: number, item: any) => sum + (item.cost_per_unit * item.quantity), 0)
      const totTaxAmt = supplierOrder.vat_amount || 0
      const totAmt = totTaxblAmt + totTaxAmt
      
      const itemList = items.map((item: any, index: number) => {
        const splyAmt = item.cost_per_unit * item.quantity
        const taxAmt = (totTaxAmt / totItemCnt) // Distribute VAT equally
        
        return {
          itemSeq: index + 1,
          itemCd: item.itemCd || 'UNKNOWN',
          itemClsCd: item.itemClsCd || '5059690800',
          itemNm: item.ingredient_name,
          bcd: undefined,
          spplrItemClsCd: undefined,
          spplrItemCd: undefined,
          spplrItemNm: undefined,
          pkgUnitCd: 'NT',
          pkg: 0,
          qtyUnitCd: this.mapToKRAUnit(item.unit || 'piece'),
          qty: item.quantity,
          prc: item.cost_per_unit,
          splyAmt,
          dcRt: 0,
          dcAmt: 0,
          taxblAmt: splyAmt,
          taxTyCd: 'B',
          taxAmt,
          totAmt: splyAmt,
          itemExprDt: undefined
        }
      })
      
      const purchaseTransaction: KRAPurchaseTransaction = {
        invcNo: parseInt(supplierOrder.invoice_number) || parseInt(supplierOrder.id.slice(-6)),
        orgInvcNo: 0,
        spplrTin: supplierOrder.supplier_tin || undefined,
        spplrBhfId: undefined,
        spplrNm: supplierOrder.supplier_name || 'Unknown Supplier',
        spplrInvcNo: supplierOrder.invoice_number,
        regTyCd: 'M', // Manual
        pchsTyCd: 'N', // Normal purchase
        rcptTyCd: 'P', // Purchase receipt
        pmtTyCd: '01', // Cash
        pchsSttsCd: '02', // Confirmed
        cfmDt: confirmDate,
        pchsDt: purchaseDate,
        wrhsDt: '',
        cnclReqDt: undefined,
        cnclDt: undefined,
        rfdDt: undefined,
        totItemCnt,
        taxblAmtA: 0,
        taxblAmtB: totTaxblAmt,
        taxblAmtC: 0,
        taxblAmtD: 0,
        taxblAmtE: 0,
        taxRtA: 0,
        taxRtB: kraConfig.defaultTaxRate,
        taxRtC: 0,
        taxRtD: 0,
        taxRtE: 0,
        taxAmtA: 0,
        taxAmtB: totTaxAmt,
        taxAmtC: 0,
        taxAmtD: 0,
        taxAmtE: 0,
        totTaxblAmt,
        totTaxAmt,
        totAmt,
        remark: undefined,
        regrNm: kraConfig.businessName,
        regrId: kraConfig.businessName,
        modrNm: kraConfig.businessName,
        modrId: kraConfig.businessName,
        itemList
      }
      
      const response = await kraApiClient.sendPurchaseTransaction(purchaseTransaction)
      
      if (response.success) {
        return { success: true, kraData: response.kraData }
      } else {
        return { success: false, error: response.error || 'Failed to send purchase to KRA' }
      }
    } catch (error: any) {
      return { success: false, error: error.message || 'Purchase transmission failed' }
    }
  }
  
  // Send stock movement to KRA
  async sendStockIOToKRA(items: any[], sarTyCd: string = '02'): Promise<{ success: boolean; error?: string; kraData?: any }> {
    try {
      const now = new Date()
      const ocrnDt = now.toISOString().slice(0, 10).replace(/-/g, '')
      const sarNo = parseInt(now.getTime().toString().slice(-6))
      
      const totItemCnt = items.length
      const totTaxblAmt = items.reduce((sum: number, item: any) => sum + (item.cost_per_unit * item.quantity), 0)
      const totTaxAmt = totTaxblAmt * (kraConfig.defaultTaxRate / 100)
      const totAmt = totTaxblAmt + totTaxAmt
      
      const itemList = items.map((item: any, index: number) => {
        const splyAmt = item.cost_per_unit * item.quantity
        const taxAmt = splyAmt * (kraConfig.defaultTaxRate / 100)
        
        return {
          itemSeq: index + 1,
          itemCd: item.itemCd || 'UNKNOWN',
          itemClsCd: item.itemClsCd || '5059690800',
          itemNm: item.name,
          bcd: undefined,
          pkgUnitCd: 'NT',
          pkg: 1,
          qtyUnitCd: this.mapToKRAUnit(item.unit || 'piece'),
          qty: item.quantity,
          itemExprDt: undefined,
          prc: item.cost_per_unit,
          splyAmt,
          totDcAmt: 0,
          taxblAmt: splyAmt,
          taxTyCd: 'B',
          taxAmt,
          totAmt: splyAmt
        }
      })
      
      const stockIO: KRAStockIO = {
        sarNo,
        orgSarNo: sarNo,
        regTyCd: 'M',
        custTin: undefined,
        custNm: undefined,
        custBhfId: undefined,
        sarTyCd,
        ocrnDt,
        totItemCnt,
        totTaxblAmt,
        totTaxAmt,
        totAmt,
        remark: undefined,
        regrId: kraConfig.businessName,
        regrNm: kraConfig.businessName,
        modrNm: kraConfig.businessName,
        modrId: kraConfig.businessName,
        itemList
      }
      
      const response = await kraApiClient.sendStockIO(stockIO)
      
      if (response.success) {
        return { success: true, kraData: response.kraData }
      } else {
        return { success: false, error: response.error || 'Failed to send stock movement to KRA' }
      }
    } catch (error: any) {
      return { success: false, error: error.message || 'Stock movement transmission failed' }
    }
  }
  
  // Sync all items with KRA
  async syncAllItemsWithKRA(): Promise<{ success: boolean; synced: number; errors: string[] }> {
    try {
      const { data: ingredients } = await supabase.from('ingredients').select('*')
      if (!ingredients) return { success: false, synced: 0, errors: ['No ingredients found'] }
      
      let synced = 0
      const errors: string[] = []
      
      for (const ingredient of ingredients) {
        if (!ingredient.itemCd || !ingredient.itemClsCd) {
          const result = await this.registerItemWithKRA(ingredient)
          if (result.success) {
            synced++
          } else {
            errors.push(`${ingredient.name}: ${result.error}`)
          }
        } else {
          synced++ // Already registered
        }
      }
      
      return { success: true, synced, errors }
    } catch (error: any) {
      return { success: false, synced: 0, errors: [error.message] }
    }
  }
  
  // Get KRA notices and updates
  async getKRANotices(): Promise<{ success: boolean; notices?: any[]; error?: string }> {
    try {
      const response = await kraApiClient.getNotices()
      if (response.success) {
        return { success: true, notices: response.data }
      } else {
        return { success: false, error: response.error }
      }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
}

export const kraService = new KRAService() 