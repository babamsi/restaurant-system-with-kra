import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

interface JobDescriptionModalProps {
  isOpen: boolean
  onClose: () => void
  job: {
    id: string
    title: string
    department: string
    location: string
    type: string
    description: string
    requirements: string[]
    responsibilities: string[]
  }
}

export function JobDescriptionModal({ isOpen, onClose, job }: JobDescriptionModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{job.title}</DialogTitle>
          <DialogDescription>
            {job.department} • {job.location} • {job.type}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="mt-4 max-h-[calc(80vh-120px)] overflow-auto pr-4">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Job Description</h3>
              <p className="text-muted-foreground">{job.description}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Requirements</h3>
              <ul className="list-disc list-inside text-muted-foreground">
                {job.requirements.map((req, index) => (
                  <li key={index}>{req}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Responsibilities</h3>
              <ul className="list-disc list-inside text-muted-foreground">
                {job.responsibilities.map((resp, index) => (
                  <li key={index}>{resp}</li>
                ))}
              </ul>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
