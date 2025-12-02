"use client"

import * as React from "react"
import { Sparkles, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import AI_Prompt from "@/components/kokonutui/ai-prompt"
import { sendStreamingChatMessage, Message } from "@/lib/zai-api"

export function ChatInterface({ className }: { className?: string }) {
    const [messages, setMessages] = React.useState<Message[]>([
        {
            id: 1,
            role: "ai",
            content: "Welcome back, Max. I've analyzed the telemetry from your last stint. You're losing 0.2s in Sector 2 compared to Leclerc. Would you like to see the throttle trace?",
            timestamp: "10:23 AM"
        },
        {
            id: 2,
            role: "user",
            content: "Yes, show me the comparison in Turn 8 specifically.",
            timestamp: "10:24 AM"
        },
        {
            id: 3,
            role: "ai",
            content: "Here's the data for Turn 8. You can see Leclerc carries 5km/h more minimum speed. You're braking slightly earlier.",
            timestamp: "10:24 AM",
            hasAction: true
        }
    ])
    const [isLoading, setIsLoading] = React.useState(false)
    const [messageIdCounter, setMessageIdCounter] = React.useState(4)
    const scrollAreaRef = React.useRef<HTMLDivElement>(null)
    const endOfMessagesRef = React.useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        if (scrollAreaRef.current) {
            const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
            if (scrollElement) {
                scrollElement.scrollTop = scrollElement.scrollHeight
            }
        }
    }

    // Auto-scroll when messages change or during streaming
    React.useEffect(() => {
        scrollToBottom()
    }, [messages])

    // Additional scroll behavior for streaming
    React.useEffect(() => {
        if (isLoading) {
            const interval = setInterval(() => {
                scrollToBottom()
            }, 100) // Scroll every 100ms during loading

            return () => clearInterval(interval)
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

        // Generate unique IDs for all messages at once to avoid conflicts
        const newUserMsgId = messageIdCounter
        const aiPlaceholderId = messageIdCounter + 1
        const errorMsgId = messageIdCounter + 2

        // Add user message
        const userMsg: Message = {
            id: newUserMsgId,
            role: 'user',
            content: userMessage,
            timestamp: formatTimestamp()
        }
        
        setMessages(prev => [...prev, userMsg])
        setMessageIdCounter(prev => prev + 3) // Reserve IDs for user, AI response, and potential error
        setIsLoading(true)

        try {
            // Prepare messages for API (convert to OpenAI format)
            // We need to include all messages except the AI placeholder we just added
            const apiMessages = messages
                .filter(msg => msg.id !== aiPlaceholderId) // Exclude the AI placeholder
                .filter(msg => msg.role !== 'ai') // Filter out other ai messages, keep user and system
                .map(msg => ({
                    role: msg.role as 'user' | 'system',
                    content: msg.content
                }))
            
            // Add current user message
            apiMessages.push({
                role: 'user',
                content: userMessage
            })

            // Create placeholder for AI response
            const aiPlaceholder: Message = {
                id: aiPlaceholderId,
                role: 'ai',
                content: '',
                timestamp: formatTimestamp()
            }
            
            setMessages(prev => [...prev, aiPlaceholder])

            // Get AI response with streaming
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

            // Update the final message
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
            
            // Add error message
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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
                "flex flex-col h-full bg-card rounded-[20px] floaty-shadow overflow-hidden z-10",
                className
            )}
        >
            {/* Messages Area */}
            <ScrollArea ref={scrollAreaRef} className="flex-1 p-6">
                <div className="space-y-6">
                    {messages.map((msg) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={cn(
                                "flex gap-4 max-w-[85%]",
                                msg.role === "user" ? "ml-auto flex-row-reverse" : ""
                            )}
                        >
                            <Avatar className="h-8 w-8 mt-1 border border-white/10">
                                {msg.role === "ai" ? (
                                    <>
                                        <AvatarImage src="/ai-avatar.png" />
                                        <AvatarFallback className="bg-primary text-primary-foreground"><Sparkles className="h-4 w-4" /></AvatarFallback>
                                    </>
                                ) : (
                                    <>
                                        <AvatarImage src="/avatars/01.png" />
                                        <AvatarFallback>MV</AvatarFallback>
                                    </>
                                )}
                            </Avatar>

                            <div className={cn(
                                "flex flex-col gap-1",
                                msg.role === "user" ? "items-end" : "items-start"
                            )}>
                                <div className={cn(
                                    "p-4 rounded-2xl text-sm leading-relaxed shadow-sm",
                                    msg.role === "user"
                                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                                        : "bg-secondary text-secondary-foreground rounded-tl-sm"
                                )}>
                                    {msg.role === "ai" ? (
                                        <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-li:my-0 prose-code:text-xs prose-code:bg-muted prose-code:px-1 prose-code:rounded prose-pre:bg-muted prose-pre:p-2 prose-pre:rounded prose-pre:text-xs">
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                            >
                                                {msg.content}
                                            </ReactMarkdown>
                                        </div>
                                    ) : (
                                        msg.content
                                    )}
                                </div>

                                {msg.hasAction && (
                                    <Button variant="outline" size="sm" className="mt-2 gap-2 text-primary border-primary/20 hover:bg-primary/10">
                                        Show on Telemetry <ArrowRight className="h-3 w-3" />
                                    </Button>
                                )}

                                <span className="text-[10px] text-muted-foreground px-1">
                                    {msg.timestamp}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                    {/* Invisible element to scroll to */}
                    <div ref={endOfMessagesRef} />
                </div>
            </ScrollArea>

            {/* Input Area - Using KokonutUI AI_Prompt */}
            <div className="p-4 bg-card/50 backdrop-blur-md border-t border-white/5 flex-shrink-0">
                <div className="flex justify-center">
                    <AI_Prompt onSendMessage={handleSendMessage} disabled={isLoading} />
                </div>
            </div>
        </motion.div>
    )
}
