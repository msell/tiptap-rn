import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from "react";
import { Alert, AppState, SafeAreaView, Text, TextInput, TouchableOpacity, View } from "react-native";
import TipTapEditor from "../../components/TipTapEditor";
import { Note } from "../../database/models/Note";
import noteService from "../../services/NoteService";

// Header component following Inky Notes design system
interface NoteHeaderProps {
  onBack: () => void;
  onSave: () => void;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
}

const NoteHeader: React.FC<NoteHeaderProps> = ({ onBack, onSave, hasUnsavedChanges, isSaving }) => (
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
        disabled={isSaving}
        className={`
          px-4 py-2 rounded-md
          transition-all duration-200 ease-out
          active:scale-[1.02]
          shadow-sm
          ${isSaving
            ? 'bg-gray-400 opacity-50'
            : hasUnsavedChanges
              ? 'bg-orange-600 active:bg-orange-700'
              : 'bg-orange-500 active:bg-orange-600'
          }
        `}
      >
        <Text className="text-white text-sm font-medium">
          {isSaving ? 'Saving...' : 'Save'}
        </Text>
      </TouchableOpacity>
    </View>
  </View>
);

// Title input component following Inky Notes design system
interface NoteTitleInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  editable?: boolean;
}

const NoteTitleInput: React.FC<NoteTitleInputProps> = ({
  value,
  onChangeText,
  placeholder = "Untitled Note",
  editable = true
}) => (
  <View className="mb-6">
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#9ca3af"
      editable={editable}
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

// Loading component
const LoadingState: React.FC = () => (
  <SafeAreaView className="flex-1 bg-gradient-to-br from-yellow-50 via-orange-50 to-yellow-100">
    <View className="flex-1 items-center justify-center">
      <Text className="text-gray-600 text-lg">Loading note...</Text>
    </View>
  </SafeAreaView>
);

// Error component
interface ErrorStateProps {
  message: string;
  onRetry: () => void;
  onBack: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry, onBack }) => (
  <SafeAreaView className="flex-1 bg-gradient-to-br from-yellow-50 via-orange-50 to-yellow-100">
    <View className="flex-1 items-center justify-center p-6">
      <Text className="text-red-600 text-lg font-medium mb-4">Error</Text>
      <Text className="text-gray-600 text-center mb-6">{message}</Text>
      <View className="flex-row gap-4">
        <TouchableOpacity
          onPress={onBack}
          className="bg-gray-500 px-6 py-3 rounded-md"
        >
          <Text className="text-white font-medium">Go Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onRetry}
          className="bg-orange-500 px-6 py-3 rounded-md"
        >
          <Text className="text-white font-medium">Retry</Text>
        </TouchableOpacity>
      </View>
    </View>
  </SafeAreaView>
);

