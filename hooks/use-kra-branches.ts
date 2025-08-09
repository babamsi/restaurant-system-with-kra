import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'

export interface KRABranch {
  tin: string
  bhfId: string
  bhfNm: string
  bhfSttsCd: string
  prvncNm: string
  dstrtNm: string
  sctrNm: string
  locDesc: string | null
  mgrNm: string
  mgrTelNo: string
  mgrEmail: string
  hqYn: string
}

export function useKRABranches() {
  const { toast } = useToast()
  const [branches, setBranches] = useState<KRABranch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadBranches = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/kra/branch-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lastReqDt: "20180520000000"
        })
      })

      const result = await response.json()

      // Check if the API call was successful
      if (response.ok && result.resultCd === '000') {
        const branchesData = result.data?.bhfList || []
        setBranches(branchesData)
        toast({
          title: "Branches Loaded",
          description: `Successfully loaded ${branchesData.length} branches from KRA.`,
        })
      } else {
        const errorMessage = result.resultMsg || result.error || "Failed to load branches from KRA"
        setError(errorMessage)
        toast({
          title: "Error Loading Branches",
          description: errorMessage,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error loading branches:', error)
      setError("Failed to load branches from KRA")
      toast({
        title: "Error Loading Branches",
        description: "Failed to load branches from KRA",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBranches()
  }, [])

  return {
    branches,
    loading,
    error,
    loadBranches,
    setBranches
  }
} 