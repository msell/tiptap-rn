import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from "react";
import { SafeAreaView, Text, TextInput, TouchableOpacity, View } from "react-native";
import TipTapEditor from "../../components/TipTapEditor";

// Mock data interface following Inky Notes standards
interface Note {
  id: string;
  title: string;
  content: string;
  modifiedDate: string;
}

// Mock notes data (in production this would come from expo-sqlite)
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

// Header component following Inky Notes design system
interface NoteHeaderProps {
  onBack: () => void;
  onSave: () => void;
}

const NoteHeader: React.FC<NoteHeaderProps> = ({ onBack, onSave }) => (
  <View className="bg-gradient-to-br from-yellow-50 via-orange-50 to-yellow-100 px-4 py-3 border-b border-orange-200">
    <View className="flex-row items-center justify-between gap-1.5">
      <TouchableOpacity
        onPress={onBack}
        className="
          px-4 py-2 rounded-md
          transition-all duration-200 ease-out
          active:scale-[1.02] active:bg-orange-100
        "
      >
        <Text className="text-orange-600 text-sm font-medium">← Back</Text>
      </TouchableOpacity>

      <Text className="text-lg font-semibold text-gray-900">
        Inky Notes
      </Text>

      <TouchableOpacity
        onPress={onSave}
        className="
          bg-orange-500 px-4 py-2 rounded-md
          transition-all duration-200 ease-out
          active:scale-[1.02] active:bg-orange-600
          shadow-sm
        "
      >
        <Text className="text-white text-sm font-medium">Save</Text>
      </TouchableOpacity>
    </View>
  </View>
);

// Title input component following Inky Notes design system
interface NoteTitleInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

const NoteTitleInput: React.FC<NoteTitleInputProps> = ({
  value,
  onChangeText,
  placeholder = "Untitled Note"
}) => (
  <View className="mb-6">
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#9ca3af"
      className="
        text-4xl font-bold text-gray-900
        bg-transparent
        px-0 py-2
        border-b-2 border-transparent
        focus:border-orange-300
        transition-all duration-200 ease-out
      "
      multiline={false}
      maxLength={100}
    />
  </View>
);

export default function NoteDetail() {
  const { id } = useLocalSearchParams();
  const noteId = typeof id === 'string' ? id : id?.[0] || '';
  const router = useRouter();
  const [noteContent, setNoteContent] = useState<string>('');
  const [noteTitle, setNoteTitle] = useState<string>('');
  const [isNewNote, setIsNewNote] = useState<boolean>(false);

  useEffect(() => {
    if (noteId) {
      // Check if this is an existing note
      const existingNote = mockNotes.find((note: Note) => note.id === noteId);

      if (existingNote) {
        setNoteContent(existingNote.content);
        setNoteTitle(existingNote.title);
        setIsNewNote(false);
      } else {
        // This is a new note - following Inky Notes patterns
        setNoteContent('<p></p>');
        setNoteTitle('');
        setIsNewNote(true);
      }
    }
  }, [noteId]);

  const handleContentChange = (newContent: string): void => {
    setNoteContent(newContent);
    // In production: implement debounced auto-save to expo-sqlite
    if (__DEV__) {
      console.log('Note content updated:', newContent);
    }
  };

  const handleTitleChange = (newTitle: string): void => {
    setNoteTitle(newTitle);
    // In production: implement debounced auto-save to expo-sqlite
    if (__DEV__) {
      console.log('Note title updated:', newTitle);
    }
  };

  const handleBack = (): void => {
    router.back();
  };

  const handleSave = (): void => {
    // In production: save to expo-sqlite with proper error handling
    if (__DEV__) {
      console.log('Saving note:', {
        id: noteId,
        title: noteTitle || 'Untitled Note',
        content: noteContent
      });
    }

    // Show success feedback or handle errors
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-gradient-to-br from-yellow-50 via-orange-50 to-yellow-100">
      <NoteHeader
        onBack={handleBack}
        onSave={handleSave}
      />

      {/* Main Content Container with glass morphism */}
      <View className="flex-1 p-6 gap-6">
        {/* Title Input Container */}
        <View className="
          bg-white/80 backdrop-blur-md
          rounded-lg
          shadow-sm
          border border-orange-200
          p-6
          transition-all duration-200 ease-out
        ">
          <NoteTitleInput
            value={noteTitle}
            onChangeText={handleTitleChange}
            placeholder="Untitled Note"
          />
        </View>

        {/* Editor Container */}
        <View className="
          flex-1
          bg-white/80 backdrop-blur-md
          rounded-xl
          shadow-sm
          border border-orange-200
          overflow-hidden
          transition-all duration-200 ease-out
        ">
          <TipTapEditor
            content={noteContent}
            onContentChange={handleContentChange}
            placeholder={isNewNote ? "Start writing your note..." : ""}
            editable={true}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}