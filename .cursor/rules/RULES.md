# Inky Notes - Expo + Tiptap Development Rules

## Project Overview

**Inky Notes** is an **offline-first note-taking application** built with Expo, targeting iOS and Android native platforms. The app uses Tiptap for rich text editing through DOM components and expo-sqlite for data persistence.

**App Identity**: "Your offline-first note-taking companion"

## Architecture Decisions

### 1. Tiptap Integration via DOM Components

- **Technology**: Tiptap (web-based rich text editor)
- **Integration Method**: Expo DOM Components (`expo/dom`)
- **Rationale**: Since Tiptap is a web technology and we're building native iOS/Android apps, we use Expo's DOM components to embed web views that can run Tiptap
- **Target Platforms**: iOS and Android only (no web support needed)

### 2. Data Persistence

- **Primary Database**: `expo-sqlite`
- **Strategy**: Offline-first architecture
- **Data Flow**: All data must be stored locally first, with potential sync capabilities later

## Design System Standards

### Color Palette (MANDATORY)

```typescript
// Primary Colors - Orange Theme
const colors = {
  primary: '#f97316',        // Orange primary
  primaryLight: '#fb923c',   // Orange light
  primaryDark: '#ea580c',    // Orange dark
  primaryHover: '#fed7aa',   // Orange hover/border

  // Neutral Colors
  background: '#ffffff',     // Background white
  textPrimary: '#111827',    // Primary text
  textSecondary: '#6b7280',  // Secondary text
  textMuted: '#9ca3af',      // Muted text
  border: '#fed7aa',         // Border color

  // State Colors
  success: '#10b981',        // Success green
  error: '#ef4444',          // Error red
  warning: '#f59e0b',        // Warning amber
} as const;

// Background Gradients
const gradients = {
  pageBackground: 'linear-gradient(135deg, #fffbeb, #fff7ed, #fefce8)',
  glassBackground: 'rgba(255, 255, 255, 0.8)',
} as const;
```

### Typography Scale

```typescript
// Font Sizes (use these Tailwind classes)
const typography = {
  mainTitle: 'text-4xl font-bold',      // 36px, H1 titles
  noteTitle: 'text-lg font-semibold',   // 18px, Note titles
  bodyText: 'text-sm',                  // 14px, Body content
  smallText: 'text-xs',                 // 12px, Metadata/timestamps
} as const;
```

### Spacing & Layout Standards

```typescript
// Standardized spacing (use these values)
const spacing = {
  elementGap: 'gap-1.5',      // 6px between elements
  sectionGap: 'gap-6',        // 24px between sections
  cardPadding: 'p-6',         // 24px card padding
  buttonPadding: 'px-4 py-2', // 8px vertical, 16px horizontal
} as const;

// Border Radius Standards
const borderRadius = {
  cards: 'rounded-lg',         // 8px for cards
  buttons: 'rounded-md',       // 6px for buttons
  smallButtons: 'rounded',     // 4px for small buttons
  sections: 'rounded-xl',      // 12px for sections
} as const;
```

## Development Guidelines

### TypeScript Standards (STRICT)

- **MANDATORY**: Use TypeScript for ALL code - JavaScript files are NOT allowed
- **NO ANY TYPES**: The `any` type is strictly forbidden - always provide proper type definitions
- **Type Safety**: Enable strict mode with `noImplicitAny`, `strictNullChecks`, and `strictFunctionTypes`
- **Explicit Typing**: Every function parameter, return type, and variable must have explicit types
- **Interface/Type Definitions**: Create comprehensive interfaces for all data structures
- **Generic Constraints**: Use proper generic constraints instead of `any` for flexible typing
- Follow React Native best practices for component architecture
- Implement proper error boundaries and loading states
- Use React hooks pattern consistently

### Styling Standards

- **Primary Styling**: NativeWind (Tailwind CSS for React Native)
- **Philosophy**: Utility-first CSS approach adapted for React Native
- **Design System**: Follow the comprehensive Inky Notes design system specifications
- **Benefits**: Consistent styling across components, responsive design utilities, better developer experience
- **Usage**: Apply Tailwind classes directly to React Native components using NativeWind

### Inky Notes Design System Requirements

- **Color Palette**: Use only specified orange-based primary colors and neutral grays
- **Typography**: Follow defined text scales and font weights
- **Component Library**: Implement all UI components according to design specifications
- **Spacing & Layout**: Adhere to standardized spacing and border radius values
- **Animations**: Use consistent 200ms ease-out transitions

### DOM Components Implementation

