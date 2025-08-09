import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'

export interface KRAItemClassification {
  itemClsCd: string
  itemClsNm: string
  itemClsLvl: number
  taxTyCd: string | null
  mjrTgYn: string | null
  useYn: string
}

export function useKRAClassifications() {
  const { toast } = useToast()
  const [classifications, setClassifications] = useState<KRAItemClassification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadClassifications = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/kra/item-classification-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lastReqDt: "20180523000000"
        })
      })

      const result = await response.json()

      // Handle KRA API response format
      if (result.resultCd === "000" && result.data?.itemClsList) {
        setClassifications(result.data.itemClsList)
        toast({
          title: "Item Classifications Loaded",
          description: `Successfully loaded ${result.data.itemClsList.length} item classifications from KRA.`,
        })
      } else {
        const errorMessage = result.resultMsg || result.error || "Failed to load item classifications from KRA"
        setError(errorMessage)
        toast({
          title: "Error Loading Classifications",
          description: errorMessage,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error loading item classifications:', error)
      setError("Failed to load item classifications from KRA")
      toast({
        title: "Error Loading Classifications",
        description: "Failed to load item classifications from KRA",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadClassifications()
  }, [])

  return {
    classifications,
    loading,
    error,
    loadClassifications,
    setClassifications
  }
} 