// Note model interface following Inky Notes standards
export interface Note {
  id: string;
  title: string;
  content: string; // TipTap HTML content
  plainText: string; // Extracted plain text for search
  wordCount: number;
  dateCreated: string; // ISO date string
  lastModified: string; // ISO date string
  folderId: string | null; // For future folder organization
  tags: string[]; // JSON array of tags
  isPinned: boolean;
  isDeleted: boolean;
  metadata: NoteMetadata;
}

export interface NoteMetadata {
  readingTime: number; // Estimated reading time in minutes
  lastEditPosition: number; // Cursor position for restoration
  characterCount: number;
  version: number; // For future sync capabilities
}

// Database row interface (how data is stored in SQLite)
export interface NoteRow {
  id: string;
  title: string;
  content: string;
  plain_text?: string; // Optional for backwards compatibility
  word_count: number;
  created_at: string; // Using existing column name
  updated_at: string; // Using existing column name
  folder_id: string | null;
  tags: string; // JSON string
  reading_time?: number; // Optional, exists in current schema
  last_edit_position?: number; // Optional, exists in current schema
  is_pinned: number; // SQLite boolean (0/1)
  is_favorite?: number; // Optional, exists in current schema
  is_deleted?: number; // SQLite boolean (0/1) - may not exist yet
  metadata?: string; // JSON string - may not exist yet
}

// Create note parameters
export interface CreateNoteParams {
  title: string;
  content: string;
  folderId?: string | null;
  tags?: string[];
}

// Update note parameters
export interface UpdateNoteParams {
  id: string;
  title?: string;
  content?: string;
  folderId?: string | null;
  tags?: string[];
  isPinned?: boolean;
  isDeleted?: boolean;
}

// Database operation result
export interface DatabaseResult<T> {
  success: boolean;
  data?: T;
  error?: DatabaseError;
}

export interface DatabaseError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// Search parameters
export interface SearchNotesParams {
  query?: string;
  folderId?: string | null;
  tags?: string[];
  includeDeleted?: boolean;
  sortBy?: "lastModified" | "dateCreated" | "title";
  sortOrder?: "asc" | "desc";
  limit?: number;
  offset?: number;
}

// Utility functions for data transformation
export const transformNoteRowToNote = (row: NoteRow): Note => {
  try {
    const tags = row.tags ? JSON.parse(row.tags) : [];

    // Handle metadata - either from metadata column or construct from individual columns
    let metadata: NoteMetadata;
    if (row.metadata) {
      metadata = JSON.parse(row.metadata);
    } else {
      // Construct from individual columns for backwards compatibility
      metadata = {
        readingTime: row.reading_time || 1,
        lastEditPosition: row.last_edit_position || 0,
        characterCount: row.content.length,
        version: 1,
      };
    }

    return {
      id: row.id,
      title: row.title,
      content: row.content,
      plainText: row.plain_text || row.content.replace(/<[^>]*>/g, "").trim(),
      wordCount: row.word_count,
      dateCreated: row.created_at,
      lastModified: row.updated_at,
      folderId: row.folder_id,
      tags,
      isPinned: Boolean(row.is_pinned),
      isDeleted: Boolean(row.is_deleted || 0),
      metadata,
    };
  } catch (error) {
    throw new Error(`Failed to transform note row: ${error}`);
  }
};

export const transformNoteToNoteRow = (
  note: Partial<Note>
): Partial<NoteRow> => {
  try {
    return {
      id: note.id,
      title: note.title,
      content: note.content,
      plain_text: note.plainText,
      word_count: note.wordCount,
      created_at: note.dateCreated,
      updated_at: note.lastModified,
      folder_id: note.folderId,
      tags: note.tags ? JSON.stringify(note.tags) : undefined,
      reading_time: note.metadata?.readingTime,
      last_edit_position: note.metadata?.lastEditPosition,
      is_pinned: note.isPinned ? 1 : 0,
      is_favorite: 0, // Default for backwards compatibility
      is_deleted: note.isDeleted ? 1 : 0,
      metadata: note.metadata ? JSON.stringify(note.metadata) : undefined,
    };
  } catch (error) {
    throw new Error(`Failed to transform note: ${error}`);
  }
};
