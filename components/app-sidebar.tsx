'use client'

/**
 * APP SIDEBAR COMPONENT
 * ===========================
 * 
 * This is a fully responsive sidebar component that works seamlessly on both
 * mobile and desktop devices. It includes:
 * - Mobile: Slide-in overlay sidebar with backdrop
 * - Desktop: Collapsible sidebar with hover-to-expand functionality
 * 
 * MOBILE BEHAVIOR:
 * - Fixed overlay that slides in from the left
 * - Dark backdrop (60% opacity) when open
 * - Full width sidebar (280px, max 85vw)
 * - Closes when clicking outside or on close button
 * - Prevents body scroll when open
 * - Touch-friendly interactions
 * 
 * DESKTOP BEHAVIOR:
 * - Collapsible sidebar (64px when collapsed, 256px when expanded)
 * - Hover to expand when collapsed
 * - Smooth width transitions (300ms)
 * - Maintains expanded state when profile dropdown is open
 * - Icon-only mode when collapsed, full labels when expanded
 * 
 * USAGE:
 * ```tsx
 * const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
 * 
 * <AppSidebar
 *   collapsed={sidebarCollapsed}
 *   onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
 *   projects={yourProjects}
 *   chats={yourChats}
 *   selectedProject={selectedProject}
 *   selectedChat={selectedChat}
 *   onProjectSelect={handleProjectSelect}
 *   onChatSelect={handleChatSelect}
 *   onProjectCreate={handleProjectCreate}
 *   onChatCreate={handleChatCreate}
 *   onSettingsClick={handleSettingsClick}
 * />
 * ```
 */

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { FolderOpen, MessageSquare, Plus, HelpCircle, Settings, X, PanelLeftIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ProfileDropdown from '@/components/profile-dropdown'
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarSeparator,
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface Project {
    id: string
    name: string
    lastModified: string
}

export interface ChatHistory {
    id: string
    title: string
    timestamp: string
}

interface AppSidebarProps {
    collapsed: boolean
    onToggle: () => void
    onHoverChange?: (isHovered: boolean) => void
    projects?: Project[]
    chats?: ChatHistory[]
    selectedProject?: string
    selectedChat?: string
    onProjectSelect?: (projectId: string) => void
    onChatSelect?: (chatId: string) => void
    onProjectCreate?: (name: string) => void
    onChatCreate?: () => void
    onProjectRename?: (projectId: string, name: string) => void
    onChatRename?: (chatId: string, name: string) => void
    onSettingsClick?: () => void
    // Optional: Customize logo
    logoUrl?: string
    logoAlt?: string
    appName?: string
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AppSidebar({
    collapsed,
    onToggle,
    onHoverChange,
    projects: propsProjects,
    chats: propsChats,
    selectedProject: propsSelectedProject,
    selectedChat: propsSelectedChat,
    onProjectSelect: propsOnProjectSelect,
    onChatSelect: propsOnChatSelect,
    onProjectCreate,
    onChatCreate,
    onProjectRename,
    onChatRename,
    onSettingsClick,
    logoUrl = "/ZplitGPT.svg", // Default logo - customize for your project
    logoAlt = "App Logo",
    appName = "ZplitGPT" // Default app name - customize for your project
}: AppSidebarProps) {

    // ========================================================================
    // MOBILE DETECTION & STATE
    // ========================================================================
    const isMobile = useIsMobile()
    const [isHovered, setIsHovered] = useState(false)
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)

    // ========================================================================
    // EXPANSION LOGIC
    // ========================================================================
    // MOBILE: Always expanded when sidebar is open (not collapsed)
    // DESKTOP: Expanded only when explicitly toggled (no hover)
    const isExpanded = isMobile
        ? !collapsed
        : !collapsed

    const [projectsExpanded, setProjectsExpanded] = useState(false)

    // ========================================================================
    // MOBILE: PREVENT BODY SCROLL WHEN SIDEBAR IS OPEN
    // ========================================================================
    // This prevents the background content from scrolling when the sidebar
    // overlay is open on mobile devices
    useEffect(() => {
        if (isMobile && !collapsed) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => {
            document.body.style.overflow = ''
        }
    }, [isMobile, collapsed])

    // ========================================================================
    // DEFAULT DATA (if props not provided)
    // ========================================================================
    const projects: Project[] = propsProjects || [
        { id: 'default', name: 'Default Workspace', lastModified: '2 hours ago' },
        { id: 'quantum-computing', name: 'Quantum Computing', lastModified: '1 day ago' },
        { id: 'api-design', name: 'API Design', lastModified: '3 days ago' },
        { id: 'code-review', name: 'Code Review', lastModified: '1 week ago' }
    ]

    const chatHistory: ChatHistory[] = propsChats || [
        { id: 'chat-1', title: 'Quantum computing basics', timestamp: '10:30 AM' },
        { id: 'chat-2', title: 'React hooks optimization', timestamp: '9:45 AM' },
        { id: 'chat-3', title: 'Database schema design', timestamp: 'Yesterday' },
        { id: 'chat-4', title: 'TypeScript best practices', timestamp: 'Yesterday' },
        { id: 'chat-5', title: 'API authentication patterns', timestamp: '2 days ago' },
        { id: 'chat-6', title: 'Performance optimization', timestamp: '3 days ago' }
    ]

    const selectedProject = propsSelectedProject ?? 'default'
    const selectedChat = propsSelectedChat ?? 'chat-1'

    const setSelectedProject = propsOnProjectSelect || (() => { })
    const setSelectedChat = propsOnChatSelect || (() => { })

    // ========================================================================
    // DESKTOP: HOVER HANDLERS
    // ========================================================================
    // These handlers manage the hover state for desktop expansion
    const handleMouseEnter = () => {
        if (!isMobile) {
            setIsHovered(true)
            onHoverChange?.(true)
        }
    }

    const handleMouseLeave = () => {
        if (!isMobile) {
            // Don't collapse if profile dropdown is open
            if (!isProfileDropdownOpen) {
                setIsHovered(false)
                onHoverChange?.(false)
            }
        }
    }

    // ========================================================================
    // PROFILE DROPDOWN STATE MANAGEMENT
    // ========================================================================
    // Keeps sidebar expanded when profile dropdown is open (desktop only)
    const handleProfileDropdownOpenChange = (open: boolean) => {
        setIsProfileDropdownOpen(open)
    }

    // ========================================================================
    // SHARED SIDEBAR CONTENT (USED BY BOTH MOBILE AND DESKTOP)
    // ========================================================================
    const renderSidebarContent = () => (
        <>
            {/* ================================================================== */}
            {/* HEADER SECTION - Logo and App Name */}
            {/* ================================================================== */}
            <SidebarHeader className={cn("border-b border-[#1a1a1a] relative w-full transition-all duration-300", isExpanded ? "p-4" : "p-2")}>
                <div className={cn("flex items-center relative", isExpanded ? "justify-between" : "justify-center h-10")}>
                    <div className={cn("flex items-center relative", isExpanded ? "flex-1" : "justify-center w-full")}>
                        {/* Logo - Always visible */}
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 overflow-hidden bg-[#1a1a1a]">
                            <Image
                                src={logoUrl}
                                alt={logoAlt}
                                width={20}
                                height={20}
                                className="w-5 h-5 object-contain"
                            />
                        </div>
                        {/* App Name - Only visible when expanded */}
                        <div className={cn(
                            "ml-3 flex flex-col transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap",
                            isExpanded ? "w-auto opacity-100" : "w-0 opacity-0"
                        )}>
                            <span className="text-[#f5f5f5] font-bold text-lg leading-none">
                                {appName}
                            </span>
                            <span className="text-[#666666] text-xs font-medium">
                                Telemetry
                            </span>
                        </div>
                    </div>
                    {/* DESKTOP: Collapse toggle button - Only visible on desktop when expanded */}
                    {!isMobile && isExpanded && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onToggle}
                            className="h-6 w-6 text-[#666666] hover:text-[#f5f5f5] hover:bg-[#1a1a1a] shrink-0 ml-2"
                        >
                            <PanelLeftIcon className="h-4 w-4" />
                        </Button>
                    )}
                    {/* MOBILE: Close button (X) - Only visible on mobile */}
                    {isMobile && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onToggle}
                            className="h-8 w-8 text-[#b3b3b3] hover:text-[#f5f5f5] hover:bg-[#1a1a1a] shrink-0 ml-2"
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    )}
                </div>
            </SidebarHeader>

            {/* ================================================================== */}
            {/* MAIN CONTENT AREA - Scrollable */}
            {/* ================================================================== */}
            <SidebarContent className="flex-1 overflow-y-auto overflow-x-hidden relative">

                {/* ============================================================== */}
                {/* PROJECTS SECTION */}
                {/* ============================================================== */}
                <SidebarGroup>
                    {/* Header - Only visible when expanded */}
                    {isExpanded && (
                        <div className="flex items-center justify-between mb-2 px-2">
                            <SidebarGroupLabel className="text-[#666666] flex items-center font-medium text-xs uppercase tracking-wider">
                                Projects
                            </SidebarGroupLabel>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-[#666666] hover:text-[#ff4f2b] hover:bg-[#151515] p-1 h-6 w-6 shrink-0"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onProjectCreate?.('New Project')
                                }}
                            >
                                <Plus className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                    )}
                    {/* Projects list - Collapsible with smooth animation */}
                    <SidebarGroupContent
                        className={cn(
                            "overflow-hidden transition-all duration-300 ease-in-out",
                            projectsExpanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
                        )}
                    >
                        <SidebarMenu>
                            {projects.map((project) => (
                                <SidebarMenuItem key={project.id}>
                                    <SidebarMenuButton
                                        onClick={() => {
                                            setSelectedProject(project.id)
                                            // MOBILE: Close sidebar when selecting a project
                                            if (isMobile) {
                                                onToggle()
                                            }
                                        }}
                                        isActive={selectedProject === project.id}
                                        tooltip={!isExpanded ? project.name : undefined}
                                        className={cn(
                                            "rounded-lg cursor-pointer transition-all duration-200 ease-in-out relative group",
                                            isExpanded ? "p-2" : "p-0 justify-center h-10 w-10 mx-auto",
                                            selectedProject === project.id
                                                ? 'bg-[#1a1a1a] text-[#f5f5f5]'
                                                : 'text-[#888888] hover:text-[#f5f5f5] hover:bg-[#1a1a1a]'
                                        )}
                                    >
                                        {/* Active indicator - Orange accent */}
                                        {selectedProject === project.id && (
                                            <div className={cn(
                                                "absolute bg-[#ff4f2b] rounded-full",
                                                isExpanded
                                                    ? "left-0 top-1/2 -translate-y-1/2 w-1 h-4 rounded-r-full"
                                                    : "top-1 right-1 w-1.5 h-1.5"
                                            )} />
                                        )}

                                        <div className={cn("flex items-center w-full", isExpanded ? "gap-3" : "justify-center")}>
                                            <FolderOpen className={cn("shrink-0", isExpanded ? "w-4 h-4" : "w-5 h-5")} />

                                            {isExpanded && (
                                                <span className="text-sm font-medium truncate">
                                                    {project.name}
                                                </span>
                                            )}
                                        </div>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarSeparator className="bg-[#1a1a1a]" />

                {/* ============================================================== */}
                {/* CHAT HISTORY SECTION */}
                {/* ============================================================== */}
                <SidebarGroup>
                    {/* Header - Only visible when expanded */}
                    {isExpanded && (
                        <div className="flex items-center justify-between mb-2 px-2">
                            <SidebarGroupLabel className="text-[#666666] flex items-center font-medium text-xs uppercase tracking-wider">
                                Recent Chats
                            </SidebarGroupLabel>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-[#666666] hover:text-[#ff4f2b] hover:bg-[#151515] p-1 h-6 w-6 shrink-0"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onChatCreate?.()
                                }}
                            >
                                <Plus className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                    )}
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {chatHistory.map((chat) => (
                                <SidebarMenuItem key={chat.id}>
                                    <SidebarMenuButton
                                        onClick={() => {
                                            setSelectedChat(chat.id)
                                            // MOBILE: Close sidebar when selecting a chat
                                            if (isMobile) {
                                                onToggle()
                                            }
                                        }}
                                        isActive={selectedChat === chat.id}
                                        tooltip={!isExpanded ? chat.title : undefined}
                                        className={cn(
                                            "rounded-lg cursor-pointer transition-all duration-200 ease-in-out relative group",
                                            isExpanded ? "p-2" : "p-0 justify-center h-10 w-10 mx-auto",
                                            selectedChat === chat.id
                                                ? 'bg-[#1a1a1a] text-[#f5f5f5]'
                                                : 'text-[#888888] hover:text-[#f5f5f5] hover:bg-[#1a1a1a]'
                                        )}
                                    >
                                        {/* Active indicator - Orange accent */}
                                        {selectedChat === chat.id && (
                                            <div className={cn(
                                                "absolute bg-[#ff4f2b] rounded-full",
                                                isExpanded
                                                    ? "left-0 top-1/2 -translate-y-1/2 w-1 h-4 rounded-r-full"
                                                    : "top-1 right-1 w-1.5 h-1.5"
                                            )} />
                                        )}

                                        <div className={cn("flex items-center w-full", isExpanded ? "gap-3" : "justify-center")}>
                                            <MessageSquare className={cn("shrink-0", isExpanded ? "w-4 h-4" : "w-5 h-5")} />

                                            {isExpanded && (
                                                <span className="text-sm font-medium truncate">
                                                    {chat.title}
                                                </span>
                                            )}
                                        </div>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            {/* ================================================================== */}
            {/* FOOTER SECTIONS - Help, Settings, Profile */}
            {/* ================================================================== */}

            {/* Help Icon */}
            <div className={cn("py-2 border-t border-[#1a1a1a]", isExpanded ? "px-4" : "px-2")}>
                <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                        "w-full hover:text-[#f5f5f5] hover:bg-[#1a1a1a] relative transition-all duration-200",
                        isExpanded ? "justify-start text-[#b3b3b3] px-3 h-10" : "justify-center text-[#b3b3b3] px-0 h-10 w-10 mx-auto rounded-lg"
                    )}
                >
                    <HelpCircle
                        className="w-5 h-5 shrink-0"
                    />
                    {/* Help label - Only visible when expanded */}
                    {isExpanded && (
                        <span className="ml-3 whitespace-nowrap">
                            Help
                        </span>
                    )}
                </Button>
            </div>

            {/* Settings Icon */}
            <div className={cn("py-2 border-t border-[#1a1a1a]", isExpanded ? "px-4" : "px-2")}>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                        onSettingsClick?.()
                        // MOBILE: Close sidebar when opening settings
                        if (isMobile) {
                            onToggle()
                        }
                    }}
                    className={cn(
                        "w-full hover:text-[#f5f5f5] hover:bg-[#1a1a1a] relative transition-all duration-200",
                        isExpanded ? "justify-start text-[#b3b3b3] px-3 h-10" : "justify-center text-[#b3b3b3] px-0 h-10 w-10 mx-auto rounded-lg"
                    )}
                >
                    <Settings
                        className="w-5 h-5 shrink-0"
                    />
                    {/* Settings label - Only visible when expanded */}
                    {isExpanded && (
                        <span className="ml-3 whitespace-nowrap">
                            Settings
                        </span>
                    )}
                </Button>
            </div>

            {/* User Profile Dropdown */}
            <div className={cn("py-2 border-t border-[#1a1a1a]", isExpanded ? "px-4" : "px-2")}>
                {isExpanded ? (
                    <div
                        style={!isMobile ? {
                            clipPath: isExpanded ? 'inset(0)' : 'inset(0 100% 0 0)',
                            transition: 'clip-path 300ms ease-in-out'
                        } : {}}
                    >
                        <ProfileDropdown
                            className="w-full"
                            onOpenChange={handleProfileDropdownOpenChange}
                        />
                    </div>
                ) : (
                    <div className="flex justify-center">
                        <ProfileDropdown
                            className="w-auto"
                            collapsed={true}
                            onOpenChange={handleProfileDropdownOpenChange}
                            data={{
                                name: "Eugene An",
                                email: "eugene@kokonutui.com",
                                avatar: "/Demo avatar/Avatar.webP",
                                subscription: "PRO",
                                model: "Gemini 2.0 Flash"
                            }}
                        />
                    </div>
                )}
            </div>
        </>
    )

    // ========================================================================
    // MOBILE RENDERING: Fixed overlay sidebar
    // ========================================================================
    // On mobile, the sidebar is a fixed overlay that slides in from the left
    // with a dark backdrop. It covers the entire screen height.
    if (isMobile) {
        return (
            <>
                {/* Backdrop overlay - Only visible when sidebar is open */}
                {!collapsed && (
                    <div
                        className="fixed inset-0 bg-black/60 z-60 transition-opacity duration-300 ease-in-out"
                        onClick={onToggle}
                        onTouchEnd={onToggle}
                        aria-hidden="true"
                    />
                )}

                {/* Sidebar container - Slides in from left */}
                <div
                    className={cn(
                        "fixed left-0 top-6 bottom-6 w-[280px] max-w-[85vw] bg-[#0a0a0a] border-r border-[#1a1a1a] z-70",
                        "flex flex-col transition-transform duration-300 ease-in-out",
                        "shadow-2xl rounded-[20px] border border-white/5 overflow-hidden",
                        collapsed ? "-translate-x-full" : "translate-x-0",
                        collapsed && "pointer-events-none"
                    )}
                    style={{
                        height: 'calc(100svh - 48px)'
                    }}
                    onClick={(e) => {
                        // Prevent clicks inside sidebar from closing it
                        e.stopPropagation()
                    }}
                    onTouchStart={(e) => {
                        // Prevent touch events from closing sidebar
                        e.stopPropagation()
                    }}
                    aria-hidden={collapsed}
                >
                    {renderSidebarContent()}
                </div>
            </>
        )
    }

    // ========================================================================
    // DESKTOP RENDERING: Collapsible sidebar (no hover)
    // ========================================================================
    // On desktop, the sidebar can collapse to icon-only mode (72px) and
    // expands only when explicitly toggled.
    return (
        <div className="h-full">
            <Sidebar
                side="left"
                variant="sidebar"
                collapsible="icon"
                className="h-full bg-[#0a0a0a] border-r border-[#1a1a1a] overflow-x-hidden"
            >
                {renderSidebarContent()}
            </Sidebar>
        </div>
    )
}