```typescript
// Example structure for Tiptap DOM component with proper typing
import { DOMView } from 'expo/dom';
import { View } from 'react-native';

interface TiptapEditorProps {
  initialContent?: string;
  onContentChange: (content: string) => void;
  placeholder?: string;
  readonly?: boolean;
}

interface TiptapMessage {
  type: 'content-updated' | 'editor-ready' | 'error';
  payload: string;
}

const TiptapEditor: React.FC<TiptapEditorProps> = ({
  initialContent = '',
  onContentChange,
  placeholder,
  readonly = false
}) => {
  const handleMessage = (event: { data: TiptapMessage }): void => {
    const { type, payload } = event.data;

    switch (type) {
      case 'content-updated':
        onContentChange(payload);
        break;
      case 'error':
        console.error('Tiptap error:', payload);
        break;
    }
  };

  return (
    <View className="flex-1 bg-white rounded-lg shadow-sm">
      <DOMView
        className="h-full w-full"
        source={{ uri: 'path/to/tiptap-editor.html' }}
        onMessage={handleMessage}
      />
    </View>
  );
};
```

### Data Layer Rules

- **Primary Storage**: All notes and user data must be stored in expo-sqlite
- **Offline Priority**: App must function completely without internet connection
- **Strict Typing**: Define TypeScript interfaces for all database models and operations
- **Data Schema**: Design normalized database schema for notes, folders, tags, and metadata
- **Type Safety**: Use typed query builders or properly typed raw SQL operations
- **Sync Preparation**: Structure data models to support future synchronization features

```typescript
// Example of proper data model typing
interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  folderId: string | null;
  tags: string[];
  metadata: NoteMetadata;
}

interface NoteMetadata {
  wordCount: number;
  readingTime: number;
  lastEditPosition?: number;
}

interface DatabaseResult<T> {
  success: boolean;
  data?: T;
  error?: DatabaseError;
}

type DatabaseError = {
  code: string;
  message: string;
  details?: Record<string, unknown>;
};
```

### File Structure Conventions

```
src/
├── components/
│   ├── editor/          # Tiptap DOM component wrappers
│   ├── notes/           # Note-related UI components
│   └── common/          # Shared UI components
├── database/
│   ├── migrations/      # SQLite migration files
│   ├── models/          # Data models and schemas
│   └── queries/         # Database query functions
├── dom/                 # DOM component HTML/JS files for Tiptap
├── hooks/               # Custom React hooks
├── services/            # Business logic and data services
├── types/               # TypeScript type definitions
└── utils/               # Helper functions
```

## Technical Constraints

### Platform Limitations

- No web browser support (mobile-only)
- Must work on iOS and Android without internet
- Performance considerations for DOM component integration

### Dependencies Management

- Keep DOM component bundle size minimal
- Ensure Tiptap extensions are compatible with mobile webview
- Use expo-sqlite for all persistent storage needs
- Configure NativeWind properly with Expo and ensure Tailwind classes work with DOM components

### Performance Requirements

- Editor must be responsive on mobile devices
- Database operations should be optimized for mobile
- Minimize DOM component re-renders

## Code Patterns

### Styling with NativeWind (Following Inky Design System)

```typescript
// Note Card Component - Following design system exactly
interface NoteCardProps {
  title: string;
  content: string;
  modifiedDate: string;
  onPress: () => void;
  onDelete: () => void;
  isSelected?: boolean;
}

const NoteCard: React.FC<NoteCardProps> = ({
  title,
  content,
  modifiedDate,
  onPress,
  onDelete,
  isSelected = false
}) => (
  <TouchableOpacity
    onPress={onPress}
    className={`
      bg-white/80 backdrop-blur-md
      border border-orange-200
      rounded-lg p-6 m-2
      shadow-sm
      transition-all duration-200 ease-out
      active:scale-[1.02]
      min-h-[200px]
      ${isSelected ? 'border-orange-300 shadow-lg' : 'border-orange-200'}
    `}
  >
    <View className="flex-row justify-between items-start mb-4">
      <View className="flex-1">
        <Text className="text-lg font-semibold text-gray-900 mb-1">
          {title}
        </Text>
        <Text className="text-xs text-gray-500">
          Modified {modifiedDate}
        </Text>
      </View>
      <TouchableOpacity
        onPress={onDelete}
        className="w-6 h-6 bg-red-500 rounded items-center justify-center opacity-0 active:opacity-100"
      >
        <Text className="text-white text-sm font-bold">×</Text>
      </TouchableOpacity>
    </View>
    <Text className="text-sm text-gray-600 leading-relaxed" numberOfLines={4}>
      {content}
    </Text>
  </TouchableOpacity>
);

// Primary Button - Following design system
interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  icon?: string;
  disabled?: boolean;
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  onPress,
  icon,
  disabled = false
}) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    className={`
      bg-orange-500 px-4 py-2 rounded-md
      flex-row items-center gap-2
      transition-all duration-200 ease-out
      ${disabled ? 'opacity-50' : 'active:bg-orange-600'}
    `}
  >
    {icon && <Text className="text-white font-medium">{icon}</Text>}
    <Text className="text-white font-medium">{title}</Text>
  </TouchableOpacity>
);

// Search Input - Following design system
interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChangeText,
  placeholder = "Search notes..."
}) => (
  <View className="relative max-w-sm">
    <Text className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10">
      🔍
    </Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      className="
        w-full pl-10 pr-4 py-3
        bg-white/80 backdrop-blur-md
        border border-orange-200 rounded-lg
        text-sm
        focus:border-orange-400 focus:ring-2 focus:ring-orange-200
      "
    />
  </View>
);

// Page Header - Following design system
interface PageHeaderProps {
  children: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ children }) => (
  <View className="bg-gradient-to-br from-yellow-50 via-orange-50 to-yellow-100 p-8 rounded-lg mb-8">
    {children}
  </View>
);
```

