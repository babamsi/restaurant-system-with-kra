import { useState, useEffect } from 'react'
import { kraNoticesService, NoticeItem } from '@/lib/kra-notices-service'

export function useKRANotices() {
  const [notices, setNotices] = useState<NoticeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchNotices = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await kraNoticesService.getNotices()
      
      if (result.success) {
        setNotices(result.notices || [])
      } else {
        setError(result.error || 'Failed to fetch KRA notices')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch KRA notices')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string): string => {
    return kraNoticesService.formatDate(dateString)
  }

  const truncateContent = (content: string, maxLength: number = 150): string => {
    return kraNoticesService.truncateContent(content, maxLength)
  }

  useEffect(() => {
    fetchNotices()
  }, [])

  return {
    notices,
    loading,
    error,
    fetchNotices,
    formatDate,
    truncateContent
  }
} 