# Chat System Architecture

## Overview

The F1 Telemetry chat system uses a **context-based state management** pattern with **localStorage persistence**. This document explains how everything works together.

---

## Core Components

### 1. ChatProvider (lib/chat-context.tsx)

**Purpose**: Global state management for all chats

**Responsibilities**:
- Store all chat data in memory
- Persist to/from localStorage
- Provide CRUD operations for chats
- Track the currently active chat

**Key Functions**:
```typescript
createNewChat(id: string) => ChatData
  - Creates a new chat with unique ID
  - Initializes with empty messages
  - Sets default topbar state
  - Idempotent: won't create duplicates

updateChatMessages(chatId: string, messages: Message[])
  - Updates messages for a specific chat
  - Checks for actual changes before updating
  - Updates timestamp

updateChatTitle(chatId: string, title: string)
  - Updates chat title
  - Usually set from first user message

getChatData(chatId: string) => ChatData | null
  - Retrieves chat data by ID
  - Returns null if not found

getAllChats() => ChatData[]
  - Returns all chats sorted by timestamp
  - Used by sidebar

deleteChat(chatId: string)
  - Removes a chat completely
  - Clears currentChatId if deleting active chat
```

**State Structure**:
```typescript
{
  currentChatId: string | null,
  chats: {
    [chatId: string]: {
      id: string
      title: string
      timestamp: string
      messages: Message[]
      topbarState: TelemetrySelection
    }
  }
}
```

**LocalStorage Format**:
```json
{
  "uuid-1": {
    "id": "uuid-1",
    "title": "How fast was Hamilton in...",
    "timestamp": "2025-12-04T18:00:00Z",
    "messages": [...],
    "topbarState": {...}
  },
  "uuid-2": {...}
}
```

---

### 2. ChatInterface (components/chat-interface.tsx)

**Purpose**: UI component for displaying and interacting with a single chat

**Responsibilities**:
- Render messages
- Handle user input
- Send messages to AI
- Auto-scroll management
- Sync local state with context

**Props**:
```typescript
{
  className?: string   // Optional styling
  chatId?: string     // Chat ID to display (undefined = new chat)
}
```

**State Management**:
```typescript
// Active chat tracking (uses ref to avoid re-renders)
activeChatIdRef = useRef(chatId)

// Local message state (synced to context)
messages = useState([])

// UI state
isLoading = useState(false)
shouldAutoScroll = useState(true)
messageIdCounter = useState(1)
```

**Key Flow**:

1. **Initialization**:
   ```
   chatId prop changes
   → Load from context (if exists)
   → OR create new chat
   → Set local messages state
   ```

2. **Sending Message**:
   ```
   User types message
   → Add user message to local state
   → Create AI placeholder message
   → Call Z.AI API (streaming)
   → Update AI message as chunks arrive
   → Sync to context when done
   ```

3. **Syncing to Context**:
   ```
   Messages change
   → Check if different from last sync
   → Update context only if changed
   → Update chat title if needed
   ```

**Important Design Decisions**:
- Uses `useRef` for chatId to avoid re-render loops
- Debounces context updates to prevent spam
- Maintains single source of truth in context
- Local state only for UI responsiveness

---

### 3. MainLayout (components/main-layout.tsx)

**Purpose**: Overall page layout with sidebar and chat panels

**Responsibilities**:
- Layout management
- Sidebar state (collapsed/expanded)
- Resizable panels
- Pass chatId to ChatInterface

**Props**:
```typescript
{
  initialChatId?: string  // From URL route parameter
}
```

**Does NOT**:
- ❌ Create chats
- ❌ Load chat data
- ❌ Manage messages
- ✅ Just renders layout and passes chatId down

---

### 4. AppSidebar (components/app-sidebar.tsx)

**Purpose**: Navigation sidebar with chat list

**Responsibilities**:
- Display all chats
- Handle "New Chat" button
- Navigate between chats
- Show active chat

