"use client"

import * as React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { TopBarLeft, TopBarRight } from "@/components/top-bar"
import { ChatInterface } from "@/components/chat-interface"
import { motion, AnimatePresence } from "framer-motion"
import { TelemetryPanel } from "@/components/telemetry-panel"
import { PanelLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TelemetryProvider } from "@/lib/telemetry-context"

interface MainLayoutProps {
    initialChatId?: string
}

export function MainLayout({ initialChatId }: MainLayoutProps) {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false)
    const [isTelemetryVisible, setIsTelemetryVisible] = React.useState(false)

    // Resizable panel state - chat starts at 35% (smaller), telemetry at 65% (larger)
    const [chatWidth, setChatWidth] = React.useState(35)
    const [isDragging, setIsDragging] = React.useState(false)
    const containerRef = React.useRef<HTMLDivElement>(null)

    // No initialization needed here - ChatInterface handles it all

    // Handle mouse move for resizing
    const handleMouseMove = React.useCallback((e: MouseEvent) => {
        if (!isDragging || !containerRef.current) return

        const container = containerRef.current
        const containerRect = container.getBoundingClientRect()
        const containerWidth = containerRect.width
        const mouseX = e.clientX - containerRect.left

        // Calculate new width percentage (min 20%, max 80%)
        let newWidth = (mouseX / containerWidth) * 100
        newWidth = Math.max(20, Math.min(80, newWidth))

        setChatWidth(newWidth)
    }, [isDragging])

    // Handle mouse up to stop dragging
    const handleMouseUp = React.useCallback(() => {
        setIsDragging(false)
    }, [])

    // Add event listeners for dragging
    React.useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove)
            document.addEventListener('mouseup', handleMouseUp)
            document.body.style.cursor = 'col-resize'
            document.body.style.userSelect = 'none'
        } else {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
            document.body.style.cursor = ''
            document.body.style.userSelect = ''
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
            document.body.style.cursor = ''
            document.body.style.userSelect = ''
        }
    }, [isDragging, handleMouseMove, handleMouseUp])

    const toggleTelemetry = React.useCallback(() => {
        setIsTelemetryVisible(prev => !prev)
    }, [])

    return (
        <TelemetryProvider>
            <SidebarProvider
                defaultOpen={!isSidebarCollapsed}
                open={!isSidebarCollapsed}
                onOpenChange={(open) => setIsSidebarCollapsed(!open)}
            >
                <main className="h-screen w-screen bg-background overflow-hidden flex">
                    {/* Sidebar Container */}
                    <div className="relative">
                        <AppSidebar
                            collapsed={isSidebarCollapsed}
                            onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                            logoUrl="/Logo/Logo.svg"
                            logoAlt="F1 Telemetry"
                            appName="F1 Tele"
                            projects={[]}
                        />

                        {/* Expand Button - Shows when sidebar is collapsed on desktop */}
                        {isSidebarCollapsed && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsSidebarCollapsed(false)}
                                className="hidden md:flex absolute left-[calc(4rem+24px+12px)] top-[30px] z-50 h-8 w-8 bg-card/80 backdrop-blur-sm border border-white/10 hover:bg-card hover:border-white/20 text-muted-foreground hover:text-foreground transition-all"
                            >
                                <PanelLeft className="h-4 w-4" />
                            </Button>
                        )}
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 flex flex-col min-w-0 pl-4 pr-6 pt-6 pb-6 mr-6">

                        {/* Top Bar Row - Always rendered but animates height/opacity */}
                        <motion.div
                            animate={{
                                height: isTelemetryVisible ? "72px" : "0px",
                                marginBottom: isTelemetryVisible ? "16px" : "0px",
                                opacity: isTelemetryVisible ? 1 : 0,
                            }}
                            transition={{
                                height: { duration: 0.4, delay: isTelemetryVisible ? 0.3 : 0.9, ease: [0.4, 0, 0.2, 1] },
                                marginBottom: { duration: 0.4, delay: isTelemetryVisible ? 0.3 : 0.9, ease: [0.4, 0, 0.2, 1] },
                                opacity: { duration: 0.3, delay: isTelemetryVisible ? 0.4 : 0.9 }
                            }}
                            className="flex gap-4 shrink-0 overflow-hidden"
                        >
                            <motion.div
                                animate={{
                                    y: isTelemetryVisible ? 0 : -20
                                }}
                                transition={{ duration: 0.4, delay: isTelemetryVisible ? 0.3 : 0.9 }}
                                className="flex gap-4 w-full h-[72px]"
                            >
                                <TopBarLeft className="flex-1" />
                                <TopBarRight className="shrink-0" />
                            </motion.div>
                        </motion.div>

                        {/* Content Row - Resizable Split */}
                        <div
                            ref={containerRef}
                            className="flex-1 flex min-h-0 relative"
                        >
                            {/* Chat Panel - Animates width */}
                            <motion.div
                                animate={{
                                    width: isTelemetryVisible ? `${chatWidth}%` : "100%"
                                }}
                                transition={{
                                    duration: 0.5,
                                    delay: isTelemetryVisible ? 0 : 0.4, // Wait for panel content fade on exit
                                    ease: [0.4, 0, 0.2, 1]
                                }}
                                className="min-w-0 h-full"
                            >
                                <ChatInterface
                                    className="h-full"
                                    chatId={initialChatId}
                                    isTelemetryVisible={isTelemetryVisible}
                                    onToggleTelemetry={toggleTelemetry}
                                />
                            </motion.div>

                            {/* Resizable Divider - Only when telemetry visible */}
                            <AnimatePresence>
                                {isTelemetryVisible && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{
                                            duration: 0.3,
                                            delay: isTelemetryVisible ? 0 : 0.9 // Wait for panel to close before fading out
                                        }}
                                        className="relative flex items-center justify-center w-4 cursor-col-resize group hover:bg-white/5 transition-colors"
                                        onMouseDown={() => setIsDragging(true)}
                                    >
                                        {/* Visual indicator */}
                                        <div className="w-1 h-12 bg-white/10 rounded-full group-hover:bg-white/20 transition-colors" />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Telemetry Panel - Slide in/out as solid block */}
                            <AnimatePresence>
                                {isTelemetryVisible && (
                                    <motion.div
                                        initial={{ width: 0, opacity: 1 }} // Start with 0 width but full opacity (solid block)
                                        animate={{
                                            width: `${100 - chatWidth - 1}%`,
                                            opacity: 1
                                        }}
                                        exit={{
                                            width: 0,
                                            opacity: 1,
                                            transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1], delay: 0.4 } // Delay exit to let content fade out
                                        }}
                                        transition={{
                                            duration: 0.5,
                                            ease: [0.4, 0, 0.2, 1]
                                        }}
                                        className="min-w-0 h-full overflow-hidden" // overflow-hidden is crucial for sliding effect
                                    >
                                        <div className="w-full h-full min-w-[500px]"> {/* Ensure content has width during slide */}
                                            <TelemetryPanel className="h-full" />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                    </div>
                </main>
            </SidebarProvider>
        </TelemetryProvider>
    )
}
