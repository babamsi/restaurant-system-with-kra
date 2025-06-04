import { motion } from 'framer-motion'
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Quote } from 'lucide-react'

interface TestimonialProps {
  content: string
  author: string
  company: string
  avatarUrl: string
}

export function Testimonial({ content, author, company, avatarUrl }: TestimonialProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="h-full border-none bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20 hover:bg-primary/20 dark:hover:bg-primary/30 transition-colors duration-300 overflow-hidden">
        <CardContent className="p-6 flex flex-col justify-between h-full space-y-4">
          <motion.div 
            className="relative"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Quote className="absolute top-0 left-0 text-primary/20 w-8 h-8 -translate-x-2 -translate-y-2" />
            <blockquote className="text-lg text-foreground/90 leading-relaxed pl-6 pt-2 italic">
              "{content}"
            </blockquote>
          </motion.div>
          <motion.div 
            className="flex items-center space-x-4 mt-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Avatar className="h-12 w-12 border-2 border-primary/20">
              <AvatarImage src={avatarUrl} alt={author} />
              <AvatarFallback className="bg-primary/5">{author[0]}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-semibold text-foreground">{author}</div>
              <div className="text-sm text-muted-foreground">{company}</div>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
