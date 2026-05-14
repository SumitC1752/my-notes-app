import AsyncStorage from '@react-native-async-storage/async-storage';
import { Note } from '../types';
import { NOTES_STORAGE_KEY } from '../constants';

export async function getNotes(): Promise<Note[]> {
  try {
    const raw = await AsyncStorage.getItem(NOTES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveNotes(notes: Note[]): Promise<void> {
  await AsyncStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
}

export async function addNote(note: Note): Promise<void> {
  const notes = await getNotes();
  notes.unshift(note);
  await saveNotes(notes);
}

export async function updateNote(updated: Note): Promise<void> {
  const notes = await getNotes();
  const idx = notes.findIndex((n) => n.id === updated.id);
  if (idx !== -1) {
    notes[idx] = updated;
    await saveNotes(notes);
  }
}

export async function deleteNote(id: string): Promise<void> {
  const notes = await getNotes();
  await saveNotes(notes.filter((n) => n.id !== id));
}
