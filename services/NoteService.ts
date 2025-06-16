import {
  CreateNoteParams,
  DatabaseResult,
  Note,
  SearchNotesParams,
  UpdateNoteParams,
} from "../database/models/Note";
import {
  createNote,
  deleteNote,
  getNoteById,
  initializeDatabase,
  searchNotes,
  updateNote,
} from "../database/queries/noteQueries";

// Auto-save configuration
interface AutoSaveConfig {
  enabled: boolean;
  debounceMs: number;
  maxRetries: number;
}

// Note service class for business logic
export class NoteService {
  private autoSaveConfig: AutoSaveConfig = {
    enabled: true,
    debounceMs: 1000, // Auto-save after 1 second of inactivity
    maxRetries: 3,
  };

  private autoSaveTimers: Map<string, NodeJS.Timeout> = new Map();
  private pendingChanges: Map<string, Partial<UpdateNoteParams>> = new Map();

  constructor(config?: Partial<AutoSaveConfig>) {
    if (config) {
      this.autoSaveConfig = { ...this.autoSaveConfig, ...config };
    }
  }

  // Initialize the database
  async initialize(): Promise<DatabaseResult<boolean>> {
    try {
      console.log("🔧 NoteService: Starting database initialization...");
      const result = await initializeDatabase();

      if (result.success) {
        console.log("✅ NoteService: Database initialized successfully");
      } else {
        console.error(
          "❌ NoteService: Database initialization failed:",
          result.error
        );
      }

      return result;
    } catch (error) {
      console.error(
        "❌ NoteService: Unexpected error during initialization:",
        error
      );
      return {
        success: false,
        error: {
          code: "SERVICE_INIT_ERROR",
          message: "Unexpected error during database initialization",
          details: { error: String(error) },
        },
      };
    }
  }

  // Create a new note
  async createNewNote(params: CreateNoteParams): Promise<DatabaseResult<Note>> {
    try {
      const result = await createNote({
        title: params.title || "Untitled Note",
        content: params.content || "<p></p>",
        folderId: params.folderId,
        tags: params.tags || [],
      });

      if (result.success && __DEV__) {
        console.log("✅ Note created successfully:", result.data?.id);
      }

      return result;
    } catch (error) {
      if (__DEV__) {
        console.error("❌ Failed to create note:", error);
      }
      return {
        success: false,
        error: {
          code: "CREATE_NOTE_SERVICE_ERROR",
          message: "Failed to create note in service",
          details: { error: String(error) },
        },
      };
    }
  }

  // Get note by ID
  async getNote(id: string): Promise<DatabaseResult<Note>> {
    try {
      const result = await getNoteById(id);

      if (result.success && __DEV__) {
        console.log("✅ Note retrieved successfully:", id);
      }

      return result;
    } catch (error) {
      if (__DEV__) {
        console.error("❌ Failed to get note:", error);
      }
      return {
        success: false,
        error: {
          code: "GET_NOTE_SERVICE_ERROR",
          message: "Failed to get note in service",
          details: { error: String(error), id },
        },
      };
    }
  }

  // Search notes
  async searchNotes(
    params?: SearchNotesParams
  ): Promise<DatabaseResult<Note[]>> {
    try {
      const result = await searchNotes(params);

      if (result.success && __DEV__) {
        console.log(
          "✅ Notes search completed:",
          result.data?.length,
          "results"
        );
      }

      return result;
    } catch (error) {
      if (__DEV__) {
        console.error("❌ Failed to search notes:", error);
      }
      return {
        success: false,
        error: {
          code: "SEARCH_NOTES_SERVICE_ERROR",
          message: "Failed to search notes in service",
          details: { error: String(error), params },
        },
      };
    }
  }

  // Immediate save (for explicit save actions)
  async saveNote(params: UpdateNoteParams): Promise<DatabaseResult<Note>> {
    try {
      // Cancel any pending auto-save for this note
      this.cancelAutoSave(params.id);

      const result = await updateNote(params);

      if (result.success && __DEV__) {
        console.log("✅ Note saved successfully:", params.id);
      }

      return result;
    } catch (error) {
      if (__DEV__) {
        console.error("❌ Failed to save note:", error);
      }
      return {
        success: false,
        error: {
          code: "SAVE_NOTE_SERVICE_ERROR",
          message: "Failed to save note in service",
          details: { error: String(error), params },
        },
      };
    }
  }

