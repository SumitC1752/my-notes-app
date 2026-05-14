import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Note } from '../types';
import { COLORS } from '../constants';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

interface Props {
  note: Note;
  onPress: () => void;
  onDelete: () => void;
}

export default function NoteCard({ note, onPress, onDelete }: Props) {
  const preview = note.content.length > 80
    ? note.content.slice(0, 80) + '...'
    : note.content;

  const date = new Date(note.updatedAt);
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: note.color }]}
      onPress={onPress}
      onLongPress={onDelete}
      activeOpacity={0.8}
    >
      <Text style={styles.title} numberOfLines={2}>{note.title || 'Untitled'}</Text>
      {preview.length > 0 && (
        <Text style={styles.preview} numberOfLines={4}>{preview}</Text>
      )}
      <Text style={styles.date}>{dateStr}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    minHeight: 120,
    borderRadius: 14,
    padding: 14,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
    lineHeight: 20,
  },
  preview: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    flex: 1,
  },
  date: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 8,
  },
});
