import { Button } from "@/components/ui/button"
import { Mic, MicOff } from 'lucide-react'

interface VoiceInputProps {
  onStartRecording: () => void
  onStopRecording: () => void
  isProcessing: boolean
}

export default function VoiceInput({ onStartRecording, onStopRecording, isProcessing }: VoiceInputProps) {
  return (
    <div className="mt-4">
      {isProcessing ? (
        <Button onClick={onStopRecording} variant="destructive">
          <MicOff className="mr-2 h-4 w-4" /> Stop Recording
        </Button>
      ) : (
        <Button onClick={onStartRecording}>
          <Mic className="mr-2 h-4 w-4" /> Start Recording
        </Button>
      )}
    </div>
  )
}

