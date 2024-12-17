'use client'

import { useState, useEffect, useRef } from 'react'
import { Mic, Phone, PhoneOff, Share2, User, Users, Baby, PersonStanding } from 'lucide-react'
import Peer from 'peerjs'
import * as Tone from 'tone'

export default function VoiceChangerCall() {
  const [peer, setPeer] = useState<Peer | null>(null)
  const [peerId, setPeerId] = useState<string>('')
  const [remotePeerId, setRemotePeerId] = useState('')
  const [call, setCall] = useState<Peer.MediaConnection | null>(null)
  const [selectedEffect, setSelectedEffect] = useState('normal')
  const [isCallActive, setIsCallActive] = useState(false)
  const [isAudioInitialized, setIsAudioInitialized] = useState(false)

  const microphoneRef = useRef<Tone.UserMedia | null>(null)
  const pitchShiftRef = useRef<Tone.PitchShift | null>(null)
  const tremoloRef = useRef<Tone.Tremolo | null>(null)
  const reverbRef = useRef<Tone.Reverb | null>(null)
  const gainRef = useRef<Tone.Gain | null>(null)

  useEffect(() => {
    const initializePeer = async () => {
      try {
        const newPeer = new Peer()
        await new Promise<void>((resolve, reject) => {
          newPeer.on('open', (id) => {
            setPeerId(id)
            resolve()
          })
          newPeer.on('error', reject)
        })
        newPeer.on('call', handleIncomingCall)
        setPeer(newPeer)
      } catch (error) {
        console.error('Failed to initialize PeerJS:', error)
      }
    }

    initializePeer()

    return () => {
      peer?.destroy()
    }
  }, [])

  useEffect(() => {
    if (isCallActive && !isAudioInitialized) {
      initializeAudio()
    } else if (!isCallActive && isAudioInitialized) {
      cleanupAudioEffects()
    }
  }, [isCallActive, isAudioInitialized])

  useEffect(() => {
    if (isAudioInitialized) {
      applyVoiceEffect()
    }
  }, [selectedEffect, isAudioInitialized])

  const initializeAudio = async () => {
    try {
      await Tone.start()
      await setupAudioEffects()
      setIsAudioInitialized(true)
    } catch (error) {
      console.error('Failed to initialize audio:', error)
    }
  }

  const setupAudioEffects = async () => {
    microphoneRef.current = new Tone.UserMedia()
    pitchShiftRef.current = new Tone.PitchShift()
    tremoloRef.current = new Tone.Tremolo().start()
    reverbRef.current = new Tone.Reverb()
    gainRef.current = new Tone.Gain()

    await microphoneRef.current.open()
    await reverbRef.current.generate()
    
    microphoneRef.current.chain(
      pitchShiftRef.current,
      tremoloRef.current,
      reverbRef.current,
      gainRef.current,
      Tone.getDestination()
    )
  }

  const cleanupAudioEffects = () => {
    microphoneRef.current?.close()
    microphoneRef.current?.dispose()
    pitchShiftRef.current?.dispose()
    tremoloRef.current?.dispose()
    reverbRef.current?.dispose()
    gainRef.current?.dispose()
    setIsAudioInitialized(false)
  }

  const applyVoiceEffect = () => {
    if (!pitchShiftRef.current || !tremoloRef.current || !reverbRef.current || !gainRef.current) return

    switch (selectedEffect) {
      case 'male':
        pitchShiftRef.current.pitch = -5
        tremoloRef.current.frequency.value = 0
        tremoloRef.current.depth.value = 0
        reverbRef.current.decay = 0.5
        gainRef.current.gain.value = 1.2
        break
      case 'female':
        pitchShiftRef.current.pitch = 5
        tremoloRef.current.frequency.value = 0
        tremoloRef.current.depth.value = 0
        reverbRef.current.decay = 1
        gainRef.current.gain.value = 0.8
        break
      case 'child':
        pitchShiftRef.current.pitch = 10
        tremoloRef.current.frequency.value = 0
        tremoloRef.current.depth.value = 0
        reverbRef.current.decay = 0.2
        gainRef.current.gain.value = 0.6
        break
      case 'old':
        pitchShiftRef.current.pitch = -2
        tremoloRef.current.frequency.value = 5
        tremoloRef.current.depth.value = 0.5
        reverbRef.current.decay = 2
        gainRef.current.gain.value = 1.1
        break
      default:
        pitchShiftRef.current.pitch = 0
        tremoloRef.current.frequency.value = 0
        tremoloRef.current.depth.value = 0
        reverbRef.current.decay = 0
        gainRef.current.gain.value = 1
    }
  }

  const handleIncomingCall = async (incomingCall: Peer.MediaConnection) => {
    try {
      await Tone.start()
      await initializeAudio()
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })
      
      incomingCall.answer(stream)
      setupCallStream(incomingCall)
    } catch (error) {
      console.error('Error handling incoming call:', error)
    }
  }

  const setupCallStream = (callConnection: Peer.MediaConnection) => {
    callConnection.on('stream', (remoteStream) => {
      const audioElement = new Audio()
      audioElement.srcObject = remoteStream
      audioElement.play()
    })
    setCall(callConnection)
    setIsCallActive(true)
  }

  const startCall = async () => {
    if (!remotePeerId || !peer) return

    try {
      await Tone.start()
      await initializeAudio()
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })
      
      const callConnection = peer.call(remotePeerId, stream)
      setupCallStream(callConnection)
    } catch (error) {
      console.error('Error starting call:', error)
    }
  }

  const endCall = () => {
    call?.close()
    setCall(null)
    setIsCallActive(false)
  }

  const copyPeerId = () => {
    navigator.clipboard.writeText(peerId)
      .then(() => alert('Peer ID copied to clipboard!'))
      .catch(err => console.error('Failed to copy:', err))
  }

  return (
    <div className="min-h-screen bg-[#1a1f2e] text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-2">Voice Changer</h1>
      <p className="text-gray-400 mb-8">Transform your voice in real-time</p>

      <div className="bg-[#1e2435] p-6 rounded-2xl w-full max-w-2xl">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-gray-400 mb-2">Your ID</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={peerId}
                readOnly
                className="w-full bg-[#272d3f] text-gray-300 p-2 rounded-lg"
              />
              <button
                onClick={copyPeerId}
                className="p-2 bg-[#272d3f] rounded-lg hover:bg-[#2f364a] transition-colors"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div>
            <p className="text-gray-400 mb-2">Remote ID</p>
            <input
              type="text"
              value={remotePeerId}
              onChange={(e) => setRemotePeerId(e.target.value)}
              placeholder="Enter remote peer ID"
              className="w-full bg-[#272d3f] text-gray-300 p-2 rounded-lg"
            />
          </div>
        </div>

        <div className="grid grid-cols-5 gap-4 mb-8">
          <button
            onClick={() => setSelectedEffect('normal')}
            className={`p-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-colors ${
              selectedEffect === 'normal' ? 'bg-[#26baa3] text-white' : 'bg-[#272d3f] text-gray-400 hover:bg-[#2f364a]'
            }`}
          >
            <Mic className="w-6 h-6" />
            <span>Normal</span>
          </button>
          <button
            onClick={() => setSelectedEffect('male')}
            className={`p-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-colors ${
              selectedEffect === 'male' ? 'bg-[#26baa3] text-white' : 'bg-[#272d3f] text-gray-400 hover:bg-[#2f364a]'
            }`}
          >
            <User className="w-6 h-6" />
            <span>Male</span>
          </button>
          <button
            onClick={() => setSelectedEffect('female')}
            className={`p-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-colors ${
              selectedEffect === 'female' ? 'bg-[#26baa3] text-white' : 'bg-[#272d3f] text-gray-400 hover:bg-[#2f364a]'
            }`}
          >
            <Users className="w-6 h-6" />
            <span>Female</span>
          </button>
          <button
            onClick={() => setSelectedEffect('child')}
            className={`p-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-colors ${
              selectedEffect === 'child' ? 'bg-[#26baa3] text-white' : 'bg-[#272d3f] text-gray-400 hover:bg-[#2f364a]'
            }`}
          >
            <Baby className="w-6 h-6" />
            <span>Child</span>
          </button>
          <button
            onClick={() => setSelectedEffect('old')}
            className={`p-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-colors ${
              selectedEffect === 'old' ? 'bg-[#26baa3] text-white' : 'bg-[#272d3f] text-gray-400 hover:bg-[#2f364a]'
            }`}
          >
            <PersonStanding className="w-6 h-6" />
            <span>Old Age</span>
          </button>
        </div>

        <div className="flex justify-center gap-4">
          <button
            onClick={() => setSelectedEffect('normal')}
            className="p-4 rounded-full bg-[#272d3f] text-gray-400 hover:bg-[#2f364a] transition-colors"
          >
            <Mic className="w-6 h-6" />
          </button>
          {!isCallActive ? (
            <button
              onClick={startCall}
              disabled={!remotePeerId}
              className="p-4 rounded-full bg-[#26baa3] text-white hover:bg-[#229e8a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Phone className="w-6 h-6" />
            </button>
          ) : (
            <button
              onClick={endCall}
              className="p-4 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

