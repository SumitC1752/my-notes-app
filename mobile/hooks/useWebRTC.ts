import { useRef, useState, useCallback } from 'react';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

interface WebRTCHook {
  localStream: any;
  remoteStream: any;
  isCallActive: boolean;
  startCall: (type: 'voice' | 'video', onOffer: (sdp: any) => void) => Promise<void>;
  acceptCall: (offer: any, onAnswer: (sdp: any) => void) => Promise<void>;
  setRemoteAnswer: (answer: any) => Promise<void>;
  addIceCandidate: (candidate: any) => Promise<void>;
  onIceCandidateGenerated: (cb: (c: any) => void) => void;
  endCall: () => void;
}

export function useWebRTC(): WebRTCHook {
  const pcRef = useRef<any>(null);
  const [localStream, setLocalStream] = useState<any>(null);
  const [remoteStream, setRemoteStream] = useState<any>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const iceCbRef = useRef<((c: any) => void) | null>(null);

  const getMediaStream = async (type: 'voice' | 'video') => {
    try {
      const WebRTC = require('react-native-webrtc');
      const constraints = {
        audio: true,
        video: type === 'video' ? { facingMode: 'user' } : false,
      };
      return await WebRTC.mediaDevices.getUserMedia(constraints);
    } catch (e) {
      throw e;
    }
  };

  const createPC = (onRemoteTrack: (stream: any) => void) => {
    const { RTCPeerConnection } = require('react-native-webrtc');
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event: any) => {
      if (event.candidate && iceCbRef.current) {
        iceCbRef.current(event.candidate);
      }
    };

    pc.ontrack = (event: any) => {
      if (event.streams && event.streams[0]) {
        onRemoteTrack(event.streams[0]);
      }
    };

    return pc;
  };

  const startCall = useCallback(async (type: 'voice' | 'video', onOffer: (sdp: any) => void) => {
    const stream = await getMediaStream(type);
    setLocalStream(stream);

    const pc = createPC((remote) => {
      setRemoteStream(remote);
    });
    pcRef.current = pc;

    stream.getTracks().forEach((track: any) => {
      pc.addTrack(track, stream);
    });

    const offer = await pc.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: type === 'video',
    });
    await pc.setLocalDescription(offer);
    setIsCallActive(true);
    onOffer(offer);
  }, []);

  const acceptCall = useCallback(async (offer: any, onAnswer: (sdp: any) => void) => {
    const type = offer.sdp?.includes('video') ? 'video' : 'voice';
    const stream = await getMediaStream(type as 'voice' | 'video');
    setLocalStream(stream);

    const pc = createPC((remote) => {
      setRemoteStream(remote);
    });
    pcRef.current = pc;

    stream.getTracks().forEach((track: any) => {
      pc.addTrack(track, stream);
    });

    const { RTCSessionDescription } = require('react-native-webrtc');
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    setIsCallActive(true);
    onAnswer(answer);
  }, []);

  const setRemoteAnswer = useCallback(async (answer: any) => {
    if (!pcRef.current) return;
    const { RTCSessionDescription } = require('react-native-webrtc');
    await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
  }, []);

  const addIceCandidate = useCallback(async (candidate: any) => {
    if (!pcRef.current) return;
    const { RTCIceCandidate } = require('react-native-webrtc');
    await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
  }, []);

  const onIceCandidateGenerated = useCallback((cb: (c: any) => void) => {
    iceCbRef.current = cb;
  }, []);

  const endCall = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach((t: any) => t.stop());
      setLocalStream(null);
    }
    setRemoteStream(null);
    setIsCallActive(false);
  }, [localStream]);

  return {
    localStream,
    remoteStream,
    isCallActive,
    startCall,
    acceptCall,
    setRemoteAnswer,
    addIceCandidate,
    onIceCandidateGenerated,
    endCall,
  };
}
