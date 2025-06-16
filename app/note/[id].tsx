import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from "react";
import { SafeAreaView, Text, TouchableOpacity, View } from "react-native";
import TipTapEditor from "../../components/TipTapEditor";

// Mock data interface (same as in index.tsx)
interface Note {
  id: string;
  title: string;
  content: string;
  modifiedDate: string;
}

// Mock notes data (in a real app, this would come from a database or API)
const mockNotes: Note[] = [
  {
    id: "1",
    title: "Meeting Notes",
    content: "<p>Discussed project requirements and timeline. Need to follow up on budget approval and resource allocation.</p>",
    modifiedDate: "6/14/2025 4:52 PM"
  },
  {
    id: "2",
    title: "Ideas & Inspiration",
    content: "<p>Brainstorming session for new app features. Consider offline-first approach and improved user experience.</p>",
    modifiedDate: "6/14/2025 4:51 PM"
  }
];

export default function NoteDetail(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [noteContent, setNoteContent] = useState<string>('');
  const [noteTitle, setNoteTitle] = useState<string>('');
  const [isNewNote, setIsNewNote] = useState<boolean>(false);

  useEffect(() => {
    if (id) {
      // Check if this is an existing note
      const existingNote = mockNotes.find(note => note.id === id);

      if (existingNote) {
        setNoteContent(existingNote.content);
        setNoteTitle(existingNote.title);
        setIsNewNote(false);
      } else {
        // This is a new note
        setNoteContent('<p></p>');
        setNoteTitle('Untitled Note');
        setIsNewNote(true);
      }
    }
  }, [id]);

  const handleContentChange = (newContent: string) => {
    setNoteContent(newContent);
    // In a real app, you might want to auto-save or debounce this
    console.log('Note content updated:', newContent);
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
        <TouchableOpacity
          onPress={handleBack}
          className="flex-row items-center"
        >
          <Text className="text-orange-600 text-base font-medium">← Back</Text>
        </TouchableOpacity>

        <Text className="text-gray-900 text-lg font-semibold flex-1 text-center" numberOfLines={1}>
          {noteTitle}
        </Text>

        <TouchableOpacity className="px-3 py-1">
          <Text className="text-orange-600 text-base font-medium">Save</Text>
        </TouchableOpacity>
      </View>

      {/* Editor */}
      <View className="flex-1">
        <TipTapEditor
          content={noteContent}
          onContentChange={handleContentChange}
          placeholder={isNewNote ? "Start writing your note..." : ""}
          editable={true}
        />
      </View>
    </SafeAreaView>
  );
}