export default function NoteDetail() {
  const { id } = useLocalSearchParams();
  const noteId = typeof id === 'string' ? id : id?.[0] || '';
  const router = useRouter();

  // State management
  const [note, setNote] = useState<Note | null>(null);
  const [noteContent, setNoteContent] = useState<string>('');
  const [noteTitle, setNoteTitle] = useState<string>('');
  const [originalContent, setOriginalContent] = useState<string>('');
  const [originalTitle, setOriginalTitle] = useState<string>('');
  const [isNewNote, setIsNewNote] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(false);
  const [shouldDiscardChanges, setShouldDiscardChanges] = useState<boolean>(false);

  // Initialize database and load note
  const loadNote = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setIsInitializing(true);

    try {
      // Initialize database
      const initResult = await noteService.initialize();
      if (!initResult.success) {
        throw new Error('Failed to initialize database');
      }

      if (noteId) {
        // Try to load existing note
        const result = await noteService.getNote(noteId);

        if (result.success && result.data) {
          // Existing note found
          const loadedNote = result.data;
          setNote(loadedNote);
          setNoteContent(loadedNote.content);
          setNoteTitle(loadedNote.title);
          setOriginalContent(loadedNote.content);
          setOriginalTitle(loadedNote.title);
          setIsNewNote(false);
          setHasUnsavedChanges(false); // Reset unsaved changes
        } else {
          // Note not found - create a new note if this looks like a "new" route
          if (noteId === 'new' || !noteId) {
            const createResult = await noteService.createNewNote({
              title: 'Untitled Note',
              content: '<p></p>',
            });

            if (createResult.success && createResult.data) {
              const newNote = createResult.data;
              setNote(newNote);
              setNoteContent(newNote.content);
              setNoteTitle(newNote.title);
              setOriginalContent(newNote.content);
              setOriginalTitle(newNote.title);
              setIsNewNote(true);
              setHasUnsavedChanges(false); // Reset unsaved changes

              // Update the URL to use the actual note ID
              router.replace(`/note/${newNote.id}`);
            } else {
              throw new Error('Failed to create new note');
            }
          } else {
            // Note with specific ID not found
            throw new Error(`Note with ID ${noteId} not found`);
          }
        }
      } else {
        throw new Error('No note ID provided');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
      // Small delay to prevent editor initialization from triggering change detection
      setTimeout(() => {
        setIsInitializing(false);
      }, 500);
    }
  }, [noteId, router]);

  // Load note on mount
  useEffect(() => {
    loadNote();
  }, [loadNote]);

    // Check for unsaved changes whenever content or title changes
  useEffect(() => {
    if (!isInitializing && !isLoading) {
      const hasContentChanged = noteContent !== originalContent;
      const hasTitleChanged = noteTitle !== originalTitle;
      const shouldShowUnsaved = hasContentChanged || hasTitleChanged;

      if (__DEV__ && hasUnsavedChanges !== shouldShowUnsaved) {
        console.log('🔄 Unsaved changes state update:', {
          hasContentChanged,
          hasTitleChanged,
          shouldShowUnsaved,
          previousState: hasUnsavedChanges
        });
      }

      if (hasUnsavedChanges !== shouldShowUnsaved) {
        setHasUnsavedChanges(shouldShowUnsaved);
      }
    }
  }, [noteContent, noteTitle, originalContent, originalTitle, isInitializing, isLoading, hasUnsavedChanges]);

    // Handle content changes with auto-save
  const handleContentChange = useCallback((newContent: string): void => {
    setNoteContent(newContent);

    // Only trigger auto-save if we're not initializing and content actually changed
    if (!isInitializing && newContent !== originalContent && note) {
      noteService.updateContent(note.id, newContent);
    }
  }, [note, isInitializing, originalContent]);

  // Handle title changes with auto-save
  const handleTitleChange = useCallback((newTitle: string): void => {
    setNoteTitle(newTitle);

    // Only trigger auto-save if we're not initializing and title actually changed
    if (!isInitializing && newTitle !== originalTitle && note) {
      noteService.updateTitle(note.id, newTitle);
    }
  }, [note, isInitializing, originalTitle]);

  // Manual save
  const handleSave = useCallback(async (): Promise<void> => {
    if (!note || isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      const result = await noteService.saveNote({
        id: note.id,
        title: noteTitle || 'Untitled Note',
        content: noteContent || '<p></p>',
      });

      if (result.success) {
        setHasUnsavedChanges(false);
        // Update original values to reflect saved state
        setOriginalContent(noteContent);
        setOriginalTitle(noteTitle);
        if (__DEV__) {
          console.log('✅ Note saved manually');
        }
      } else {
        Alert.alert('Save Error', 'Failed to save note. Please try again.');
      }
    } catch (error) {
      Alert.alert('Save Error', 'An unexpected error occurred while saving.');
      if (__DEV__) {
        console.error('Save error:', error);
      }
    } finally {
      setIsSaving(false);
    }
  }, [note, noteTitle, noteContent, isSaving]);

  // Handle navigation away
  const handleBack = useCallback((): void => {
    if (hasUnsavedChanges) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. What would you like to do?',
        [
                    {
            text: 'Discard',
            style: 'destructive',
            onPress: async () => {
              if (__DEV__) {
                console.log('🗑️ User chose to discard changes');
              }

              // Set flag to prevent any saves during cleanup
              setShouldDiscardChanges(true);

              if (note) {
                try {
                  // Revert the note to its original state in the database
                  const revertResult = await noteService.revertNoteToOriginal(
                    note.id,
                    originalTitle,
                    originalContent
                  );

                  if (revertResult.success) {
                    if (__DEV__) {
                      console.log('✅ Successfully reverted note to original state');
                    }
                  } else {
                    if (__DEV__) {
                      console.error('❌ Failed to revert note:', revertResult.error);
                    }
                  }
                } catch (error) {
                  if (__DEV__) {
                    console.error('❌ Error reverting note:', error);
                  }
                }

                // Revert to original content in the UI
                setNoteContent(originalContent);
                setNoteTitle(originalTitle);
                setHasUnsavedChanges(false);
              }

              // Navigate back immediately
              router.back();
            },
          },
          {
            text: 'Save & Exit',
            onPress: async () => {
              if (__DEV__) {
                console.log('💾 User chose to save and exit');
              }
              await handleSave();
              router.back();
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } else {
      router.back();
    }
  }, [hasUnsavedChanges, note, handleSave, router, originalContent, originalTitle]);

  // Handle app state changes (save when going to background)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // Only save if user hasn't chosen to discard changes
        if (!shouldDiscardChanges) {
          if (__DEV__) {
            console.log('💾 Auto-saving due to app state change:', nextAppState);
          }
          noteService.saveAllPendingChanges();
        } else if (__DEV__) {
          console.log('🗑️ Skipping save on app state change - user chose to discard:', nextAppState);
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [shouldDiscardChanges]);

  // Handle focus/unfocus for saving
  useFocusEffect(
    useCallback(() => {
      return () => {
        // Save when leaving this screen (only if user hasn't chosen to discard)
        if (note && hasUnsavedChanges && !shouldDiscardChanges) {
          if (__DEV__) {
            console.log('💾 Auto-saving on screen unfocus');
          }
          noteService.saveAllPendingChanges();
        } else if (__DEV__) {
          console.log('🗑️ Skipping save on unfocus', {
            hasNote: !!note,
            hasUnsavedChanges,
            shouldDiscardChanges
          });
        }
      };
    }, [note, hasUnsavedChanges, shouldDiscardChanges])
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (__DEV__) {
        console.log('🧹 Component unmounting, cleaning up note service');
      }
      noteService.cleanup();
    };
  }, []);

  // Render loading state
  if (isLoading) {
    return <LoadingState />;
  }

  // Render error state
  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={loadNote}
        onBack={() => router.back()}
      />
    );
  }

  // Render main content
  return (
    <SafeAreaView className="flex-1 bg-gradient-to-br from-yellow-50 via-orange-50 to-yellow-100">
      <NoteHeader
        onBack={handleBack}
        onSave={handleSave}
        hasUnsavedChanges={hasUnsavedChanges}
        isSaving={isSaving}
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
            editable={!isSaving}
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
            editable={!isSaving}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}