import * as Crypto from "expo-crypto";
import * as SQLite from "expo-sqlite";
import {
  CreateNoteParams,
  DatabaseError,
  DatabaseResult,
  Note,
  NoteRow,
  SearchNotesParams,
  transformNoteRowToNote,
  transformNoteToNoteRow,
  UpdateNoteParams,
} from "../models/Note";

// Database initialization
let db: SQLite.SQLiteDatabase | null = null;
let isInitializing = false;

export const initializeDatabase = async (): Promise<
  DatabaseResult<boolean>
> => {
  // Prevent multiple simultaneous initializations
  if (isInitializing) {
    while (isInitializing) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return db
      ? { success: true, data: true }
      : {
          success: false,
          error: {
            code: "DB_INIT_ERROR",
            message: "Database initialization failed",
          },
        };
  }

  // Return early if already initialized
  if (db) {
    return { success: true, data: true };
  }

  isInitializing = true;

  try {
    console.log("🔧 Initializing SQLite database...");

    // Open database
    db = await SQLite.openDatabaseAsync("inky_notes.db");
    console.log("✅ Database opened successfully");

    // Enable WAL mode for better performance
    await db.execAsync("PRAGMA journal_mode = WAL;");
    console.log("✅ WAL mode enabled");

    // Check existing table structure first
    const tableInfo = await db.getAllAsync<{ name: string; type: string }>(
      "PRAGMA table_info(notes);"
    );

    if (tableInfo.length > 0) {
      console.log(
        "📋 Found existing table with columns:",
        tableInfo.map((col) => col.name)
      );

      // Add missing columns to existing table if needed
      const existingColumns = tableInfo.map((col) => col.name);

      if (!existingColumns.includes("plain_text")) {
        console.log("🔧 Adding plain_text column...");
        await db.execAsync(
          "ALTER TABLE notes ADD COLUMN plain_text TEXT DEFAULT '';"
        );
      }

      if (!existingColumns.includes("is_deleted")) {
        console.log("🔧 Adding is_deleted column...");
        await db.execAsync(
          "ALTER TABLE notes ADD COLUMN is_deleted INTEGER DEFAULT 0;"
        );
      }

      if (!existingColumns.includes("metadata")) {
        console.log("🔧 Adding metadata column...");
        await db.execAsync(
          "ALTER TABLE notes ADD COLUMN metadata TEXT DEFAULT '{}';"
        );
      }

      console.log("✅ Table structure updated");
    } else {
      // Create new table with our schema
      await db.execAsync(`
        CREATE TABLE notes (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          plain_text TEXT NOT NULL DEFAULT '',
          word_count INTEGER DEFAULT 0,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          folder_id TEXT,
          tags TEXT,
          reading_time INTEGER DEFAULT 1,
          last_edit_position INTEGER DEFAULT 0,
          is_pinned INTEGER DEFAULT 0,
          is_favorite INTEGER DEFAULT 0,
          is_deleted INTEGER DEFAULT 0,
          metadata TEXT DEFAULT '{}'
        );
      `);
      console.log("✅ New notes table created");
    }

    // Create indexes for existing column names
    try {
      await db.execAsync(
        "CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at);"
      );
      console.log("✅ Index idx_notes_updated_at created");
    } catch (error) {
      console.error("❌ Failed to create idx_notes_updated_at:", error);
    }

    try {
      await db.execAsync(
        "CREATE INDEX IF NOT EXISTS idx_notes_is_deleted ON notes(is_deleted);"
      );
      console.log("✅ Index idx_notes_is_deleted created");
    } catch (error) {
      console.error("❌ Failed to create idx_notes_is_deleted:", error);
    }

    try {
      await db.execAsync(
        "CREATE INDEX IF NOT EXISTS idx_notes_folder_id ON notes(folder_id);"
      );
      console.log("✅ Index idx_notes_folder_id created");
    } catch (error) {
      console.error("❌ Failed to create idx_notes_folder_id:", error);
    }

    try {
      await db.execAsync(
        "CREATE INDEX IF NOT EXISTS idx_notes_plain_text ON notes(plain_text);"
      );
      console.log("✅ Index idx_notes_plain_text created");
    } catch (error) {
      console.error("❌ Failed to create idx_notes_plain_text:", error);
    }

    console.log("✅ All database indexes created");

    // Test database functionality
    const testResult = await db.getFirstAsync<{ version: string }>(
      "SELECT sqlite_version() as version"
    );
    console.log(
      `✅ Database test successful - SQLite version: ${testResult?.version}`
    );

    isInitializing = false;
    return { success: true, data: true };
  } catch (error) {
    console.error("❌ Database initialization failed:", error);

    // Reset state on failure
    db = null;
    isInitializing = false;

    const dbError: DatabaseError = {
      code: "DB_INIT_ERROR",
      message: "Failed to initialize database",
      details: {
        error: String(error),
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined,
      },
    };
    return { success: false, error: dbError };
  }
};

