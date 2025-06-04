import { motion } from "framer-motion"
import { CheckCircle, PlayCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Logo } from "@/components/logo"

interface UseCaseSectionProps {
  id: string
  title: string
  description: string
  features: string[]
  videoUrl: string
  index: number
  onWatchVideo: () => void
}

export function UseCaseSection({
  id,
  title,
  description,
  features,
  videoUrl,
  index,
  onWatchVideo,
}: UseCaseSectionProps) {
  const isEven = index % 2 === 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="mb-16 lg:mb-24"
    >
      <Card className="overflow-hidden border-none shadow-lg">
        <CardContent className="p-0">
          <div className="flex flex-col lg:flex-row">
            <div className={`w-full lg:w-1/2 ${isEven ? "lg:order-first" : "lg:order-last"}`}>
              <div className="aspect-video bg-muted overflow-hidden flex items-center justify-center">
                <div className="text-center">
                  <Logo className="mx-auto mb-4" size={64} />
                  <p className="text-lg font-semibold text-primary">Coming Soon</p>
                  <p className="text-sm text-muted-foreground">Maamul {title} Demo</p>
                </div>
              </div>
            </div>
            <div className="w-full lg:w-1/2 p-6 lg:p-8 space-y-4">
              <motion.h2
                className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                {title}
              </motion.h2>
              <motion.p
                className="text-muted-foreground text-sm sm:text-base"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                {description}
              </motion.p>
              <ul className="space-y-3">
                {features.map((feature, featureIndex) => (
                  <motion.li
                    key={featureIndex}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 + featureIndex * 0.1 }}
                    className="flex items-start space-x-3"
                  >
                    <CheckCircle className="text-primary w-5 h-5 mt-1 flex-shrink-0" />
                    <span className="text-sm sm:text-base">{feature}</span>
                  </motion.li>
                ))}
              </ul>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <Button onClick={onWatchVideo} disabled={!videoUrl} className="mt-4 w-full sm:w-auto">
                  <PlayCircle className="mr-2 h-4 w-4" />
                  {videoUrl ? "Watch Demo" : "Demo Coming Soon"}
                </Button>
              </motion.div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
