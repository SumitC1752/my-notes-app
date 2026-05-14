export interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  createdAt: number;
  updatedAt: number;
}

export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  text: string;
  encryptedText?: string;
  timestamp: number;
  expiresAt: number;
  type: 'text' | 'system';
}

export interface CallState {
  isActive: boolean;
  type: 'voice' | 'video' | null;
  isInitiator: boolean;
  remoteStream: any;
  localStream: any;
}

export interface ChatSession {
  roomId: string;
  userId: string;
  secretCode: string;
  connectedAt: number;
}