// Ensure database is ready before operations
const ensureDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!db) {
    const result = await initializeDatabase();
    if (!result.success) {
      throw new Error(
        `Database initialization failed: ${result.error?.message}`
      );
    }
  }
  return db!;
};

// Utility function to extract plain text from HTML
const extractPlainText = (html: string): string => {
  return html
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/&nbsp;/g, " ") // Replace &nbsp; with space
    .replace(/&[a-zA-Z0-9#]+;/g, "") // Remove other HTML entities
    .trim();
};

// Calculate word count from plain text
const calculateWordCount = (text: string): number => {
  return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
};

// Calculate reading time (average 200 words per minute)
const calculateReadingTime = (wordCount: number): number => {
  return Math.max(1, Math.ceil(wordCount / 200));
};

// Create a new note
export const createNote = async (
  params: CreateNoteParams
): Promise<DatabaseResult<Note>> => {
  try {
    const database = await ensureDatabase();

    const now = new Date().toISOString();
    const plainText = extractPlainText(params.content);
    const wordCount = calculateWordCount(plainText);
    const readingTime = calculateReadingTime(wordCount);

    // Generate UUID for note ID
    const noteId = await Crypto.randomUUID();

    const note: Note = {
      id: noteId,
      title: params.title || "Untitled Note",
      content: params.content,
      plainText,
      wordCount,
      dateCreated: now,
      lastModified: now,
      folderId: params.folderId || null,
      tags: params.tags || [],
      isPinned: false,
      isDeleted: false,
      metadata: {
        readingTime,
        lastEditPosition: 0,
        characterCount: params.content.length,
        version: 1,
      },
    };

    const noteRow = transformNoteToNoteRow(note);

    await database.runAsync(
      `INSERT INTO notes (
        id, title, content, plain_text, word_count,
        created_at, updated_at, folder_id, tags,
        reading_time, last_edit_position, is_pinned,
        is_favorite, is_deleted, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        noteRow.id!,
        noteRow.title!,
        noteRow.content!,
        noteRow.plain_text!,
        noteRow.word_count!,
        noteRow.created_at!,
        noteRow.updated_at!,
        noteRow.folder_id || null,
        noteRow.tags || null,
        noteRow.reading_time || 1,
        noteRow.last_edit_position || 0,
        noteRow.is_pinned!,
        noteRow.is_favorite || 0,
        noteRow.is_deleted || 0,
        noteRow.metadata || null,
      ]
    );

    console.log("✅ Note created successfully:", noteId);
    return { success: true, data: note };
  } catch (error) {
    console.error("❌ Failed to create note:", error);
    const dbError: DatabaseError = {
      code: "CREATE_NOTE_ERROR",
      message: "Failed to create note",
      details: { error: String(error), params },
    };
    return { success: false, error: dbError };
  }
};

// Update an existing note
export const updateNote = async (
  params: UpdateNoteParams
): Promise<DatabaseResult<Note>> => {
  try {
    const database = await ensureDatabase();

    // First, get the existing note
    const existingResult = await getNoteById(params.id);
    if (!existingResult.success || !existingResult.data) {
      return {
        success: false,
        error: { code: "NOTE_NOT_FOUND", message: "Note not found" },
      };
    }

    const existingNote = existingResult.data;
    const now = new Date().toISOString();

    // Update only provided fields
    const updatedNote: Note = {
      ...existingNote,
      title: params.title !== undefined ? params.title : existingNote.title,
      content:
        params.content !== undefined ? params.content : existingNote.content,
      folderId:
        params.folderId !== undefined ? params.folderId : existingNote.folderId,
      tags: params.tags !== undefined ? params.tags : existingNote.tags,
      isPinned:
        params.isPinned !== undefined ? params.isPinned : existingNote.isPinned,
      isDeleted:
        params.isDeleted !== undefined
          ? params.isDeleted
          : existingNote.isDeleted,
      lastModified: now,
    };

    // Recalculate derived fields if content changed
    if (params.content !== undefined) {
      updatedNote.plainText = extractPlainText(params.content);
      updatedNote.wordCount = calculateWordCount(updatedNote.plainText);
      updatedNote.metadata = {
        ...updatedNote.metadata,
        readingTime: calculateReadingTime(updatedNote.wordCount),
        characterCount: params.content.length,
        version: updatedNote.metadata.version + 1,
      };
    }

    const noteRow = transformNoteToNoteRow(updatedNote);

    await database.runAsync(
      `UPDATE notes SET
        title = ?, content = ?, plain_text = ?, word_count = ?,
        updated_at = ?, folder_id = ?, tags = ?,
        reading_time = ?, last_edit_position = ?, is_pinned = ?,
        is_favorite = ?, is_deleted = ?, metadata = ?
      WHERE id = ?`,
      [
        noteRow.title!,
        noteRow.content!,
        noteRow.plain_text!,
        noteRow.word_count!,
        noteRow.updated_at!,
        noteRow.folder_id || null,
        noteRow.tags || null,
        noteRow.reading_time || 1,
        noteRow.last_edit_position || 0,
        noteRow.is_pinned!,
        noteRow.is_favorite || 0,
        noteRow.is_deleted || 0,
        noteRow.metadata || null,
        params.id,
      ]
    );

    return { success: true, data: updatedNote };
  } catch (error) {
    console.error("❌ Failed to update note:", error);
    const dbError: DatabaseError = {
      code: "UPDATE_NOTE_ERROR",
      message: "Failed to update note",
      details: { error: String(error), params },
    };
    return { success: false, error: dbError };
  }
};

// Get note by ID
export const getNoteById = async (
  id: string
): Promise<DatabaseResult<Note>> => {
  try {
    const database = await ensureDatabase();

    const result = await database.getFirstAsync<NoteRow>(
      "SELECT * FROM notes WHERE id = ? AND is_deleted = 0",
      [id]
    );

    if (!result) {
      return {
        success: false,
        error: { code: "NOTE_NOT_FOUND", message: "Note not found" },
      };
    }

    const note = transformNoteRowToNote(result);
    return { success: true, data: note };
  } catch (error) {
    console.error("❌ Failed to get note:", error);
    const dbError: DatabaseError = {
      code: "GET_NOTE_ERROR",
      message: "Failed to get note",
      details: { error: String(error), id },
    };
    return { success: false, error: dbError };
  }
};

// Get all notes with optional search and filtering
export const searchNotes = async (
  params: SearchNotesParams = {}
): Promise<DatabaseResult<Note[]>> => {
  try {
    const database = await ensureDatabase();

    const {
      query,
      folderId,
      tags = [],
      includeDeleted = false,
      sortBy = "lastModified",
      sortOrder = "desc",
      limit = 100,
      offset = 0,
    } = params;

    let sql = "SELECT * FROM notes WHERE 1=1";
    const sqlParams: (string | number)[] = [];

    // Filter by deleted status
    if (!includeDeleted) {
      sql += " AND is_deleted = 0";
    }

    // Filter by folder
    if (folderId !== undefined) {
      if (folderId === null) {
        sql += " AND folder_id IS NULL";
      } else {
        sql += " AND folder_id = ?";
        sqlParams.push(folderId);
      }
    }

    // Search in title and content
    if (query) {
      sql += " AND (title LIKE ? OR plain_text LIKE ?)";
      const searchTerm = `%${query}%`;
      sqlParams.push(searchTerm, searchTerm);
    }

    // Filter by tags (simplified - could be enhanced)
    if (tags.length > 0) {
      const tagConditions = tags.map(() => "tags LIKE ?").join(" AND ");
      sql += ` AND (${tagConditions})`;
      tags.forEach((tag) => sqlParams.push(`%"${tag}"%`));
    }

    // Sorting
    const sortColumn =
      sortBy === "lastModified"
        ? "updated_at"
        : sortBy === "dateCreated"
          ? "created_at"
          : "title";
    sql += ` ORDER BY ${sortColumn} ${sortOrder.toUpperCase()}`;

    // Pagination
    sql += " LIMIT ? OFFSET ?";
    sqlParams.push(limit, offset);

    const results = await database.getAllAsync<NoteRow>(sql, sqlParams);
    const notes = results.map(transformNoteRowToNote);

    return { success: true, data: notes };
  } catch (error) {
    console.error("❌ Failed to search notes:", error);
    const dbError: DatabaseError = {
      code: "SEARCH_NOTES_ERROR",
      message: "Failed to search notes",
      details: { error: String(error), params },
    };
    return { success: false, error: dbError };
  }
};

// Delete note (soft delete)
export const deleteNote = async (
  id: string
): Promise<DatabaseResult<boolean>> => {
  try {
    const database = await ensureDatabase();

    await database.runAsync(
      "UPDATE notes SET is_deleted = 1, updated_at = ? WHERE id = ?",
      [new Date().toISOString(), id]
    );

    return { success: true, data: true };
  } catch (error) {
    console.error("❌ Failed to delete note:", error);
    const dbError: DatabaseError = {
      code: "DELETE_NOTE_ERROR",
      message: "Failed to delete note",
      details: { error: String(error), id },
    };
    return { success: false, error: dbError };
  }
};

// Permanently delete note
export const permanentlyDeleteNote = async (
  id: string
): Promise<DatabaseResult<boolean>> => {
  try {
    const database = await ensureDatabase();

    await database.runAsync("DELETE FROM notes WHERE id = ?", [id]);
    return { success: true, data: true };
  } catch (error) {
    console.error("❌ Failed to permanently delete note:", error);
    const dbError: DatabaseError = {
      code: "PERMANENT_DELETE_ERROR",
      message: "Failed to permanently delete note",
      details: { error: String(error), id },
    };
    return { success: false, error: dbError };
  }
};
