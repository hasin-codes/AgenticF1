# Testing Guide for Chat Fixes

## Quick Test Steps

### Test 1: New Chat Creation
1. Go to http://localhost:3000
2. Type a message and send
3. ✅ **Expected**: URL changes to `/c/[some-uuid]`, message appears
4. ❌ **Old Bug**: URL wouldn't update or would cause page reload

### Test 2: Message Persistence
1. Send 3-5 messages in a chat
2. Refresh the page (F5)
3. ✅ **Expected**: All messages still visible
4. ❌ **Old Bug**: Messages would disappear or load partially

### Test 3: Chat Switching
1. Create first chat, send a message "Chat 1"
2. Click "New Chat" in sidebar (hover over "Recent Chats" label)
3. Send message "Chat 2" in new chat
4. Click on first chat in sidebar
5. ✅ **Expected**: See "Chat 1" message
6. Click on second chat in sidebar
7. ✅ **Expected**: See "Chat 2" message
8. ❌ **Old Bug**: Messages would mix between chats or not load

### Test 4: Sidebar Navigation
1. Create 3 different chats with different first messages
2. Click through them in the sidebar
3. ✅ **Expected**: Each chat loads instantly with correct messages
4. ✅ **Expected**: Chat titles show first message preview
5. ❌ **Old Bug**: Clicking would sometimes show wrong chat or empty screen

### Test 5: Browser Session Persistence
1. Create 2-3 chats with messages
2. Close browser completely
3. Reopen browser and go to http://localhost:3000
4. ✅ **Expected**: All chats still in sidebar with messages intact
5. ❌ **Old Bug**: Chats would be lost on browser restart

### Test 6: Rapid Message Sending
1. Send 10 messages rapidly (type and hit enter quickly)
2. ✅ **Expected**: All messages appear in order, no duplicates
3. ✅ **Expected**: No lag or freezing
4. ❌ **Old Bug**: Messages would duplicate or freeze the UI

### Test 7: Long Conversation
1. Send 20+ messages in one chat
2. Scroll up and down
3. Send more messages
4. ✅ **Expected**: Smooth scrolling, auto-scroll to new messages
5. ✅ **Expected**: All messages retain correct order
6. ❌ **Old Bug**: Message IDs would conflict, causing React errors

### Test 8: Direct URL Access
1. Create a chat and note the URL: `http://localhost:3000/c/[uuid]`
2. Copy the URL
3. Open new browser tab
4. Paste the URL
5. ✅ **Expected**: Chat loads with all messages
6. ❌ **Old Bug**: Would show empty chat or error

## What to Look For

### ✅ Good Signs:
- Messages save immediately
- URL updates smoothly when creating chat
- Sidebar shows all chats
- Switching chats is instant
- No console errors
- Page doesn't reload unexpectedly

### ❌ Bad Signs (Report These):
- Messages disappear after refresh
- Console shows errors
- Chat list doesn't update
- Clicking chat doesn't load messages
- URL doesn't update when creating chat
- Page reloads when it shouldn't

## Console Commands for Debugging

Open browser DevTools (F12) and try these in Console tab:

### View all stored chats:
```javascript
JSON.parse(localStorage.getItem('f1-tele-chats'))
```

### Clear all chats (fresh start):
```javascript
localStorage.removeItem('f1-tele-chats')
location.reload()
```

### Count messages in storage:
```javascript
let chats = JSON.parse(localStorage.getItem('f1-tele-chats'))
Object.values(chats).forEach(chat => {
    console.log(`${chat.title}: ${chat.messages.length} messages`)
})
```

## Performance Test

Send 50 messages rapidly and check:
- [ ] No lag in typing
- [ ] Messages appear smoothly
- [ ] Scroll works well
- [ ] No memory leaks (check DevTools Performance tab)

## Known Working Features

After the fixes, these should all work perfectly:
- ✅ Creating new chats
- ✅ Loading existing chats
- ✅ Switching between chats
- ✅ Message persistence
- ✅ Sidebar updates
- ✅ URL routing
- ✅ Browser refresh persistence
- ✅ Direct URL access
- ✅ Message ordering
- ✅ Auto-scrolling

## Reporting Issues

If you find a bug, please provide:
1. What you did (steps to reproduce)
2. What you expected to happen
3. What actually happened
4. Any console errors (F12 → Console tab)
5. Browser and version

## Success Criteria

The chat system is working correctly if:
1. ✅ All 8 tests above pass
2. ✅ No console errors during normal use
3. ✅ Messages never disappear or duplicate
4. ✅ Chat switching is instant and reliable
5. ✅ Everything persists across browser sessions
