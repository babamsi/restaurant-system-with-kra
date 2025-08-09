'use client'

import { useState } from 'react'
import { useKRANotices } from '@/hooks/use-kra-notices'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'
import { Bell, Search, ExternalLink, Calendar, User, RefreshCw, XCircle } from 'lucide-react'

export default function KRANoticesPage() {
  const { notices, loading, error, fetchNotices, formatDate, truncateContent } = useKRANotices()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedNotice, setSelectedNotice] = useState<any>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchNotices()
    setIsRefreshing(false)
    toast({
      title: "Notices Refreshed",
      description: "KRA notices have been refreshed successfully",
    })
  }

  const handleViewNotice = (notice: any) => {
    setSelectedNotice(notice)
  }

  const filteredNotices = notices.filter(notice => 
    notice.title.toLowerCase().includes((searchTerm || '').toLowerCase()) ||
    notice.cont.toLowerCase().includes((searchTerm || '').toLowerCase()) ||
    notice.regrNm.toLowerCase().includes((searchTerm || '').toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-lg">Loading KRA notices...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <XCircle className="h-32 w-32 text-red-500 mx-auto" />
          <h2 className="text-2xl font-bold mt-4">Error Loading Notices</h2>
          <p className="text-gray-600 mt-2">{error}</p>
          <Button onClick={fetchNotices} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <Bell className="mr-3" />
            KRA Notices
          </h1>
          <p className="text-gray-600 mt-2">
            View official notices and announcements from KRA
          </p>
        </div>
        
        <Button 
          onClick={handleRefresh} 
          disabled={isRefreshing}
          variant="outline"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Notices ({notices.length})</CardTitle>
              <CardDescription>
                Official notices and announcements from Kenya Revenue Authority
              </CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search notices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {notices.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notices found</h3>
              <p className="text-gray-500">There are currently no notices from KRA.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Notice #</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead>Registered By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNotices.map((notice) => (
                  <TableRow key={notice.noticeNo}>
                    <TableCell className="font-medium">
                      <Badge variant="outline">
                        #{notice.noticeNo}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium max-w-xs">
                      <div className="truncate" title={notice.title}>
                        {notice.title}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={notice.cont}>
                        {truncateContent(notice.cont, 100)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-2 text-gray-500" />
                        {notice.regrNm}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                        {formatDate(notice.regDt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewNotice(notice)}
                            >
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Notice #{notice.noticeNo}</DialogTitle>
                              <DialogDescription>
                                {notice.title}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="font-medium">Notice Number:</span> {notice.noticeNo}
                                </div>
                                <div>
                                  <span className="font-medium">Registered By:</span> {notice.regrNm}
                                </div>
                                <div>
                                  <span className="font-medium">Registration Date:</span> {formatDate(notice.regDt)}
                                </div>
                                <div>
                                  <span className="font-medium">Title:</span> {notice.title}
                                </div>
                              </div>
                              <div>
                                <span className="font-medium">Content:</span>
                                <div className="mt-2 p-4 bg-gray-50 rounded-md whitespace-pre-wrap">
                                  {notice.cont}
                                </div>
                              </div>
                              {notice.dtlUrl && (
                                <div>
                                  <span className="font-medium">Detail URL:</span>
                                  <div className="mt-2">
                                    <a 
                                      href={notice.dtlUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800 underline flex items-center"
                                    >
                                      <ExternalLink className="w-4 h-4 mr-2" />
                                      View on KRA Website
                                    </a>
                                  </div>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                        {notice.dtlUrl && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(notice.dtlUrl, '_blank')}
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            KRA Link
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 