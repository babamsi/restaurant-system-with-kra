import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="h-[calc(100vh-4rem)] bg-gradient-to-br from-indigo-500 to-purple-600 p-6">
      <div className="bg-white rounded-3xl shadow-xl h-full p-6 overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-8 w-32" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-10 w-36" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
          {Array(3)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-6 w-8 rounded-full" />
                </div>
                <div className="bg-muted/20 rounded-lg p-3 flex-1">
                  {Array(3)
                    .fill(0)
                    .map((_, j) => (
                      <Skeleton key={j} className="h-32 w-full mb-3 rounded-lg" />
                    ))}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
