"use client"

import * as React from "react"
import { AppSidebar, ChatHistory } from "@/components/app-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { TopBarLeft, TopBarRight } from "@/components/top-bar"
import { ChatInterface } from "@/components/chat-interface"
import { TelemetryPanel } from "@/components/telemetry-panel"
import { PanelLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Home() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false)
  const [selectedChat, setSelectedChat] = React.useState("chat-1")

  // Resizable panel state - chat starts at 35% (smaller), telemetry at 65% (larger)
  const [chatWidth, setChatWidth] = React.useState(35)
  const [isDragging, setIsDragging] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  // F1 Telemetry chat history
  const chats: ChatHistory[] = [
    { id: "chat-1", title: "Verstappen Lap 34 Analysis", timestamp: "2m ago" },
    { id: "chat-2", title: "Mercedes Tire Degradation", timestamp: "1h ago" },
    { id: "chat-3", title: "Q3 Sector 2 Comparison", timestamp: "Yesterday" },
    { id: "chat-4", title: "Ferrari Strategy Review", timestamp: "2d ago" },
    { id: "chat-5", title: "Monaco GP Telemetry", timestamp: "3d ago" },
  ]

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

  return (
    <SidebarProvider
      defaultOpen={!isSidebarCollapsed}
      open={!isSidebarCollapsed}
      onOpenChange={(open) => setIsSidebarCollapsed(!open)}
    >
      <main className="h-screen w-screen bg-background overflow-hidden flex">
        {/* Sidebar Container - Gaps are now handled within the sidebar component */}
        <div className="relative">
          <AppSidebar
            collapsed={isSidebarCollapsed}
            onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            chats={chats}
            selectedChat={selectedChat}
            onChatSelect={setSelectedChat}
            onChatCreate={() => console.log("Create new telemetry analysis")}
            onSettingsClick={() => console.log("Settings clicked")}
            logoUrl="/f1-logo.svg"
            logoAlt="F1 Telemetry"
            appName="F1 Tele"
            // Hide projects section by passing empty array
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

        {/* Main Content Area - Left padding changed from pl-6 to pl-4 to match gap-4 */}
        <div className="flex-1 flex flex-col min-w-0 pl-4 pr-6 pt-6 pb-6 mr-6">

          {/* Top Bar Row */}
          <div className="flex gap-4 h-[72px] shrink-0 mb-4">
            <TopBarLeft className="flex-1" />
            <TopBarRight className="shrink-0" />
          </div>

          {/* Content Row - Resizable Split */}
          <div
            ref={containerRef}
            className="flex-1 flex min-h-0 relative"
          >
            {/* Chat Panel - Now smaller (left side) */}
            <div
              style={{ width: `${chatWidth}%` }}
              className="min-w-0"
            >
              <ChatInterface className="h-full" />
            </div>

            {/* Resizable Divider */}
            <div
              className="relative flex items-center justify-center w-4 cursor-col-resize group hover:bg-white/5 transition-colors"
              onMouseDown={() => setIsDragging(true)}
            >
              {/* Visual indicator */}
              <div className="w-1 h-12 bg-white/10 rounded-full group-hover:bg-white/20 transition-colors" />
            </div>

            {/* Telemetry Panel - Now larger (right side) */}
            <div
              style={{ width: `${100 - chatWidth - 1}%` }}
              className="min-w-0"
            >
              <TelemetryPanel className="h-full" />
            </div>
          </div>

        </div>
      </main>
    </SidebarProvider>
  )
}
