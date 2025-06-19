import { Feather } from "@expo/vector-icons";
import { LegendList } from "@legendapp/list";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  RefreshControl,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeOutUp,
  Layout,
} from "react-native-reanimated";
import { Note } from "../database/models/Note";
import noteService from "../services/NoteService";

// Search Input Component
interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChangeText,
  placeholder = "Search...",
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
  onDelete: () => void;
}

const formatDate = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const NoteCard: React.FC<NoteCardProps> = ({ note, onPress, onDelete }) => (
  <Animated.View
    entering={FadeInDown.duration(400).springify()}
    exiting={FadeOutUp.duration(300).springify()}
    layout={Layout.springify()}
    className="relative"
  >
    <TouchableOpacity
      onPress={onPress}
      className="bg-white border border-gray-200 rounded-lg mb-4 p-6 shadow-sm active:scale-[1.02] transition-all duration-200 ease-out min-h-[120px]"
      style={{ paddingRight: 44, marginLeft: 16, marginRight: 16 }}
    >
      <View className="flex-1">
        <Text className="text-orange-600 text-xs font-medium mb-2">
          {formatDate(note.lastModified)}
        </Text>
        <Text
          className="text-gray-900 text-base font-medium mb-2"
          numberOfLines={2}
        >
          {note.title}
        </Text>
        <Text
          className="text-gray-600 text-sm leading-relaxed"
          numberOfLines={3}
        >
          {note.plainText}
        </Text>
        <View className="flex-row items-center mt-2 gap-4">
          <Text className="text-gray-400 text-xs">{note.wordCount} words</Text>
          {note.isPinned && (
            <Text className="text-orange-500 text-xs">📌 Pinned</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
    <TouchableOpacity
      onPress={onDelete}
      className="absolute top-3 right-6 z-20 p-2 rounded-full bg-gray-100 active:bg-gray-200"
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Feather name="trash-2" size={20} color="#f97316" />
    </TouchableOpacity>
  </Animated.View>
);

// Main App Header
interface AppHeaderProps {
  onNewNote: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({ onNewNote }) => (
  <View className="bg-white border-b border-gray-100 px-4 py-4">
    <View className="flex-row justify-between items-center">
      <Text className="text-gray-900 text-xl font-semibold">Inky Notes</Text>
      <TouchableOpacity
        onPress={onNewNote}
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

// Loading State Component
const LoadingState: React.FC = () => (
  <View className="flex-1 items-center justify-center p-6">
    <Text className="text-gray-600 text-base mb-2">Loading notes...</Text>
    <Text className="text-gray-400 text-sm">Setting up your workspace</Text>
  </View>
);

// Empty State Component
interface EmptyStateProps {
  onCreateNote: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onCreateNote }) => (
  <View className="flex-1 items-center justify-center p-6">
    <Text className="text-6xl mb-4">📝</Text>
    <Text className="text-gray-900 text-xl font-semibold mb-2">
      Welcome to Inky Notes
    </Text>
    <Text className="text-gray-600 text-center mb-8">
      Start capturing your thoughts and ideas.{"\n"}Create your first note to
      get started.
    </Text>
    <TouchableOpacity
      onPress={onCreateNote}
      className="
        bg-orange-500 px-6 py-3 rounded-lg
        active:bg-orange-600
        transition-all duration-200 ease-out
      "
    >
      <Text className="text-white font-medium">Create Your First Note</Text>
    </TouchableOpacity>
  </View>
);

// Error State Component
interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry }) => (
  <View className="flex-1 items-center justify-center p-6">
    <Text className="text-4xl mb-4">⚠️</Text>
    <Text className="text-gray-900 text-lg font-medium mb-2">
      Something went wrong
    </Text>
    <Text className="text-gray-600 text-center mb-6">{message}</Text>
    <TouchableOpacity
      onPress={onRetry}
      className="
        bg-orange-500 px-6 py-3 rounded-lg
        active:bg-orange-600
        transition-all duration-200 ease-out
      "
    >
      <Text className="text-white font-medium">Try Again</Text>
    </TouchableOpacity>
  </View>
);

// Main App Component
export default function Index(): React.ReactElement {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Filter notes based on search query
  const filteredNotes = notes.filter(
    (note: Note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.plainText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  // Load notes from database
  const loadNotes = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setIsLoading(true);
      }
      setError(null);

      // Initialize database
      const initResult = await noteService.initialize();
      if (!initResult.success) {
        throw new Error("Failed to initialize database");
      }

      // Search for all notes (excluding deleted ones)
      const result = await noteService.searchNotes({
        includeDeleted: false,
        sortBy: "lastModified",
        sortOrder: "desc",
        limit: 1000,
      });

      if (result.success && result.data) {
        setNotes(result.data);
        console.log(`✅ Loaded ${result.data.length} notes from database`);
      } else {
        throw new Error(result.error?.message || "Failed to load notes");
      }
    } catch (err) {
      console.error("❌ Failed to load notes:", err);
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Refresh notes
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadNotes(false);
  }, [loadNotes]);

  // Load notes on component mount
  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  // Refresh notes when screen comes into focus (e.g., after editing a note)
  useFocusEffect(
    useCallback(() => {
      // Refresh notes when returning to this screen
      const refreshOnFocus = async () => {
        if (__DEV__) {
          console.log("📱 Home screen focused - refreshing notes");
        }
        await loadNotes(false); // Don't show loading spinner for focus refresh
      };

      refreshOnFocus();
    }, [loadNotes])
  );

  const handleNotePress = (noteId: string): void => {
    if (__DEV__) {
      console.tron?.log("Note pressed:", noteId);
    }
    router.navigate(`/note/${noteId}`);
  };

  const handleNewNote = (): void => {
    if (__DEV__) {
      console.tron?.log("Creating new note");
    }
    router.navigate(`/note/new`);
  };

  const handleDeleteNote = useCallback(async (noteId: string) => {
    Alert.alert(
      "Delete Note",
      "Are you sure you want to delete this note? This action can be undone from the trash.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const result = await noteService.deleteNote(noteId);
            if (result.success) {
              setNotes((prev) => prev.filter((n) => n.id !== noteId));
            } else {
              Alert.alert(
                "Error",
                result.error?.message || "Failed to delete note"
              );
            }
          },
        },
      ]
    );
  }, []);

  // Render loading state
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <AppHeader onNewNote={handleNewNote} />
        <LoadingState />
      </SafeAreaView>
    );
  }

  // Render error state
  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <AppHeader onNewNote={handleNewNote} />
        <ErrorState message={error} onRetry={() => loadNotes()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <AppHeader onNewNote={handleNewNote} />

      <View className="flex-1">
        <View className="pt-6">
          <SearchInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search notes..."
          />

          {filteredNotes.length === 0 ? (
            notes.length === 0 ? (
              <EmptyState onCreateNote={handleNewNote} />
            ) : (
              <View className="px-4 py-8">
                <Text className="text-center text-gray-600">
                  No notes found matching &ldquo;{searchQuery}&rdquo;
                </Text>
              </View>
            )
          ) : (
            <LegendList
              data={filteredNotes}
              keyExtractor={(item) => item.id}
              estimatedItemSize={120}
              renderItem={({ item }) => (
                <View className="px-4">
                  <NoteCard
                    note={item}
                    onPress={() => handleNotePress(item.id)}
                    onDelete={() => handleDeleteNote(item.id)}
                  />
                </View>
              )}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={handleRefresh}
                  tintColor="#f97316"
                  colors={["#f97316"]}
                />
              }
              contentContainerStyle={{ paddingBottom: 24 }}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
