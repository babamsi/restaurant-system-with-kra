'use client'

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { 
  Download, 
  RefreshCw, 
  Calendar, 
  Building2, 
  FileText, 
  Package,
  Loader2,
  CheckCircle,
  AlertCircle,
  Info,
  Copy,
  Check,
  X
} from "lucide-react"
import ProtectedRoute from '@/components/ui/ProtectedRoute'

interface CodeClass {
  cdCls: string
  cdClsNm: string
  cdClsDesc: string | null
  useYn: string
  userDfnNm1: string | null
  userDfnNm2: string | null
  userDfnNm3: string | null
  dtlList: CodeDetail[]
}

interface CodeDetail {
  cd: string
  cdNm: string
  cdDesc: string
  useYn: string
  srtOrd: number
  userDfnCd1: string | null
  userDfnCd2: string | null
  userDfnCd3: string | null
}

interface ItemClassification {
  itemClsCd: string
  itemClsNm: string
  itemClsLvl: number
  taxTyCd: string | null
  mjrTgYn: string | null
  useYn: string
}

interface Branch {
  tin: string
  bhfId: string
  bhfNm: string
  bhfSttsCd: string
  prvncNm: string
  dstrtNm: string
  sctrNm: string
  locDesc: string
  mgrNm: string
  mgrTelNo: string
  mgrEmail: string
  hqYn: string
}

