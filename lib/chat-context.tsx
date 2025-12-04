"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { TelemetrySelection } from './telemetry-context'
import { Message } from './zai-api'

// Chat-specific data structure
export interface ChatData {
    id: string
    title: string
    timestamp: string
    messages: Message[]
    topbarState: TelemetrySelection
}

interface ChatContextType {
    currentChatId: string | null
    chats: Record<string, ChatData>
    setCurrentChatId: (id: string | null) => void
    createNewChat: (id: string) => ChatData
    updateChatMessages: (chatId: string, messages: Message[]) => void
    updateChatTopbarState: (chatId: string, state: TelemetrySelection) => void
    updateChatTitle: (chatId: string, title: string) => void
    getChatData: (chatId: string) => ChatData | null
    getAllChats: () => ChatData[]
    deleteChat: (chatId: string) => void
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

const DEFAULT_TOPBAR_STATE: TelemetrySelection = {
    year: '2024',
    gp: null,
    session: 'R',
    selectedDrivers: [],
    totalLaps: 0,
}

const STORAGE_KEY = 'f1-tele-chats'

export function ChatProvider({ children }: { children: ReactNode }) {
    const [currentChatId, setCurrentChatIdState] = useState<string | null>(null)
    const [chats, setChats] = useState<Record<string, ChatData>>({})
    const [isHydrated, setIsHydrated] = useState(false)

    // Load chats from localStorage on mount (client-side only)
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(STORAGE_KEY)
            if (stored) {
                try {
                    const parsedChats = JSON.parse(stored)
                    setChats(parsedChats)
                } catch (error) {
                    console.error('Failed to load chats from localStorage:', error)
                    localStorage.removeItem(STORAGE_KEY)
                }
            }
            setIsHydrated(true)
        }
    }, [])

    // Save chats to localStorage whenever they change (debounced)
    useEffect(() => {
        if (isHydrated && typeof window !== 'undefined') {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(chats))
            } catch (error) {
                console.error('Failed to save chats to localStorage:', error)
            }
        }
    }, [chats, isHydrated])

    const setCurrentChatId = useCallback((id: string | null) => {
        setCurrentChatIdState(id)
    }, [])

    const createNewChat = useCallback((id: string): ChatData => {
        const newChat: ChatData = {
            id,
            title: 'New Chat',
            timestamp: new Date().toISOString(),
            messages: [],
            topbarState: { ...DEFAULT_TOPBAR_STATE }
        }

        setChats(prev => {
            // Only create if it doesn't exist
            if (prev[id]) {
                return prev
            }
            return { ...prev, [id]: newChat }
        })
        setCurrentChatIdState(id)

        return newChat
    }, [])

    const updateChatMessages = useCallback((chatId: string, messages: Message[]) => {
        setChats(prev => {
            const chat = prev[chatId]
            if (!chat) {
                console.warn(`Attempted to update messages for non-existent chat: ${chatId}`)
                return prev
            }

            // Only update if messages actually changed
            if (JSON.stringify(chat.messages) === JSON.stringify(messages)) {
                return prev
            }

            return {
                ...prev,
                [chatId]: {
                    ...chat,
                    messages,
                    timestamp: new Date().toISOString()
                }
            }
        })
    }, [])

    const updateChatTopbarState = useCallback((chatId: string, state: TelemetrySelection) => {
        setChats(prev => {
            const chat = prev[chatId]
            if (!chat) {
                console.warn(`Attempted to update topbar state for non-existent chat: ${chatId}`)
                return prev
            }

            return {
                ...prev,
                [chatId]: {
                    ...chat,
                    topbarState: state
                }
            }
        })
    }, [])

    const updateChatTitle = useCallback((chatId: string, title: string) => {
        setChats(prev => {
            const chat = prev[chatId]
            if (!chat) {
                console.warn(`Attempted to update title for non-existent chat: ${chatId}`)
                return prev
            }

            // Only update if title actually changed
            if (chat.title === title) {
                return prev
            }

            return {
                ...prev,
                [chatId]: {
                    ...chat,
                    title
                }
            }
        })
    }, [])

    const getChatData = useCallback((chatId: string): ChatData | null => {
        return chats[chatId] || null
    }, [chats])

    const getAllChats = useCallback((): ChatData[] => {
        return Object.values(chats).sort((a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
    }, [chats])

    const deleteChat = useCallback((chatId: string) => {
        setChats(prev => {
            const newChats = { ...prev }
            delete newChats[chatId]
            return newChats
        })

        if (currentChatId === chatId) {
            setCurrentChatIdState(null)
        }
    }, [currentChatId])

    const contextValue = React.useMemo(() => ({
        currentChatId,
        chats,
        setCurrentChatId,
        createNewChat,
        updateChatMessages,
        updateChatTopbarState,
        updateChatTitle,
        getChatData,
        getAllChats,
        deleteChat
    }), [
        currentChatId,
        chats,
        setCurrentChatId,
        createNewChat,
        updateChatMessages,
        updateChatTopbarState,
        updateChatTitle,
        getChatData,
        getAllChats,
        deleteChat
    ])

    return (
        <ChatContext.Provider value={contextValue}>
            {children}
        </ChatContext.Provider>
    )
}

export function useChat() {
    const context = useContext(ChatContext)
    if (!context) {
        throw new Error('useChat must be used within ChatProvider')
    }
    return context
}
