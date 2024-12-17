import React, { useState, useEffect, useRef } from 'react';
import { Mic, Phone, PhoneOff, Share2, User, Users, Baby, PersonStanding, Volume2, VolumeX } from 'lucide-react';
import Peer from 'peerjs';
import * as Tone from 'tone';

export default function VoiceChangerCall() {
  const [peer, setPeer] = useState(null);
  const [peerId, setPeerId] = useState('');
  const [remotePeerId, setRemotePeerId] = useState('');
  const [call, setCall] = useState(null);
  const [dataConnection, setDataConnection] = useState(null);
  const [selectedEffect, setSelectedEffect] = useState('normal');
  const [isCallActive, setIsCallActive] = useState(false);
  const [isAudioInitialized, setIsAudioInitialized] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);

  const microphoneRef = useRef(null);
  const pitchShiftRef = useRef(null);
  const tremoloRef = useRef(null);
  const reverbRef = useRef(null);
  const gainRef = useRef(null);
  const noiseGateRef = useRef(null);
  const compressorRef = useRef(null);
  const remoteAudioRef = useRef(null);

  useEffect(() => {
    const initializePeer = async () => {
      try {
        const newPeer = new Peer();
        newPeer.on('open', (id) => {
          setPeerId(id);
        });
        newPeer.on('error', (error) => {
          console.error('PeerJS Error:', error);
        });
        newPeer.on('connection', handleDataConnection);
        newPeer.on('call', handleIncomingCall);

        setPeer(newPeer);
      } catch (error) {
        console.error('Failed to initialize PeerJS:', error);
      }
    };

    initializePeer();

    return () => {
      peer?.destroy();
    };
  }, []);

  useEffect(() => {
    if (isCallActive && !isAudioInitialized) {
      initializeAudio();
    } else if (!isCallActive && isAudioInitialized) {
      cleanupAudioEffects();
    }
  }, [isCallActive, isAudioInitialized]);

  useEffect(() => {
    if (isAudioInitialized) {
      applyVoiceEffect();
    }
  }, [selectedEffect, isAudioInitialized]);

  const initializeAudio = async () => {
    try {
      await Tone.start();
      await setupAudioEffects();
      setIsAudioInitialized(true);
    } catch (error) {
      console.error('Failed to initialize audio:', error);
    }
  };

  const setupAudioEffects = async () => {
    microphoneRef.current = new Tone.UserMedia();
    pitchShiftRef.current = new Tone.PitchShift();
    tremoloRef.current = new Tone.Tremolo().start();
    reverbRef.current = new Tone.Reverb();
    gainRef.current = new Tone.Gain(2); // Increased gain for louder voice
    noiseGateRef.current = new Tone.Gate(-50, 0.1); // Add noise gate
    compressorRef.current = new Tone.Compressor(-30, 3); // Add compressor

    await microphoneRef.current.open();
    await reverbRef.current.generate();

    microphoneRef.current.chain(
      noiseGateRef.current,
      pitchShiftRef.current,
      tremoloRef.current,
      reverbRef.current,
      compressorRef.current,
      gainRef.current,
      Tone.getDestination()
    );
  };

  const cleanupAudioEffects = () => {
    microphoneRef.current?.close();
    microphoneRef.current?.dispose();
    pitchShiftRef.current?.dispose();
    tremoloRef.current?.dispose();
    reverbRef.current?.dispose();
    gainRef.current?.dispose();
    noiseGateRef.current?.dispose();
    compressorRef.current?.dispose();
    setIsAudioInitialized(false);
  };

  const applyVoiceEffect = () => {
    if (!pitchShiftRef.current || !tremoloRef.current || !reverbRef.current || !gainRef.current) return;

    switch (selectedEffect) {
      case 'male':
        pitchShiftRef.current.pitch = -5;
        tremoloRef.current.frequency.value = 0;
        tremoloRef.current.depth.value = 0;
        reverbRef.current.decay = 0.5;
        gainRef.current.gain.setValueAtTime(2.2, Tone.now());
        break;
      case 'female':
        pitchShiftRef.current.pitch = 5;
        tremoloRef.current.frequency.value = 0;
        tremoloRef.current.depth.value = 0;
        reverbRef.current.decay = 1;
        gainRef.current.gain.setValueAtTime(1.8, Tone.now());
        break;
      case 'child':
        pitchShiftRef.current.pitch = 10;
        tremoloRef.current.frequency.value = 0;
        tremoloRef.current.depth.value = 0;
        reverbRef.current.decay = 0.2;
        gainRef.current.gain.setValueAtTime(1.6, Tone.now());
        break;
      case 'old':
        pitchShiftRef.current.pitch = -2;
        tremoloRef.current.frequency.value = 5;
        tremoloRef.current.depth.value = 0.5;
        reverbRef.current.decay = 2;
        gainRef.current.gain.setValueAtTime(2.1, Tone.now());
        break;
      default:
        pitchShiftRef.current.pitch = 0;
        tremoloRef.current.frequency.value = 0;
        tremoloRef.current.depth.value = 0;
        reverbRef.current.decay = 0.001;
        gainRef.current.gain.setValueAtTime(2, Tone.now());
    }

    // Send the selected effect to the remote peer
    if (dataConnection) {
      dataConnection.send({ type: 'voiceEffect', effect: selectedEffect });
    }
  };

  const handleIncomingCall = async (incomingCall) => {
    try {
      await initializeAudio();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      incomingCall.answer(stream);
      setupCallStream(incomingCall);
    } catch (error) {
      console.error('Error handling incoming call:', error);
    }
  };

  const handleDataConnection = (connection) => {
    connection.on('data', (data) => {
      if (data.type === 'voiceEffect') {
        setSelectedEffect(data.effect);
      }
    });
    setDataConnection(connection);
  };

  const setupCallStream = (callConnection) => {
    callConnection.on('stream', (remoteStream) => {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream;
        remoteAudioRef.current.play().catch((error) => console.error('Error playing remote audio:', error));
      }
    });

    setCall(callConnection);
    setIsCallActive(true);
  };

  const startCall = async () => {
    if (!remotePeerId || !peer) return;

    try {
      await initializeAudio();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      const callConnection = peer.call(remotePeerId, stream);
      const dataConnection = peer.connect(remotePeerId);

      setupCallStream(callConnection);
      setDataConnection(dataConnection);
    } catch (error) {
      console.error('Error starting call:', error);
    }
  };

  const endCall = () => {
    call?.close();
    dataConnection?.close();
    setCall(null);
    setDataConnection(null);
    setIsCallActive(false);
  };

  const copyPeerId = () => {
    const websiteUrl = window.location.href;
    const shareText = `Join my call at ${websiteUrl}?peerId=${peerId}`;
    navigator.clipboard.writeText(shareText)
      .then(() => alert('Peer ID and website URL copied to clipboard!'))
      .catch((err) => console.error('Failed to copy:', err));
  };

  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = isSpeakerOn;
    }
  };

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
          <button
            onClick={toggleSpeaker}
            className={`p-4 rounded-full ${
              isSpeakerOn ? 'bg-[#26baa3] text-white' : 'bg-[#272d3f] text-gray-400'
            } hover:bg-[#2f364a] transition-colors`}
          >
            {isSpeakerOn ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
          </button>
        </div>
      </div>
      <audio ref={remoteAudioRef} autoPlay />
    </div>
  );
}
