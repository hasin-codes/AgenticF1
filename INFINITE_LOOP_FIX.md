# Infinite Loop Fix - Quick Reference

## The Problem

**Error**: "Maximum update depth exceeded"  
**Cause**: useEffect with context functions in dependency array caused circular updates

## The Root Cause

```typescript
// ❌ BAD - This causes infinite loops
React.useEffect(() => {
    const chatData = getChatData(chatId)
    setMessages(chatData?.messages || [])
}, [chatId, getChatData]) // getChatData changes when context updates!
```

**Why it loops**:
1. useEffect runs, calls `getChatData`
2. Returns chat data, calls `setMessages`
3. Messages update, triggers sync to context
4. Context updates `chats` state
5. `getChatData` function now returns different reference
6. useEffect sees `getChatData` changed
7. Runs again → LOOP!

## The Solution

```typescript
// ✅ GOOD - Only chatId in dependencies
React.useEffect(() => {
    const chatData = getChatData(chatId)
    setMessages(chatData?.messages || [])
}, [chatId]) // ONLY chatId prop
```

**Why it works**:
- Effect only runs when `chatId` PROP changes
- Calling `getChatData` doesn't trigger re-run
- Even though context updates, the `chatId` prop stays same
- Loop is broken!

## Key Rules to Prevent Loops

### Rule 1: Minimal Dependencies
Only include values that should trigger the effect:
```typescript
// ✅ Good
useEffect(() => {
    // ... logic ...
}, [chatId]) // Only the prop

// ❌ Bad  
useEffect(() => {
    // ... logic ...
}, [chatId, getChatData, updateMessages, createChat]) // Too many!
```

### Rule 2: Separate Concerns
Split effects by what triggers them:
```typescript
// Effect 1: Runs when chatId changes
React.useEffect(() => {
    // Load chat
}, [chatId])

// Effect 2: Runs when messages change
React.useEffect(() => {
    // Sync messages
}, [messages])
```

### Rule 3: Use Guards
Prevent unnecessary runs:
```typescript
React.useEffect(() => {
    if (!isInitialized) return
    if (!chatId) return
    if (messages.length === 0) return
    
    // Only run if all conditions met
    syncToContext()
}, [messages])
```

### Rule 4: Compare Before Update
Only update if data actually changed:
```typescript
const current = JSON.stringify(currentData)
const new = JSON.stringify(newData)

if (current !== new) {
    updateContext() // Only update if different
}
```

## Files Modified

1. **components/chat-interface.tsx**
   - Removed context functions from useEffect deps
   - Added `isInitializedRef` to prevent premature syncing
   - Split initialization and syncing into separate effects

## Testing the Fix

1. Create new chat → should work
2. Send messages → should save
3. Switch chats → should load different messages
4. Refresh page → should persist
5. **No infinite loops in console!**

## If Problems Persist

Check browser console for:
- Repeated log messages (indicates loop)
- "Maximum update depth" error
- Excessive re-renders

Debug by adding logs:
```typescript
React.useEffect(() => {
    console.log('Effect running')
    // ... rest of code
}, [deps])
```

If you see "Effect running" spam → you have a loop!

## Technical Details

**Context functions ARE memoized** with `useCallback(..., [])`:
- This means function reference is stable
- BUT: Functions return values can change!
- `getChatData(id)` returns different object each time chats update
- So we can't rely on function stability, only on prop stability

**The fix**: Don't put functions in deps, put the VALUES that change:
- `chatId` prop changes → load chat
- `messages` state changes → sync to context
- Context updates DON'T change chatId prop → no loop!