**Key Functions**:
```typescript
handleChatSelect(chatId)
  → Navigate to /c/[chatId]
  → ChatInterface will load that chat

handleNewChat()
  → Generate new UUID
  → Create chat in context
  → Navigate to /c/[newId]
```

---

## Data Flow

### Creating a New Chat

```
User clicks "New Chat"
  ↓
AppSidebar.handleNewChat()
  ↓
Generate UUID
  ↓
Call createNewChat(uuid)
  ↓
Context creates empty chat
  ↓
Navigate to /c/[uuid]
  ↓
MainLayout receives uuid as initialChatId
  ↓
Passes to ChatInterface
  ↓
ChatInterface loads chat from context
```

### Sending a Message

```
User types and hits Enter
  ↓
ChatInterface.handleSendMessage()
  ↓
Add user message to local state
  ↓
Create AI placeholder
  ↓
Call Z.AI API (streaming)
  ↓
Update placeholder with chunks
  ↓
On completion, sync to context
  ↓
Context saves to localStorage
```

### Loading Existing Chat

```
User clicks chat in sidebar
  ↓
AppSidebar navigates to /c/[chatId]
  ↓
MainLayout receives chatId param
  ↓
Passes to ChatInterface
  ↓
ChatInterface.useEffect runs
  ↓
getChatData(chatId)
  ↓
Set local messages state
  ↓
Render messages
```

### Browser Refresh

```
Page loads
  ↓
ChatProvider initializes
  ↓
Load from localStorage
  ↓
Set isHydrated = true
  ↓
Router determines current chatId from URL
  ↓
MainLayout receives chatId
  ↓
ChatInterface loads from context
  ↓
Render messages
```

---

## State Synchronization

### The Single Source of Truth Pattern

```
┌─────────────────────────────────────┐
│         ChatContext (Truth)         │
│  - All chats                        │
│  - All messages                     │
│  - Persisted to localStorage        │
└─────────────────────────────────────┘
          ↑                ↓
          write            read
          ↑                ↓
┌─────────────────────────────────────┐
│       ChatInterface (View)          │
│  - Local messages (for UI speed)    │
│  - Syncs back to context            │
│  - Deduplicates updates             │
└─────────────────────────────────────┘
```

### Preventing Infinite Loops

**Problem**: If component updates context, context update triggers component re-render, which updates context again...

**Solution**: Multiple safeguards

1. **Reference Comparison**:
   ```typescript
   if (JSON.stringify(chat.messages) === JSON.stringify(messages)) {
       return prev // Don't update if identical
   }
   ```

2. **Last Synced Tracking**:
   ```typescript
   const lastSyncedMessagesRef = useRef('')
   if (messagesJson === lastSyncedMessagesRef.current) return
   lastSyncedMessagesRef.current = messagesJson
   ```

3. **Ref for Chat ID**:
   ```typescript
   // Using ref instead of state avoids re-render cascade
   const activeChatIdRef = useRef(chatId)
   ```

---

## URL Routing

### Route Structure

```
/                    → Home (new chat, no chatId)
/c/[chatId]         → Specific chat
```

### Dynamic Route (app/c/[chatId]/page.tsx)

```typescript
export default function ChatPage() {
    const params = useParams()
    const chatId = params.chatId as string
    
    return <MainLayout initialChatId={chatId} />
}
```

### URL Updates

When creating a new chat:
```typescript
const newId = generateUUID()
createNewChat(newId)

// Update URL without page reload
window.history.pushState({}, '', `/c/${newId}`)
```

---

## LocalStorage Management

### Storage Key
```typescript
const STORAGE_KEY = 'f1-tele-chats'
```

### Save Strategy
- Triggered by useEffect when `chats` state changes
- Only saves when client-side hydrated
- Debounced by React's batching
- Error handling for quota exceeded

### Load Strategy
- Only runs on client-side (not SSR)
- Runs once on mount
- Sets `isHydrated` flag when complete
- Error handling for corrupt data

---

## Message Structure

