"use client"

import * as React from "react"
import { Sparkles, ArrowRight, ChevronRight, Copy, ThumbsUp, ThumbsDown, RefreshCw, CornerDownLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import AI_Prompt from "@/components/kokonutui/ai-prompt"
import { sendStreamingChatMessage, Message } from "@/lib/zai-api"
import { useChat } from "@/lib/chat-context"
import { useTelemetry } from "@/lib/telemetry-context"

interface ChatInterfaceProps {
    className?: string
    chatId?: string
}

export function ChatInterface({ className, chatId }: ChatInterfaceProps) {
    const { getChatData, updateChatMessages, updateChatTitle, createNewChat } = useChat()

    // If chatId is provided, use it. Otherwise we'll generate one on first message
    const [activeChatId, setActiveChatId] = React.useState<string | undefined>(chatId)

    const chatData = activeChatId ? getChatData(activeChatId) : null

    const [messages, setMessages] = React.useState<Message[]>(chatData?.messages || [])
    const [isLoading, setIsLoading] = React.useState(false)
    const [messageIdCounter, setMessageIdCounter] = React.useState(
        chatData?.messages?.length ? Math.max(...chatData.messages.map(m => m.id)) + 1 : 1
    )
    const scrollAreaRef = React.useRef<HTMLDivElement>(null)
    const endOfMessagesRef = React.useRef<HTMLDivElement>(null)
    const [shouldAutoScroll, setShouldAutoScroll] = React.useState(true)

    // Sync messages with chat context
    React.useEffect(() => {
        if (chatId) {
            setActiveChatId(chatId)
        }
    }, [chatId])

    React.useEffect(() => {
        if (chatData) {
            setMessages(chatData.messages)
            if (chatData.messages.length) {
                setMessageIdCounter(Math.max(...chatData.messages.map(m => m.id)) + 1)
            }
        } else if (!activeChatId) {
            // Reset for new chat
            setMessages([])
            setMessageIdCounter(1)
        }
    }, [activeChatId, chatData])

    // Update chat context when messages change
    React.useEffect(() => {
        if (messages.length > 0 && activeChatId) {
            // Check if messages are actually different from context to avoid infinite loop
            if (chatData &&
                chatData.messages.length === messages.length &&
                chatData.messages[chatData.messages.length - 1]?.id === messages[messages.length - 1]?.id) {
                return
            }

            updateChatMessages(activeChatId, messages)

            // Update chat title based on first user message
            const firstUserMessage = messages.find(m => m.role === 'user')
            if (firstUserMessage && chatData?.title === 'New Chat') {
                const title = firstUserMessage.content.slice(0, 50) + (firstUserMessage.content.length > 50 ? '...' : '')
                updateChatTitle(activeChatId, title)
            }
        }
    }, [messages, activeChatId, updateChatMessages, updateChatTitle, chatData])

    // Check if user is at the bottom to determine if we should auto-scroll
    const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
        const target = event.target as HTMLDivElement
        const { scrollTop, scrollHeight, clientHeight } = target
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 100
        setShouldAutoScroll(isAtBottom)
    }

    const scrollToBottom = (smooth = true) => {
        if (endOfMessagesRef.current) {
            endOfMessagesRef.current.scrollIntoView({
                behavior: smooth ? "smooth" : "auto",
                block: "end"
            })
        }
    }

    // Scroll on new messages if we should
    React.useEffect(() => {
        if (shouldAutoScroll) {
            scrollToBottom()
        }
    }, [messages, shouldAutoScroll])

    // Force scroll to bottom when loading starts
    React.useEffect(() => {
        if (isLoading) {
            setShouldAutoScroll(true)
            scrollToBottom()
        }
    }, [isLoading])

    const formatTimestamp = () => {
        const now = new Date()
        return now.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        })
    }

    const handleSendMessage = async (userMessage: string) => {
        if (isLoading) return

        let currentActiveId = activeChatId

        // Create new chat if needed
        if (!currentActiveId) {
            const { generateUUID } = await import('@/lib/uuid')
            const newId = generateUUID()
            createNewChat(newId)
            setActiveChatId(newId)
            currentActiveId = newId

            // Update URL without reloading
            window.history.pushState({}, '', `/c/${newId}`)
        }

        const newUserMsgId = messageIdCounter
        const aiPlaceholderId = messageIdCounter + 1
        const errorMsgId = messageIdCounter + 2

        const userMsg: Message = {
            id: newUserMsgId,
            role: 'user',
            content: userMessage,
            timestamp: formatTimestamp()
        }

        setMessages(prev => [...prev, userMsg])
        setMessageIdCounter(prev => prev + 3)
        setIsLoading(true)
        setShouldAutoScroll(true)

        try {
            const apiMessages = messages
                .filter(msg => msg.id !== aiPlaceholderId)
                .map(msg => ({
                    role: (msg.role === 'ai' ? 'assistant' : msg.role) as 'user' | 'assistant' | 'system',
                    content: msg.content
                }))

            apiMessages.push({
                role: 'user',
                content: userMessage
            })

            const aiPlaceholder: Message = {
                id: aiPlaceholderId,
                role: 'ai',
                content: '',
                timestamp: formatTimestamp()
            }

            setMessages(prev => [...prev, aiPlaceholder])

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
            const errorMsg: Message = {
                id: errorMsgId,
                role: 'ai',
                content: 'Sorry, I encountered an error while processing your request. Please try again.',
                timestamp: formatTimestamp()
            }
            setMessages(prev => [...prev, errorMsg])
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
            {/* Header / Status Bar could go here if needed */}

            {/* Messages Area */}
            <div className="flex-1 overflow-hidden relative">
                <ScrollArea
                    ref={scrollAreaRef}
                    className="h-full w-full"
                    onScrollCapture={handleScroll} // Capture scroll events to update auto-scroll state
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
                                            <div className="flex items-center gap-1 mt-2 -ml-2">
                                                <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1.5">
                                                    <CornerDownLeft className="h-3.5 w-3.5" />
                                                    Insert
                                                </Button>
                                                <div className="h-4 w-px bg-white/10 mx-1" />
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
                </ScrollArea>

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
