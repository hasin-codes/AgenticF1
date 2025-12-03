"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
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
    setCurrentChatId: (id: string) => void
    createNewChat: (id: string) => void
    updateChatMessages: (chatId: string, messages: Message[]) => void
    updateChatTopbarState: (chatId: string, state: TelemetrySelection) => void
    updateChatTitle: (chatId: string, title: string) => void
    getChatData: (chatId: string) => ChatData | null
    getAllChats: () => ChatData[]
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
    const [currentChatId, setCurrentChatId] = useState<string | null>(null)
    const [chats, setChats] = useState<Record<string, ChatData>>({})

    // Load chats from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
            try {
                setChats(JSON.parse(stored))
            } catch (error) {
                console.error('Failed to load chats from localStorage:', error)
            }
        }
    }, [])

    // Save chats to localStorage whenever they change
    useEffect(() => {
        if (Object.keys(chats).length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(chats))
        }
    }, [chats])

    const createNewChat = React.useCallback((id: string) => {
        const newChat: ChatData = {
            id,
            title: 'New Chat',
            timestamp: new Date().toISOString(),
            messages: [],
            topbarState: { ...DEFAULT_TOPBAR_STATE }
        }
        setChats(prev => ({ ...prev, [id]: newChat }))
        setCurrentChatId(id)
    }, [])

    const updateChatMessages = React.useCallback((chatId: string, messages: Message[]) => {
        setChats(prev => {
            if (!prev[chatId]) return prev
            return {
                ...prev,
                [chatId]: {
                    ...prev[chatId],
                    messages,
                    timestamp: new Date().toISOString()
                }
            }
        })
    }, [])

    const updateChatTopbarState = React.useCallback((chatId: string, state: TelemetrySelection) => {
        setChats(prev => {
            if (!prev[chatId]) return prev
            return {
                ...prev,
                [chatId]: {
                    ...prev[chatId],
                    topbarState: state
                }
            }
        })
    }, [])

    const updateChatTitle = React.useCallback((chatId: string, title: string) => {
        setChats(prev => {
            if (!prev[chatId]) return prev
            return {
                ...prev,
                [chatId]: {
                    ...prev[chatId],
                    title
                }
            }
        })
    }, [])

    const getChatData = React.useCallback((chatId: string): ChatData | null => {
        return chats[chatId] || null
    }, [chats])

    const getAllChats = React.useCallback((): ChatData[] => {
        return Object.values(chats).sort((a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
    }, [chats])

    const contextValue = React.useMemo(() => ({
        currentChatId,
        chats,
        setCurrentChatId,
        createNewChat,
        updateChatMessages,
        updateChatTopbarState,
        updateChatTitle,
        getChatData,
        getAllChats
    }), [
        currentChatId,
        chats,
        createNewChat,
        updateChatMessages,
        updateChatTopbarState,
        updateChatTitle,
        getChatData,
        getAllChats
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
