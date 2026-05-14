import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Message, ChatSession } from '../../types';
import { useSocket } from '../../hooks/useSocket';
import { useWebRTC } from '../../hooks/useWebRTC';
import { getSession, clearSession } from '../../utils/session';
import CallScreen from '../../components/CallScreen';

const BG = '#0D0D0D';
const SURFACE = '#1A1A1A';
const ACCENT = '#00E5FF';
const SENT_BG = '#003C45';
const RECV_BG = '#1E1E1E';

export default function ChatScreen() {
  const router = useRouter();
  const [session, setSession] = useState<ChatSession | null>(null);
  const [input, setInput] = useState('');
  const [callType, setCallType] = useState<'voice' | 'video' | null>(null);
  const [incomingCall, setIncomingCall] = useState<{ type: 'voice' | 'video'; offer: any } | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const socketHook = useSocket(session);
  const webrtc = useWebRTC();

  useEffect(() => {
    (async () => {
      const s = await getSession();
      if (!s) { router.replace('/'); return; }
      setSession(s);
    })();
  }, []);

  useEffect(() => {
    if (!session) return;
    socketHook.onCallOffer((data) => {
      const type = data.offer?.sdp?.includes('video') ? 'video' : 'voice';
      setIncomingCall({ type, offer: data.offer });
    });
    socketHook.onCallAnswer(async (data) => {
      await webrtc.setRemoteAnswer(data.answer);
    });
    socketHook.onIceCandidate(async (data) => {
      await webrtc.addIceCandidate(data.candidate);
    });
    socketHook.onCallEnd(() => {
      webrtc.endCall();
      setCallType(null);
    });
    webrtc.onIceCandidateGenerated((candidate) => {
      socketHook.emitIceCandidate({ candidate });
    });
  }, [session]);

  const handleSend = () => {
    if (!input.trim()) return;
    socketHook.sendMessage(input.trim());
    setInput('');
  };

  const handleStartCall = async (type: 'voice' | 'video') => {
    setCallType(type);
    await webrtc.startCall(type, (offer) => {
      socketHook.emitCallOffer({ offer, callType: type });
    });
  };

  const handleAcceptCall = async () => {
    if (!incomingCall) return;
    const { type, offer } = incomingCall;
    setIncomingCall(null);
    setCallType(type);
    await webrtc.acceptCall(offer, (answer) => {
      socketHook.emitCallAnswer({ answer });
    });
  };

  const handleDeclineCall = () => {
    setIncomingCall(null);
    socketHook.emitCallEnd();
  };

  const handleEndCall = () => {
    webrtc.endCall();
    socketHook.emitCallEnd();
    setCallType(null);
  };

  const handleExit = () => {
    Alert.alert(
      'Exit Secret Chat',
      'End your session? Messages will auto-delete after 10 minutes.',
      [
        { text: 'Stay', style: 'cancel' },
        {
          text: 'Exit',
          style: 'destructive',
          onPress: async () => {
            socketHook.disconnect();
            await clearSession();
            router.replace('/');
          },
        },
      ]
    );
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const getTimeLeft = (expiresAt: number) => {
    const left = Math.max(0, Math.floor((expiresAt - Date.now()) / 60000));
    return `${left}m`;
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMine = item.senderId === session?.userId;
    return (
      <View style={[styles.msgRow, isMine ? styles.msgRowRight : styles.msgRowLeft]}>
        <View style={[styles.bubble, isMine ? styles.bubbleSent : styles.bubbleRecv]}>
          <Text style={styles.msgText}>{item.text}</Text>
          <View style={styles.msgMeta}>
            <Text style={styles.msgTime}>{formatTime(item.timestamp)}</Text>
            <Text style={styles.msgExpiry}>⏱ {getTimeLeft(item.expiresAt)}</Text>
          </View>
        </View>
      </View>
    );
  };

  if (callType) {
    return (
      <CallScreen
        callType={callType}
        localStream={webrtc.localStream}
        remoteStream={webrtc.remoteStream}
        onEndCall={handleEndCall}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.statusDot, { backgroundColor: socketHook.partnerOnline ? '#00E676' : '#555' }]} />
              <View>
                <Text style={styles.headerTitle}>Secure Channel</Text>
                <Text style={styles.headerSub}>
                  {socketHook.connected
                    ? socketHook.partnerOnline ? 'Partner online' : 'Waiting for partner...'
                    : 'Connecting...'}
                </Text>
              </View>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.headerBtn} onPress={() => handleStartCall('voice')}>
                <Ionicons name="call-outline" size={22} color={ACCENT} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerBtn} onPress={() => handleStartCall('video')}>
                <Ionicons name="videocam-outline" size={22} color={ACCENT} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerBtn} onPress={handleExit}>
                <Ionicons name="shield-checkmark-outline" size={22} color="#555" />
              </TouchableOpacity>
            </View>
          </View>

          {socketHook.messages.length === 0 ? (
            <View style={styles.emptyChat}>
              <Ionicons name="lock-closed" size={40} color="#2A2A2A" />
              <Text style={styles.emptyChatText}>End-to-end encrypted</Text>
              <Text style={styles.emptyChatSub}>Messages auto-delete in 10 minutes</Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={socketHook.messages}
              keyExtractor={(item) => item.id}
              renderItem={renderMessage}
              contentContainerStyle={styles.messageList}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />
          )}

          {incomingCall && (
            <View style={styles.incomingCallBanner}>
              <Ionicons
                name={incomingCall.type === 'video' ? 'videocam' : 'call'}
                size={22}
                color="#fff"
              />
              <Text style={styles.incomingCallText}>
                Incoming {incomingCall.type} call...
              </Text>
              <TouchableOpacity style={styles.acceptBtn} onPress={handleAcceptCall}>
                <Ionicons name="checkmark" size={20} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.declineBtn} onPress={handleDeclineCall}>
                <Ionicons name="close" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Message..."
              placeholderTextColor="#444"
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={2000}
            />
            <TouchableOpacity
              style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!input.trim()}
            >
              <Ionicons name="send" size={20} color={input.trim() ? '#000' : '#333'} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  container: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E1E',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 12, color: '#666', marginTop: 1 },
  headerRight: { flexDirection: 'row', gap: 4 },
  headerBtn: { padding: 8 },
  emptyChat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyChatText: { fontSize: 16, color: '#333', fontWeight: '600' },
  emptyChatSub: { fontSize: 13, color: '#444' },
  messageList: { padding: 16, gap: 8 },
  msgRow: { flexDirection: 'row', marginBottom: 8 },
  msgRowRight: { justifyContent: 'flex-end' },
  msgRowLeft: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '75%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 4,
  },
  bubbleSent: { backgroundColor: SENT_BG, borderBottomRightRadius: 4 },
  bubbleRecv: { backgroundColor: RECV_BG, borderBottomLeftRadius: 4 },
  msgText: { fontSize: 15, color: '#fff', lineHeight: 20 },
  msgMeta: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  msgTime: { fontSize: 10, color: '#555' },
  msgExpiry: { fontSize: 10, color: '#444' },
  incomingCallBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    padding: 14,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
  },
  incomingCallText: { flex: 1, color: '#fff', fontSize: 14 },
  acceptBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#00E676',
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF1744',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#1E1E1E',
    backgroundColor: BG,
  },
  input: {
    flex: 1,
    backgroundColor: SURFACE,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#fff',
    maxHeight: 120,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#1E1E1E' },
});
