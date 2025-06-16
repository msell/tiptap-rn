import { useRouter } from 'expo-router';
import React, { useState } from "react";
import { SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

// Mock data for notes
interface Note {
  id: string;
  title: string;
  content: string;
  modifiedDate: string;
}

const mockNotes: Note[] = [
  {
    id: "1",
    title: "Meeting Notes",
    content: "Discussed project requirements and timeline. Need to follow up on budget approval and resource allocation.",
    modifiedDate: "6/14/2025 4:52 PM"
  },
  {
    id: "2",
    title: "Ideas & Inspiration",
    content: "Brainstorming session for new app features. Consider offline-first approach and improved user experience.",
    modifiedDate: "6/14/2025 4:51 PM"
  }
];

// Search Input Component
interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChangeText,
  placeholder = "Search..."
}) => (
  <View className="mx-4 mb-6">
    <View className="relative">
      <Text className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10 text-base">
        🔍
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        className="
          w-full pl-10 pr-4 py-3
          bg-gray-100
          border border-gray-200 rounded-lg
          text-base text-gray-900
        "
      />
    </View>
  </View>
);

// Note Card Component
interface NoteCardProps {
  note: Note;
  onPress: () => void;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    className="
      bg-white
      border border-gray-200
      rounded-lg mx-4 mb-4 p-6
      shadow-sm
      active:scale-[1.02]
      transition-all duration-200 ease-out
      min-h-[120px]
    "
  >
    <View className="flex-1">
      <Text className="text-orange-600 text-xs font-medium mb-2">
        {note.modifiedDate}
      </Text>
      <Text className="text-gray-900 text-base font-medium mb-2" numberOfLines={2}>
        {note.title}
      </Text>
      <Text className="text-gray-600 text-sm leading-relaxed" numberOfLines={3}>
        {note.content}
      </Text>
    </View>
  </TouchableOpacity>
);

// Main App Header
const AppHeader: React.FC = () => (
  <View className="bg-white border-b border-gray-100 px-4 py-4">
    <View className="flex-row justify-between items-center">
      <Text className="text-gray-900 text-xl font-semibold">
        Inky Notes
      </Text>
      <TouchableOpacity
        className="
          w-8 h-8 bg-orange-500 rounded-full
          items-center justify-center
          active:bg-orange-600
        "
      >
        <Text className="text-white text-lg font-bold">+</Text>
      </TouchableOpacity>
    </View>
  </View>
);

// Main App Component
export default function Index(): React.ReactElement {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const router = useRouter();
  const filteredNotes = mockNotes.filter((note: Note) =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNotePress = (noteId: string): void => {
    if (__DEV__) {
      console.tron.log("Note pressed:", noteId);
    }
    router.navigate(`/note/${noteId}`);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <AppHeader />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="pt-6">
          <SearchInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search..."
          />

          <View className="pb-6">
            {filteredNotes.map((note: Note) => (
              <NoteCard
                key={note.id}
                note={note}
                onPress={() => handleNotePress(note.id)}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}