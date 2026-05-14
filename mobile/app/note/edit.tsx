import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Note } from '../../types';
import { getNotes, updateNote, deleteNote } from '../../utils/storage';
import { COLORS, NOTE_COLORS } from '../../constants';

export default function EditNoteScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState(NOTE_COLORS[0]);

  useEffect(() => {
    (async () => {
      const notes = await getNotes();
      const found = notes.find((n) => n.id === id);
      if (found) {
        setNote(found);
        setTitle(found.title);
        setContent(found.content);
        setColor(found.color);
      }
    })();
  }, [id]);

  const handleSave = async () => {
    if (!note) return;
    const updated: Note = {
      ...note,
      title: title.trim(),
      content: content.trim(),
      color,
      updatedAt: Date.now(),
    };
    await updateNote(updated);
    router.back();
  };

  const handleDelete = () => {
    Alert.alert('Delete Note', 'Delete this note permanently?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (note) {
            await deleteNote(note.id);
            router.back();
          }
        },
      },
    ]);
  };

  if (!note) return null;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={color} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.container, { backgroundColor: color }]}>
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <View style={styles.topRight}>
              <TouchableOpacity onPress={handleDelete} style={styles.iconBtn}>
                <Ionicons name="trash-outline" size={22} color={COLORS.danger} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
                <Text style={styles.saveBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <TextInput
              style={styles.titleInput}
              placeholder="Title"
              placeholderTextColor={COLORS.textLight}
              value={title}
              onChangeText={setTitle}
              multiline
              maxLength={100}
            />
            <TextInput
              style={styles.contentInput}
              placeholder="Start typing..."
              placeholderTextColor={COLORS.textLight}
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
            />
          </ScrollView>

          <View style={styles.colorBar}>
            {NOTE_COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.colorDot,
                  { backgroundColor: c },
                  color === c && styles.colorDotSelected,
                ]}
                onPress={() => setColor(c)}
              />
            ))}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { padding: 4 },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBtn: { padding: 4 },
  saveBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  scroll: { paddingHorizontal: 20, paddingBottom: 20 },
  titleInput: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
    lineHeight: 30,
  },
  contentInput: {
    fontSize: 16,
    color: COLORS.text,
    minHeight: 300,
    lineHeight: 24,
  },
  colorBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  colorDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorDotSelected: {
    borderColor: COLORS.primaryDark,
    transform: [{ scale: 1.2 }],
  },
});
