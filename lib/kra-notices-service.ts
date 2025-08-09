export interface NoticeItem {
  noticeNo: number
  title: string
  cont: string
  dtlUrl: string
  regrNm: string
  regDt: string
}

export interface NoticesResponse {
  success: boolean
  notices?: NoticeItem[]
  error?: string
  message?: string
}

class KRANoticesService {
  async getNotices(): Promise<NoticesResponse> {
    try {
      const response = await fetch('/api/kra/notices', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch KRA notices')
      }

      return { success: true, notices: data.notices || [] }
    } catch (error: any) {
      console.error('Error fetching KRA notices:', error)
      return { success: false, error: error.message }
    }
  }

  formatDate(dateString: string): string {
    // Convert "20200218191141" to readable format
    if (dateString.length === 14) {
      const year = dateString.substring(0, 4)
      const month = dateString.substring(4, 6)
      const day = dateString.substring(6, 8)
      const hour = dateString.substring(8, 10)
      const minute = dateString.substring(10, 12)
      const second = dateString.substring(12, 14)
      
      return `${year}-${month}-${day} ${hour}:${minute}:${second}`
    }
    return dateString
  }

  truncateContent(content: string, maxLength: number = 150): string {
    if (content.length <= maxLength) {
      return content
    }
    return content.substring(0, maxLength) + '...'
  }
}

export const kraNoticesService = new KRANoticesService() 