  // Auto-save with debouncing
  scheduleAutoSave(params: UpdateNoteParams): void {
    if (!this.autoSaveConfig.enabled) {
      return;
    }

    // Cancel existing timer for this note
    this.cancelAutoSave(params.id);

    // Store pending changes
    const existingChanges = this.pendingChanges.get(params.id) || {};
    this.pendingChanges.set(params.id, { ...existingChanges, ...params });

    // Schedule new auto-save
    const timer = setTimeout(async () => {
      await this.executeAutoSave(params.id);
    }, this.autoSaveConfig.debounceMs);

    this.autoSaveTimers.set(params.id, timer);

    if (__DEV__) {
      console.log("📝 Auto-save scheduled for note:", params.id);
    }
  }

  // Execute auto-save for a specific note
  private async executeAutoSave(noteId: string): Promise<void> {
    const changes = this.pendingChanges.get(noteId);
    if (!changes) {
      return;
    }

    try {
      const result = await updateNote(changes as UpdateNoteParams);

      if (result.success) {
        this.pendingChanges.delete(noteId);
        if (__DEV__) {
          console.log("✅ Auto-save completed for note:", noteId);
        }
      } else {
        if (__DEV__) {
          console.error("❌ Auto-save failed for note:", noteId, result.error);
        }
        // Could implement retry logic here
      }
    } catch (error) {
      if (__DEV__) {
        console.error("❌ Auto-save error for note:", noteId, error);
      }
    } finally {
      this.autoSaveTimers.delete(noteId);
    }
  }

  // Cancel auto-save for a specific note
  cancelAutoSave(noteId: string): void {
    const timer = this.autoSaveTimers.get(noteId);
    if (timer) {
      clearTimeout(timer);
      this.autoSaveTimers.delete(noteId);
      if (__DEV__) {
        console.log("🚫 Auto-save cancelled for note:", noteId);
      }
    }
  }

  // Force save all pending changes (called when app goes to background)
  async saveAllPendingChanges(): Promise<void> {
    const pendingNoteIds = Array.from(this.pendingChanges.keys());

    if (pendingNoteIds.length === 0) {
      return;
    }

    if (__DEV__) {
      console.log("💾 Saving all pending changes for notes:", pendingNoteIds);
    }

    // Cancel all timers and save immediately
    for (const noteId of pendingNoteIds) {
      this.cancelAutoSave(noteId);
      await this.executeAutoSave(noteId);
    }
  }

  // Delete note
  async deleteNote(id: string): Promise<DatabaseResult<boolean>> {
    try {
      // Cancel any pending auto-save
      this.cancelAutoSave(id);
      this.pendingChanges.delete(id);

      const result = await deleteNote(id);

      if (result.success && __DEV__) {
        console.log("✅ Note deleted successfully:", id);
      }

      return result;
    } catch (error) {
      if (__DEV__) {
        console.error("❌ Failed to delete note:", error);
      }
      return {
        success: false,
        error: {
          code: "DELETE_NOTE_SERVICE_ERROR",
          message: "Failed to delete note in service",
          details: { error: String(error), id },
        },
      };
    }
  }

  // Update title with auto-save
  updateTitle(noteId: string, title: string): void {
    this.scheduleAutoSave({
      id: noteId,
      title: title || "Untitled Note",
    });
  }

  // Update content with auto-save
  updateContent(noteId: string, content: string): void {
    this.scheduleAutoSave({
      id: noteId,
      content: content || "<p></p>",
    });
  }

  // Check if note has pending changes
  hasPendingChanges(noteId: string): boolean {
    return this.pendingChanges.has(noteId);
  }

  // Clean up resources
  cleanup(): void {
    // Cancel all timers
    for (const [noteId, timer] of this.autoSaveTimers.entries()) {
      clearTimeout(timer);
      if (__DEV__) {
        console.log("🧹 Cleaned up auto-save timer for note:", noteId);
      }
    }

    this.autoSaveTimers.clear();
    this.pendingChanges.clear();
  }
}

// Singleton instance
export const noteService = new NoteService();

// Export default instance
export default noteService;
