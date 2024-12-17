import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface PeerConnectionProps {
  peerId: string
  onStartCall: (remotePeerId: string) => void
  isCallActive: boolean
  onSharePeerId: () => void
}

export default function PeerConnection({ peerId, onStartCall, isCallActive, onSharePeerId }: PeerConnectionProps) {
  const [remotePeerId, setRemotePeerId] = useState('')

  const handleStartCall = () => {
    if (remotePeerId) {
      onStartCall(remotePeerId)
    }
  }

  return (
    <div className="mb-4 p-4 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-2">Your Peer ID: {peerId}</h2>
      <div className="flex items-center space-x-2 mb-2">
        <Button onClick={onSharePeerId} variant="outline">
          Share Peer ID
        </Button>
      </div>
      <div className="flex items-center space-x-2">
        <Input
          type="text"
          placeholder="Enter remote Peer ID"
          value={remotePeerId}
          onChange={(e) => setRemotePeerId(e.target.value)}
          disabled={isCallActive}
        />
        <Button onClick={handleStartCall} disabled={isCallActive || !remotePeerId}>
          Start Call
        </Button>
      </div>
    </div>
  )
}

