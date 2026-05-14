import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface Props {
  callType: 'voice' | 'video';
  localStream: any;
  remoteStream: any;
  onEndCall: () => void;
}

export default function CallScreen({ callType, localStream, remoteStream, onEndCall }: Props) {
  const RTCView = useRef<any>(null);

  useEffect(() => {
    try {
      const { RTCView: RV } = require('react-native-webrtc');
      RTCView.current = RV;
    } catch {}
  }, []);

  const RV = RTCView.current;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={styles.container}>
        {callType === 'video' && RV ? (
          <>
            {remoteStream && (
              <RV
                style={styles.remoteVideo}
                streamURL={remoteStream.toURL ? remoteStream.toURL() : ''}
                objectFit="cover"
              />
            )}
            {localStream && (
              <View style={styles.localVideoContainer}>
                <RV
                  style={styles.localVideo}
                  streamURL={localStream.toURL ? localStream.toURL() : ''}
                  objectFit="cover"
                  zOrder={1}
                />
              </View>
            )}
          </>
        ) : (
          <View style={styles.voiceCenter}>
            <View style={styles.avatarRing}>
              <Ionicons name="person" size={60} color="#00E5FF" />
            </View>
            <Text style={styles.callingText}>
              {remoteStream ? 'Connected' : 'Connecting...'}
            </Text>
            <Text style={styles.callTypeText}>Voice Call • Encrypted</Text>
          </View>
        )}

        <View style={styles.controls}>
          <TouchableOpacity style={styles.muteBtn}>
            <Ionicons name="mic-off-outline" size={26} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.endBtn} onPress={onEndCall}>
            <Ionicons name="call" size={30} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
          </TouchableOpacity>
          {callType === 'video' && (
            <TouchableOpacity style={styles.flipBtn}>
              <Ionicons name="camera-reverse-outline" size={26} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000' },
  container: { flex: 1, backgroundColor: '#000' },
  remoteVideo: { position: 'absolute', width, height, top: 0, left: 0 },
  localVideoContainer: {
    position: 'absolute',
    top: 60,
    right: 16,
    width: 100,
    height: 140,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#333',
    zIndex: 10,
  },
  localVideo: { width: '100%', height: '100%' },
  voiceCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  avatarRing: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 2,
    borderColor: '#00E5FF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D0D0D',
  },
  callingText: { fontSize: 20, color: '#fff', fontWeight: '600' },
  callTypeText: { fontSize: 14, color: '#555' },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    paddingBottom: 40,
    paddingTop: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  muteBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1E1E1E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  endBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FF1744',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flipBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1E1E1E',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
