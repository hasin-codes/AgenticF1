"use client"

import * as React from "react"
import { Sparkles, ArrowRight, ChevronRight, ChevronLeft, Copy, ThumbsUp, ThumbsDown, RefreshCw, CornerDownLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import AI_Prompt from "@/components/kokonutui/ai-prompt"
import { sendStreamingChatMessage, Message } from "@/lib/zai-api"
import { useChat } from "@/lib/chat-context"
import { useTelemetry } from "@/lib/telemetry-context"
import { generateUUID } from "@/lib/uuid"
import { useRouter } from "next/navigation"

interface ChatInterfaceProps {
    className?: string
    chatId?: string
    isTelemetryVisible?: boolean
    onToggleTelemetry?: () => void
}

export function ChatInterface({ className, chatId, isTelemetryVisible, onToggleTelemetry }: ChatInterfaceProps) {
    const router = useRouter()
    const { getChatData, updateChatMessages, updateChatTitle, createNewChat, setCurrentChatId } = useChat()

    // Local state for messages and loading
    const [messages, setMessages] = React.useState<Message[]>([])
    const [isLoading, setIsLoading] = React.useState(false)
    const [messageIdCounter, setMessageIdCounter] = React.useState(1)

    const endOfMessagesRef = React.useRef<HTMLDivElement>(null)
    const [shouldAutoScroll, setShouldAutoScroll] = React.useState(true)

    // Track the current chatId being displayed
    const activeChatIdRef = React.useRef<string | undefined>(chatId)
    const isInitializedRef = React.useRef(false)

    // Initialize or load chat data when chatId changes - NO CONTEXT FUNCTIONS IN DEPS
    React.useEffect(() => {
        activeChatIdRef.current = chatId
        isInitializedRef.current = false

        if (chatId) {
            // Load existing chat
            setCurrentChatId(chatId)
            const chatData = getChatData(chatId)

            if (chatData) {
                // Chat exists, load its messages
                setMessages(chatData.messages)
                setMessageIdCounter(
                    chatData.messages.length > 0
                        ? Math.max(...chatData.messages.map(m => m.id)) + 1
                        : 1
                )
            } else {
                // Chat doesn't exist, create it
                createNewChat(chatId)
                setMessages([])
                setMessageIdCounter(1)
            }
        } else {
            // No chatId means we're in "new chat" mode
            setCurrentChatId(null)
            setMessages([])
            setMessageIdCounter(1)
        }

        isInitializedRef.current = true
    }, [chatId]) // ONLY chatId in dependencies

    // Sync messages to context - separate effect with proper guards
    React.useEffect(() => {
        // Don't sync if not initialized or no active chat or no messages
        if (!isInitializedRef.current || !activeChatIdRef.current || messages.length === 0) {
            return
        }

        // Get current chat data
        const currentChatData = getChatData(activeChatIdRef.current)
        if (!currentChatData) return

        // Only update if messages actually changed
        const currentMessagesJson = JSON.stringify(currentChatData.messages)
        const newMessagesJson = JSON.stringify(messages)

        if (currentMessagesJson !== newMessagesJson) {
            updateChatMessages(activeChatIdRef.current, messages)

            // Update title based on first user message if still "New Chat"
            if (currentChatData.title === 'New Chat') {
                const firstUserMessage = messages.find(m => m.role === 'user')
                if (firstUserMessage) {
                    const title = firstUserMessage.content.slice(0, 50) +
                        (firstUserMessage.content.length > 50 ? '...' : '')
                    updateChatTitle(activeChatIdRef.current, title)
                }
            }
        }
    }, [messages]) // ONLY messages in dependencies

    // Auto-scroll logic
    const handleScroll = React.useCallback((event: React.UIEvent<HTMLDivElement>) => {
        const target = event.target as HTMLDivElement
        const { scrollTop, scrollHeight, clientHeight } = target
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 100
        setShouldAutoScroll(isAtBottom)
    }, [])

    const scrollToBottom = React.useCallback((smooth = true) => {
        if (endOfMessagesRef.current) {
            endOfMessagesRef.current.scrollIntoView({
                behavior: smooth ? "smooth" : "auto",
                block: "end"
            })
        }
    }, [])

    React.useEffect(() => {
        if (shouldAutoScroll) {
            scrollToBottom()
        }
    }, [messages, shouldAutoScroll, scrollToBottom])

    React.useEffect(() => {
        if (isLoading) {
            setShouldAutoScroll(true)
            scrollToBottom()
        }
    }, [isLoading, scrollToBottom])

    const formatTimestamp = () => {
        const now = new Date()
        return now.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        })
    }

    const handleSendMessage = async (userMessage: string) => {
        if (isLoading || !userMessage.trim()) return

        let currentChatId = activeChatIdRef.current

        // Create new chat if we don't have one
        if (!currentChatId) {
            currentChatId = generateUUID()
            createNewChat(currentChatId)
            activeChatIdRef.current = currentChatId
            isInitializedRef.current = true

            // Update URL without reloading
            router.push(`/c/${currentChatId}`)
        }

        const newUserMsgId = messageIdCounter
        const aiPlaceholderId = messageIdCounter + 1

        const userMsg: Message = {
            id: newUserMsgId,
            role: 'user',
            content: userMessage,
            timestamp: formatTimestamp()
        }

        // Add user message
        setMessages(prev => [...prev, userMsg])
        setMessageIdCounter(prev => prev + 2)
        setIsLoading(true)
        setShouldAutoScroll(true)

        try {
            // Prepare API messages
            const apiMessages = messages.map(msg => ({
                role: (msg.role === 'ai' ? 'assistant' : msg.role) as 'user' | 'assistant' | 'system',
                content: msg.content
            }))

            apiMessages.push({
                role: 'user',
                content: userMessage
            })

            // Create AI placeholder
            const aiPlaceholder: Message = {
                id: aiPlaceholderId,
                role: 'ai',
                content: '',
                timestamp: formatTimestamp()
            }

            setMessages(prev => [...prev, aiPlaceholder])

            // Stream AI response
            let fullResponse = ''
            await sendStreamingChatMessage(
                apiMessages,
                'glm-4.6',
                (chunk: string) => {
                    fullResponse += chunk
                    setMessages(prev =>
                        prev.map(msg =>
                            msg.id === aiPlaceholderId
                                ? { ...msg, content: fullResponse }
                                : msg
                        )
                    )
                }
            )

            // Update with final response and check for telemetry action
            setMessages(prev =>
                prev.map(msg =>
                    msg.id === aiPlaceholderId
                        ? {
                            ...msg,
                            content: fullResponse,
                            hasAction: fullResponse.toLowerCase().includes('telemetry') ||
                                fullResponse.toLowerCase().includes('data') ||
                                fullResponse.toLowerCase().includes('comparison')
                        }
                        : msg
                )
            )

        } catch (error) {
            console.error('Error sending message:', error)

            const errorMsgId = messageIdCounter + 2
            const errorMsg: Message = {
                id: errorMsgId,
                role: 'ai',
                content: 'Sorry, I encountered an error while processing your request. Please try again.',
                timestamp: formatTimestamp()
            }

            setMessages(prev => [...prev, errorMsg])
            setMessageIdCounter(prev => prev + 1)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={cn(
                "flex flex-col h-full bg-card rounded-[24px] overflow-hidden border border-white/5 shadow-2xl shadow-black/50",
                className
            )}
        >
            {/* Messages Area */}
            <div className="flex-1 overflow-hidden relative">
                <div
                    className="h-full w-full overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
                    onScroll={handleScroll}
                    style={{
                        scrollBehavior: 'smooth'
                    }}
                >
                    <div className="flex flex-col p-6 space-y-8 min-h-full">
                        {messages.map((msg, index) => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: index * 0.05 }}
                                className={cn(
                                    "flex gap-4 w-full",
                                    msg.role === "user" ? "justify-end" : "justify-start"
                                )}
                            >
                                {msg.role === "ai" ? (
                                    <div className="flex flex-col gap-2 max-w-[90%] md:max-w-[85%]">
                                        {/* Thought Process Header */}
                                        {!isLoading && msg.content !== '' && (
                                            <div className="flex items-center gap-2 text-muted-foreground/60 text-xs font-medium mb-1 cursor-pointer hover:text-muted-foreground transition-colors w-fit">
                                                <Sparkles className="h-3.5 w-3.5" />
                                                <span>Thought for 1.2 seconds</span>
                                                <ChevronRight className="h-3 w-3" />
                                            </div>
                                        )}

                                        {/* AI Content - Clean Text */}
                                        <div className="prose prose-invert prose-sm max-w-none 
                                            prose-p:leading-relaxed prose-p:my-2
                                            prose-headings:text-zinc-100 prose-headings:font-semibold prose-headings:my-4
                                            prose-ul:my-2 prose-li:my-0.5
                                            prose-strong:text-white prose-strong:font-semibold
                                            prose-code:text-xs prose-code:bg-white/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:border prose-code:border-white/10
                                            prose-pre:bg-zinc-950/50 prose-pre:p-4 prose-pre:rounded-xl prose-pre:border prose-pre:border-white/10">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {msg.content}
                                            </ReactMarkdown>
                                            {msg.content === '' && isLoading && (
                                                <span className="inline-flex gap-1 items-center h-5">
                                                    <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                                    <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                                    <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce"></span>
                                                </span>
                                            )}
                                        </div>

                                        {/* Action Bar */}
                                        {!isLoading && msg.content !== '' && (
                                            <div className="flex items-center justify-between gap-2 mt-2 -ml-2">
                                                {/* Left side: Copy, Thumbs, Regenerate */}
                                                <div className="flex items-center gap-1">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                                        <Copy className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                                        <ThumbsUp className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                                        <ThumbsDown className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                                        <RefreshCw className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>

                                                {/* Right side: Show/Hide Telemetry Panel */}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={onToggleTelemetry}
                                                    className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1.5"
                                                >
                                                    {isTelemetryVisible ? (
                                                        <>
                                                            <ChevronLeft className="h-3.5 w-3.5" />
                                                            Hide Telemetry Panel
                                                        </>
                                                    ) : (
                                                        <>
                                                            Show Telemetry Panel
                                                            <ChevronRight className="h-3.5 w-3.5" />
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        )}

                                        {/* Telemetry Action Button (if applicable) */}
                                        {msg.hasAction && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                className="mt-2"
                                            >
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="gap-2 text-xs font-medium bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20 hover:text-red-300 transition-colors"
                                                >
                                                    Show on Telemetry <ArrowRight className="h-3 w-3" />
                                                </Button>
                                            </motion.div>
                                        )}
                                    </div>
                                ) : (
                                    // User Message Bubble
                                    <div className="flex flex-col items-end max-w-[80%]">
                                        <div className="px-5 py-3 rounded-[20px] text-[15px] leading-relaxed shadow-md bg-gradient-to-br from-red-600 to-red-700 text-white border border-red-500/20">
                                            <span className="font-medium tracking-wide">{msg.content}</span>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                        <div ref={endOfMessagesRef} className="h-4" />
                    </div>
                </div>

                {/* Gradient overlay for top fade */}
                <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-card to-transparent pointer-events-none z-10" />
            </div>

            {/* Input Area */}
            <div className="p-4 flex-shrink-0 z-20">
                <div className="flex justify-center max-w-3xl mx-auto w-full">
                    <AI_Prompt onSendMessage={handleSendMessage} disabled={isLoading} />
                </div>
            </div>
        </motion.div>
    )
}