```typescript
interface Message {
    id: number              // Unique within chat
    role: 'user' | 'ai'    // Message sender
    content: string         // Message text
    timestamp: string       // Display timestamp
    hasAction?: boolean     // Show telemetry action button
}
```

### Message ID Generation

```typescript
// Simple counter, increments for each message
let messageIdCounter = 1

// User message
const userMsg: Message = {
    id: messageIdCounter++,
    role: 'user',
    content: userMessage,
    timestamp: formatTimestamp()
}

// AI message (placeholder while loading)
const aiMsg: Message = {
    id: messageIdCounter++,
    role: 'ai',
    content: '', // Updated as stream chunks arrive
    timestamp: formatTimestamp()
}
```

---

## Error Handling

### Context Operations

All chat operations log warnings if chat doesn't exist:
```typescript
if (!chat) {
    console.warn(`Attempted to update non-existent chat: ${chatId}`)
    return prev
}
```

### LocalStorage

```typescript
try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats))
} catch (error) {
    console.error('Failed to save chats:', error)
    // Continues gracefully, chats just won't persist
}
```

### API Calls

```typescript
try {
    await sendStreamingChatMessage(...)
} catch (error) {
    console.error('Error sending message:', error)
    
    // Show error message to user
    const errorMsg: Message = {
        id: messageIdCounter++,
        role: 'ai',
        content: 'Sorry, I encountered an error...',
        timestamp: formatTimestamp()
    }
    setMessages(prev => [...prev, errorMsg])
}
```

---

## Performance Optimizations

### 1. Memoization
All context functions use `useCallback`:
```typescript
const createNewChat = useCallback((id: string) => {
    // Implementation
}, []) // Empty deps = stable reference
```

### 2. Ref Usage
Chat ID tracking uses refs to avoid re-renders:
```typescript
const activeChatIdRef = useRef(chatId)
// Updating this doesn't cause re-render
```

### 3. Deduplication
Messages only sync to context when actually changed:
```typescript
if (JSON.stringify(messages) === lastSynced) return
```

### 4. Virtual Scrolling
Could be added for 1000+ messages (not needed yet)

### 5. LocalStorage Debouncing
React's state batching naturally debounces saves

---

## Future Enhancements

### Easy to Add:
- Chat deletion (function already exists)
- Chat search/filter
- Export chat to file
- Import chat from file
- Chat folders/categories

### Requires Architecture Changes:
- Cloud sync (would need backend)
- Collaborative editing (would need WebSocket)
- Chat sharing (would need permissions)
- Infinite scroll (would need pagination)

---

## Debugging Tips

### Check Context State
Add to ChatProvider:
```typescript
useEffect(() => {
    console.log('Current chats:', chats)
    console.log('Current chat ID:', currentChatId)
}, [chats, currentChatId])
```

### Check LocalStorage
In browser console:
```javascript
// View all chats
JSON.parse(localStorage.getItem('f1-tele-chats'))

// Clear storage
localStorage.removeItem('f1-tele-chats')
```

### Monitor Re-renders
Use React DevTools Profiler to identify unnecessary re-renders

---

## Common Issues and Solutions

### Messages not persisting
- Check localStorage quota
- Check browser privacy settings
- Verify `isHydrated` flag is true

### Chat switching shows wrong messages
- Verify `activeChatIdRef` is updating
- Check `getChatData` returns correct chat
- Ensure `chatId` prop is changing

### Infinite loops
- Check useEffect dependencies
- Verify deduplication logic
- Ensure callbacks are memoized

### Duplicate messages
- Check message ID counter logic
- Verify no duplicate API calls
- Check for race conditions in state updates

---

## Summary

The chat system follows these principles:

1. **Single Source of Truth**: Context holds all data
2. **Unidirectional Data Flow**: Components read from context, write back
3. **Optimistic UI**: Show messages immediately, sync later
4. **Resilient**: Error handling at every level
5. **Performant**: Memoization, refs, deduplication
6. **Simple**: Each component has one clear responsibility

This architecture scales well and is easy to extend!
