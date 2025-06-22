"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Activity, RefreshCw } from "lucide-react"
import { fetchSystemLogs } from "@/lib/kitchenSupabase"
import { format } from "date-fns"

interface SystemLog {
  id: string
  timestamp: string
  type: "storage" | "batch"
  action: string
  details: string
  status: "success" | "error" | "info"
}

function formatDateSafe(dateValue: string | number | Date | undefined): string {
  if (!dateValue) return "-"
  try {
    return format(new Date(dateValue), "MMM d, yyyy HH:mm:ss")
  } catch {
    return "-"
  }
}

export default function SystemLogsPage() {
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadLogs = async () => {
    setIsLoading(true)
    try {
      const logData = await fetchSystemLogs()
      setSystemLogs(logData || [])
    } catch (error) {
      console.error("Error loading system logs:", error)
      // Optionally, show a toast notification
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadLogs()
  }, [])

  const getStatusClass = (status: SystemLog["status"]) => {
    switch (status) {
      case "error":
        return "border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-500/20"
      case "success":
        return "border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-500/20"
      case "info":
        return "border-blue-200 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-500/20"
      default:
        return "border-gray-200 bg-gray-50 dark:bg-gray-800/10 dark:border-gray-500/20"
    }
  }

  const getTypeBadgeClass = (type: SystemLog["type"]) => {
    switch (type) {
      case "storage":
        return "text-blue-600 border-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-400/50"
      case "batch":
        return "text-purple-600 border-purple-600 bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-400/50"
      default:
        return "text-gray-600 border-gray-600"
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight">System Logs</CardTitle>
            <p className="text-muted-foreground">
              A real-time feed of all kitchen-related activities.
            </p>
          </div>
          <Button variant="outline" size="icon" onClick={loadLogs} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-220px)] pr-4">
            {isLoading && systemLogs.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  <span>Loading logs...</span>
                </div>
              </div>
            ) : systemLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <Activity className="h-12 w-12 mb-4" />
                <h3 className="text-lg font-semibold">No Logs Found</h3>
                <p className="text-sm">System activities will appear here as they happen.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {systemLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-4 rounded-lg border ${getStatusClass(log.status)}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                           <Badge
                              variant="outline"
                              className={getTypeBadgeClass(log.type)}
                            >
                              {log.type.charAt(0).toUpperCase() + log.type.slice(1)}
                            </Badge>
                          <span className="font-semibold text-foreground">{log.action}</span>
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap font-mono">
                          {log.details}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground pt-1">
                        {formatDateSafe(log.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
} 