export default function KRADataPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("code-list")
  const [lastReqDt, setLastReqDt] = useState("20170101010101")
  const [loading, setLoading] = useState(false)
  
  // Code List State
  const [codeList, setCodeList] = useState<CodeClass[]>([])
  const [codeListLoading, setCodeListLoading] = useState(false)
  const [selectedCodeClasses, setSelectedCodeClasses] = useState<Set<string>>(new Set())
  const [selectedCodeDetails, setSelectedCodeDetails] = useState<Set<string>>(new Set())
  
  // Item Classification State
  const [itemClsList, setItemClsList] = useState<ItemClassification[]>([])
  const [itemClsLoading, setItemClsLoading] = useState(false)
  const [selectedItemClassifications, setSelectedItemClassifications] = useState<Set<string>>(new Set())
  
  // Branch List State
  const [branchList, setBranchList] = useState<Branch[]>([])
  const [branchListLoading, setBranchListLoading] = useState(false)
  const [selectedBranches, setSelectedBranches] = useState<Set<string>>(new Set())

  // Copy to clipboard function
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copied to Clipboard",
        description: `${label} copied successfully`,
      })
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      })
    }
  }

  // Handle code class selection
  const handleCodeClassSelection = (cdCls: string, checked: boolean) => {
    const newSelected = new Set(selectedCodeClasses)
    if (checked) {
      newSelected.add(cdCls)
    } else {
      newSelected.delete(cdCls)
    }
    setSelectedCodeClasses(newSelected)
  }

  // Handle code detail selection
  const handleCodeDetailSelection = (cd: string, checked: boolean) => {
    const newSelected = new Set(selectedCodeDetails)
    if (checked) {
      newSelected.add(cd)
    } else {
      newSelected.delete(cd)
    }
    setSelectedCodeDetails(newSelected)
  }

  // Handle item classification selection
  const handleItemClassificationSelection = (itemClsCd: string, checked: boolean) => {
    const newSelected = new Set(selectedItemClassifications)
    if (checked) {
      newSelected.add(itemClsCd)
    } else {
      newSelected.delete(itemClsCd)
    }
    setSelectedItemClassifications(newSelected)
  }

  // Handle branch selection
  const handleBranchSelection = (bhfId: string, checked: boolean) => {
    const newSelected = new Set(selectedBranches)
    if (checked) {
      newSelected.add(bhfId)
    } else {
      newSelected.delete(bhfId)
    }
    setSelectedBranches(newSelected)
  }

  // Select all code classes
  const selectAllCodeClasses = () => {
    const allCodes = codeList.map(cls => cls.cdCls)
    setSelectedCodeClasses(new Set(allCodes))
  }

  // Deselect all code classes
  const deselectAllCodeClasses = () => {
    setSelectedCodeClasses(new Set())
  }

  // Select all item classifications
  const selectAllItemClassifications = () => {
    const allCodes = itemClsList.map(item => item.itemClsCd)
    setSelectedItemClassifications(new Set(allCodes))
  }

  // Deselect all item classifications
  const deselectAllItemClassifications = () => {
    setSelectedItemClassifications(new Set())
  }

  // Select all branches
  const selectAllBranches = () => {
    const allCodes = branchList.map(branch => branch.bhfId)
    setSelectedBranches(new Set(allCodes))
  }

  // Deselect all branches
  const deselectAllBranches = () => {
    setSelectedBranches(new Set())
  }

  // Fetch Code List
  const fetchCodeList = async () => {
    setCodeListLoading(true)
    try {
      const res = await fetch('/api/kra/code-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lastReqDt })
      })
      
      const data = await res.json()
      
      if (data.resultCd === "000" && data.data?.clsList) {
        setCodeList(data.data.clsList)
        setSelectedCodeClasses(new Set()) // Reset selections
        setSelectedCodeDetails(new Set())
        toast({
          title: "Code List Fetched",
          description: `Successfully fetched ${data.data.clsList.length} code classes from KRA.`,
        })
      } else {
        toast({
          title: "Code List Error",
          description: data.resultMsg || data.error || "Failed to fetch code list from KRA",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Code List Error",
        description: error.message || "Failed to fetch code list",
        variant: "destructive",
      })
    } finally {
      setCodeListLoading(false)
    }
  }

  // Fetch Item Classification List
  const fetchItemClassificationList = async () => {
    setItemClsLoading(true)
    try {
      const res = await fetch('/api/kra/item-classification-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lastReqDt })
      })
      
      const data = await res.json()
      
      if (data.resultCd === "000" && data.data?.itemClsList) {
        setItemClsList(data.data.itemClsList)
        setSelectedItemClassifications(new Set()) // Reset selections
        toast({
          title: "Item Classification List Fetched",
          description: `Successfully fetched ${data.data.itemClsList.length} item classifications from KRA.`,
        })
      } else {
        toast({
          title: "Item Classification Error",
          description: data.resultMsg || data.error || "Failed to fetch item classification list from KRA",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Item Classification Error",
        description: error.message || "Failed to fetch item classification list",
        variant: "destructive",
      })
    } finally {
      setItemClsLoading(false)
    }
  }

  // Fetch Branch List
  const fetchBranchList = async () => {
    setBranchListLoading(true)
    try {
      const res = await fetch('/api/kra/branch-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lastReqDt })
      })
      
      const data = await res.json()
      
      if (data.resultCd === "000" && data.data?.bhfList) {
        setBranchList(data.data.bhfList)
        setSelectedBranches(new Set()) // Reset selections
        toast({
          title: "Branch List Fetched",
          description: `Successfully fetched ${data.data.bhfList.length} branches from KRA.`,
        })
      } else {
        toast({
          title: "Branch List Error",
          description: data.resultMsg || data.error || "Failed to fetch branch list from KRA",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Branch List Error",
        description: error.message || "Failed to fetch branch list",
        variant: "destructive",
      })
    } finally {
      setBranchListLoading(false)
    }
  }

  // Fetch All Data
  const fetchAllData = async () => {
    setLoading(true)
    await Promise.all([
      fetchCodeList(),
      fetchItemClassificationList(),
      fetchBranchList()
    ])
    setLoading(false)
  }

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">KRA Data Management</h1>
            <p className="text-muted-foreground mt-2">
              Fetch and view KRA code lists, item classifications, and branch information
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={fetchAllData}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Fetching All...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Fetch All Data
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Date Input */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Request Date Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="lastReqDt">Last Request Date (YYYYMMDDHHMMSS)</Label>
                <Input
                  id="lastReqDt"
                  value={lastReqDt}
                  onChange={(e) => setLastReqDt(e.target.value)}
                  placeholder="20170101010101"
                />
              </div>
              <div className="text-sm text-muted-foreground">
                <p>Format: YYYYMMDDHHMMSS</p>
                <p>Example: 20170101010101</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="code-list" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Code List
            </TabsTrigger>
            <TabsTrigger value="item-classification" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Item Classification
            </TabsTrigger>
            <TabsTrigger value="branch-list" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Branch List
            </TabsTrigger>
          </TabsList>

          {/* Code List Tab */}
          <TabsContent value="code-list" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    KRA Code List
                  </CardTitle>
                  <div className="flex gap-2">
                    <Badge variant="outline">
                      {codeList.length} Classes
                    </Badge>
                    <Badge variant="secondary">
                      {selectedCodeClasses.size} Selected
                    </Badge>
                    <Button 
                      size="sm" 
                      onClick={fetchCodeList}
                      disabled={codeListLoading}
                    >
                      {codeListLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Fetching...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Fetch Code List
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                {codeList.length > 0 && (
                  <div className="flex gap-2 mt-4">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={selectAllCodeClasses}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Select All
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={deselectAllCodeClasses}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Deselect All
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {codeList.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No code list data available</p>
                    <p className="text-sm">Click "Fetch Code List" to load data from KRA</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[600px]">
                    <div className="space-y-6">
                      {codeList.map((codeClass, index) => (
                        <Card key={index} className={selectedCodeClasses.has(codeClass.cdCls) ? "ring-2 ring-primary" : ""}>
                          <CardHeader>
                            <div className="flex items-center gap-3">
                              <Checkbox
                                checked={selectedCodeClasses.has(codeClass.cdCls)}
                                onCheckedChange={(checked) => handleCodeClassSelection(codeClass.cdCls, checked as boolean)}
                              />
                              <CardTitle className="text-lg flex-1">
                                {codeClass.cdClsNm} ({codeClass.cdCls})
                              </CardTitle>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(codeClass.cdCls, `Code Class ${codeClass.cdCls}`)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="flex gap-2">
                              <Badge variant={codeClass.useYn === 'Y' ? 'default' : 'secondary'}>
                                {codeClass.useYn === 'Y' ? 'Active' : 'Inactive'}
                              </Badge>
                              {codeClass.cdClsDesc && (
                                <Badge variant="outline">{codeClass.cdClsDesc}</Badge>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-12">Select</TableHead>
                                  <TableHead>Code</TableHead>
                                  <TableHead>Name</TableHead>
                                  <TableHead>Description</TableHead>
                                  <TableHead>Sort Order</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead className="w-12">Copy</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {codeClass.dtlList.map((detail, detailIndex) => (
                                  <TableRow key={detailIndex} className={selectedCodeDetails.has(detail.cd) ? "bg-primary/5" : ""}>
                                    <TableCell>
                                      <Checkbox
                                        checked={selectedCodeDetails.has(detail.cd)}
                                        onCheckedChange={(checked) => handleCodeDetailSelection(detail.cd, checked as boolean)}
                                      />
                                    </TableCell>
                                    <TableCell className="font-mono">{detail.cd}</TableCell>
                                    <TableCell>{detail.cdNm}</TableCell>
                                    <TableCell>{detail.cdDesc}</TableCell>
                                    <TableCell>{detail.srtOrd}</TableCell>
                                    <TableCell>
                                      <Badge variant={detail.useYn === 'Y' ? 'default' : 'secondary'}>
                                        {detail.useYn === 'Y' ? 'Active' : 'Inactive'}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => copyToClipboard(detail.cd, `Code ${detail.cd}`)}
                                      >
                                        <Copy className="h-4 w-4" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Item Classification Tab */}
          <TabsContent value="item-classification" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    KRA Item Classification List
                  </CardTitle>
                  <div className="flex gap-2">
                    <Badge variant="outline">
                      {itemClsList.length} Classifications
                    </Badge>
                    <Badge variant="secondary">
                      {selectedItemClassifications.size} Selected
                    </Badge>
                    <Button 
                      size="sm" 
                      onClick={fetchItemClassificationList}
                      disabled={itemClsLoading}
                    >
                      {itemClsLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Fetching...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Fetch Classifications
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                {itemClsList.length > 0 && (
                  <div className="flex gap-2 mt-4">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={selectAllItemClassifications}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Select All
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={deselectAllItemClassifications}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Deselect All
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {itemClsList.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No item classification data available</p>
                    <p className="text-sm">Click "Fetch Classifications" to load data from KRA</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[600px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">Select</TableHead>
                          <TableHead>Classification Code</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Level</TableHead>
                          <TableHead>Tax Type</TableHead>
                          <TableHead>Major Target</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="w-12">Copy</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {itemClsList.map((item, index) => (
                          <TableRow key={index} className={selectedItemClassifications.has(item.itemClsCd) ? "bg-primary/5" : ""}>
                            <TableCell>
                              <Checkbox
                                checked={selectedItemClassifications.has(item.itemClsCd)}
                                onCheckedChange={(checked) => handleItemClassificationSelection(item.itemClsCd, checked as boolean)}
                              />
                            </TableCell>
                            <TableCell className="font-mono">{item.itemClsCd}</TableCell>
                            <TableCell>{item.itemClsNm}</TableCell>
                            <TableCell>{item.itemClsLvl}</TableCell>
                            <TableCell>
                              {item.taxTyCd ? (
                                <Badge variant="outline">{item.taxTyCd}</Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {item.mjrTgYn ? (
                                <Badge variant={item.mjrTgYn === 'Y' ? 'default' : 'secondary'}>
                                  {item.mjrTgYn === 'Y' ? 'Yes' : 'No'}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant={item.useYn === 'Y' ? 'default' : 'secondary'}>
                                {item.useYn === 'Y' ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(item.itemClsCd, `Classification ${item.itemClsCd}`)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Branch List Tab */}
          <TabsContent value="branch-list" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    KRA Branch List
                  </CardTitle>
                  <div className="flex gap-2">
                    <Badge variant="outline">
                      {branchList.length} Branches
                    </Badge>
                    <Badge variant="secondary">
                      {selectedBranches.size} Selected
                    </Badge>
                    <Button 
                      size="sm" 
                      onClick={fetchBranchList}
                      disabled={branchListLoading}
                    >
                      {branchListLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Fetching...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Fetch Branches
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                {branchList.length > 0 && (
                  <div className="flex gap-2 mt-4">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={selectAllBranches}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Select All
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={deselectAllBranches}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Deselect All
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {branchList.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No branch data available</p>
                    <p className="text-sm">Click "Fetch Branches" to load data from KRA</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[600px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">Select</TableHead>
                          <TableHead>TIN</TableHead>
                          <TableHead>Branch ID</TableHead>
                          <TableHead>Branch Name</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Province</TableHead>
                          <TableHead>District</TableHead>
                          <TableHead>Sector</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Manager</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>HQ</TableHead>
                          <TableHead className="w-12">Copy</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {branchList.map((branch, index) => (
                          <TableRow key={index} className={selectedBranches.has(branch.bhfId) ? "bg-primary/5" : ""}>
                            <TableCell>
                              <Checkbox
                                checked={selectedBranches.has(branch.bhfId)}
                                onCheckedChange={(checked) => handleBranchSelection(branch.bhfId, checked as boolean)}
                              />
                            </TableCell>
                            <TableCell className="font-mono text-xs">{branch.tin}</TableCell>
                            <TableCell className="font-mono">{branch.bhfId}</TableCell>
                            <TableCell className="font-medium">{branch.bhfNm}</TableCell>
                            <TableCell>
                              <Badge variant={branch.bhfSttsCd === '01' ? 'default' : 'secondary'}>
                                {branch.bhfSttsCd === '01' ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                            <TableCell>{branch.prvncNm}</TableCell>
                            <TableCell>{branch.dstrtNm}</TableCell>
                            <TableCell>{branch.sctrNm}</TableCell>
                            <TableCell className="max-w-[200px] truncate" title={branch.locDesc}>
                              {branch.locDesc}
                            </TableCell>
                            <TableCell className="max-w-[150px] truncate" title={branch.mgrNm}>
                              {branch.mgrNm}
                            </TableCell>
                            <TableCell>
                              <div className="text-xs">
                                <div>{branch.mgrTelNo}</div>
                                <div className="text-muted-foreground truncate max-w-[150px]" title={branch.mgrEmail}>
                                  {branch.mgrEmail}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={branch.hqYn === 'Y' ? 'default' : 'outline'}>
                                {branch.hqYn === 'Y' ? 'HQ' : 'Branch'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(branch.bhfId, `Branch ${branch.bhfId}`)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  )
} 