## Required UI Components

### Core Components (Must Implement)

1. **NoteCard**: Glass morphism card with hover effects, delete button, proper typography
2. **PrimaryButton**: Orange themed with icon support
3. **GhostButton**: Transparent with gray text
4. **SearchInput**: With search icon, glass background, orange focus states
5. **ToolbarButton**: 32x32px square buttons for editor toolbar
6. **PageHeader**: Gradient background with app title and controls
7. **EditorToolbar**: Rich text formatting controls with separators

### Layout Components

1. **NotesGrid**: Responsive grid layout for note cards
2. **EditorLayout**: Centered layout with sticky header
3. **ResponsiveContainer**: Main app container with proper spacing

### Page Layouts to Implement

1. **Home Page**: Notes list with header, search, and grid
2. **Editor Page**: Note editing with toolbar and content area

### Database Operations

```typescript
// Always use proper typing for database operations
interface CreateNoteParams {
  title: string;
  content: string;
  folderId?: string;
  tags?: string[];
}

interface UpdateNoteParams extends Partial<CreateNoteParams> {
  id: string;
  updatedAt: Date;
}

class NoteService {
  async createNote(params: CreateNoteParams): Promise<DatabaseResult<Note>> {
    // Implementation with proper error handling and typing
  }

  async updateNote(params: UpdateNoteParams): Promise<DatabaseResult<Note>> {
    // Implementation with transactions and type safety
  }

  async getNotes(folderId?: string): Promise<DatabaseResult<Note[]>> {
    // Implementation with proper query typing
  }
}

// Use transactions for related operations
// Implement proper error handling with typed errors
// Use prepared statements for repeated queries
```

### DOM Component Communication

```typescript
// Use properly typed postMessage for React Native <-> DOM communication
interface EditorMessage {
  type: 'get-content' | 'set-content' | 'focus' | 'blur';
  payload?: string;
}

interface EditorResponse {
  type: 'content' | 'status' | 'error';
  payload: string;
  timestamp: number;
}

// Implement proper event handling between layers with type safety
const sendMessageToEditor = (message: EditorMessage): void => {
  // Implementation with proper typing
};

// Ensure data serialization is mobile-optimized and type-safe
const serializeEditorData = (data: Record<string, unknown>): string => {
  // Implementation with proper validation
};
```

### State Management

- Use React Context or state management library for app-wide state
- Keep editor state synchronized with SQLite data
- Implement optimistic updates for better UX

## Security Considerations

- Validate all data before SQLite insertion
- Sanitize content from DOM components
- Implement proper data export/import validation

## Future Considerations

- Design data models to support cloud synchronization
- Plan for collaborative editing features
- Consider data encryption for sensitive notes

## Development Workflow

1. Always test on both iOS and Android simulators
2. Verify offline functionality regularly
3. Test DOM component performance on lower-end devices
4. Validate database migrations thoroughly

## Key Reminders for AI Assistants

- **App Name**: Always refer to this as "Inky Notes" - "Your offline-first note-taking companion"
- This is NOT a web app - it's a native mobile app using DOM components for rich text editing
- All features must work offline-first
- Tiptap runs inside DOM components, not directly in React Native
- expo-sqlite is the single source of truth for data persistence
- Use NativeWind (Tailwind CSS) for all styling - no StyleSheet.create() or inline styles
- **CRITICAL**: TypeScript is MANDATORY - NO JavaScript files, NO `any` types ever
- **Type Everything**: Every function, component, prop, and variable must have explicit types
- **Strict Mode**: Use TypeScript strict mode with all safety checks enabled
- **Design System**: MUST follow the comprehensive Inky Notes design system exactly
  - Orange theme (#f97316 primary) with glass morphism effects
  - Specific typography scales (text-4xl, text-lg, text-sm, text-xs)
  - Standardized spacing (6px gaps, 24px sections, etc.)
  - 200ms ease-out animations with scale(1.02) hover effects
  - Glass backgrounds with backdrop-blur-md
- Consider how Tailwind classes interact with DOM components for consistent theming
- Define comprehensive interfaces for all data structures and API contracts
- All UI components must match the design system specifications exactly
