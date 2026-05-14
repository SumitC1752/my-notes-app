import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Message, ChatSession } from '../types';
import { encrypt, decrypt } from '../utils/crypto';
import { SERVER_URL, MESSAGE_TTL_MINUTES } from '../constants';

interface UseSocketReturn {
  messages: Message[];
  connected: boolean;
  partnerOnline: boolean;
  sendMessage: (text: string) => void;
  disconnect: () => void;
  onCallOffer: (cb: (data: any) => void) => void;
  onCallAnswer: (cb: (data: any) => void) => void;
  onIceCandidate: (cb: (data: any) => void) => void;
  onCallEnd: (cb: () => void) => void;
  emitCallOffer: (data: any) => void;
  emitCallAnswer: (data: any) => void;
  emitIceCandidate: (data: any) => void;
  emitCallEnd: () => void;
}

export function useSocket(session: ChatSession | null): UseSocketReturn {
  const socketRef = useRef<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [connected, setConnected] = useState(false);
  const [partnerOnline, setPartnerOnline] = useState(false);

  const callOfferCbRef = useRef<((d: any) => void) | null>(null);
  const callAnswerCbRef = useRef<((d: any) => void) | null>(null);
  const iceCandidateCbRef = useRef<((d: any) => void) | null>(null);
  const callEndCbRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!session) return;

    const socket = io(SERVER_URL, {
      transports: ['websocket'],
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join_room', {
        roomId: session.roomId,
        userId: session.userId,
      });
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('partner_status', ({ online }: { online: boolean }) => {
      setPartnerOnline(online);
    });

    socket.on('message', (msg: Message) => {
      const decrypted = decrypt(msg.encryptedText || '', session.secretCode);
      setMessages((prev) => [
        ...prev,
        { ...msg, text: decrypted },
      ].filter((m) => m.expiresAt > Date.now()));
    });

    socket.on('message_history', (history: Message[]) => {
      const decrypted = history.map((msg) => ({
        ...msg,
        text: decrypt(msg.encryptedText || '', session.secretCode),
      })).filter((m) => m.expiresAt > Date.now());
      setMessages(decrypted);
    });

    socket.on('message_expired', (id: string) => {
      setMessages((prev) => prev.filter((m) => m.id !== id));
    });

    socket.on('call_offer', (data: any) => {
      if (callOfferCbRef.current) callOfferCbRef.current(data);
    });
    socket.on('call_answer', (data: any) => {
      if (callAnswerCbRef.current) callAnswerCbRef.current(data);
    });
    socket.on('ice_candidate', (data: any) => {
      if (iceCandidateCbRef.current) iceCandidateCbRef.current(data);
    });
    socket.on('call_end', () => {
      if (callEndCbRef.current) callEndCbRef.current();
    });

    const expireInterval = setInterval(() => {
      setMessages((prev) => prev.filter((m) => m.expiresAt > Date.now()));
    }, 30000);

    return () => {
      socket.disconnect();
      clearInterval(expireInterval);
    };
  }, [session]);

  const sendMessage = useCallback((text: string) => {
    if (!socketRef.current || !session || !text.trim()) return;
    const encrypted = encrypt(text.trim(), session.secretCode);
    const msg: Message = {
      id: Date.now().toString() + Math.random(),
      roomId: session.roomId,
      senderId: session.userId,
      text: text.trim(),
      encryptedText: encrypted,
      timestamp: Date.now(),
      expiresAt: Date.now() + MESSAGE_TTL_MINUTES * 60 * 1000,
      type: 'text',
    };
    setMessages((prev) => [...prev, msg]);
    socketRef.current.emit('message', { ...msg, text: undefined });
  }, [session]);

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
  }, []);

  return {
    messages,
    connected,
    partnerOnline,
    sendMessage,
    disconnect,
    onCallOffer: (cb) => { callOfferCbRef.current = cb; },
    onCallAnswer: (cb) => { callAnswerCbRef.current = cb; },
    onIceCandidate: (cb) => { iceCandidateCbRef.current = cb; },
    onCallEnd: (cb) => { callEndCbRef.current = cb; },
    emitCallOffer: (data) => socketRef.current?.emit('call_offer', { ...data, roomId: session?.roomId }),
    emitCallAnswer: (data) => socketRef.current?.emit('call_answer', { ...data, roomId: session?.roomId }),
    emitIceCandidate: (data) => socketRef.current?.emit('ice_candidate', { ...data, roomId: session?.roomId }),
    emitCallEnd: () => socketRef.current?.emit('call_end', { roomId: session?.roomId }),
  };
}
