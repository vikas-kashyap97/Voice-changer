import { Button } from "@/components/ui/button"
import { PhoneOff } from 'lucide-react'

interface CallInterfaceProps {
  onEndCall: () => void
}

export default function CallInterface({ onEndCall }: CallInterfaceProps) {
  return (
    <div className="mt-4">
      <Button onClick={onEndCall} variant="destructive">
        <PhoneOff className="mr-2 h-4 w-4" /> End Call
      </Button>
    </div>
  )
}

