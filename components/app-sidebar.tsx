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
    logoUrl = "/ZplitGPT.svg",
    logoAlt = "App Logo",
    appName = "ZplitGPT"
}: AppSidebarProps) {

    const isMobile = useIsMobile()
    const [isHovered, setIsHovered] = useState(false)
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)

    const isExpanded = isMobile ? !collapsed : !collapsed
    const [projectsExpanded, setProjectsExpanded] = useState(true) // Default to true for better UX

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

    const handleProfileDropdownOpenChange = (open: boolean) => {
        setIsProfileDropdownOpen(open)
    }

    const renderSidebarContent = () => (
        <>
            {/* HEADER SECTION */}
            <SidebarHeader className={cn(
                "border-b border-white/5 relative w-full transition-[padding] duration-300 ease-in-out",
                isExpanded ? "p-4" : "p-2"
            )}>
                <div className={cn(
                    "flex items-center relative transition-[justify-content] duration-300",
                    isExpanded ? "justify-between" : "justify-center h-10"
                )}>
                    <div className={cn(
                        "flex items-center relative overflow-hidden transition-[width,opacity] duration-300",
                        isExpanded ? "flex-1 opacity-100" : "w-0 opacity-0 hidden"
                    )}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 overflow-hidden bg-white/5 border border-white/10">
                            <Image
                                src={logoUrl}
                                alt={logoAlt}
                                width={20}
                                height={20}
                                className="w-5 h-5 object-contain"
                            />
                        </div>
                        <div className="ml-3 flex flex-col overflow-hidden whitespace-nowrap">
                            <span className="text-zinc-100 font-bold text-lg leading-none tracking-tight">
                                {appName}
                            </span>
                            <span className="text-zinc-500 text-[10px] font-medium uppercase tracking-wider mt-0.5">
                                Telemetry
                            </span>
                        </div>
                    </div>

                    {/* Collapsed State Logo/Toggle */}
                    {!isExpanded && !isMobile && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onToggle}
                            className="h-9 w-9 text-zinc-400 hover:text-white hover:bg-white/5 shrink-0 rounded-lg"
                        >
                            <PanelLeftIcon className="h-5 w-5" />
                        </Button>
                    )}

                    {/* Expanded State Toggle */}
                    {!isMobile && isExpanded && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onToggle}
                            className="h-6 w-6 text-zinc-500 hover:text-white hover:bg-white/5 shrink-0 ml-2"
                        >
                            <PanelLeftIcon className="h-4 w-4 rotate-180 transition-transform duration-300" />
                        </Button>
                    )}

                    {/* Mobile Close */}
                    {isMobile && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onToggle}
                            className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-white/5 shrink-0 ml-auto"
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    )}
                </div>
            </SidebarHeader>

            {/* MAIN CONTENT */}
            <SidebarContent className="flex-1 overflow-y-auto overflow-x-hidden relative scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">

                {/* PROJECTS */}
                <SidebarGroup>
                    {isExpanded && (
                        <div className="flex items-center justify-between mb-2 px-2 group/label">
                            <SidebarGroupLabel className="text-zinc-500 flex items-center font-medium text-[10px] uppercase tracking-wider transition-colors group-hover/label:text-zinc-300">
                                Projects
                            </SidebarGroupLabel>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-zinc-500 hover:text-red-400 hover:bg-red-500/10 p-1 h-5 w-5 shrink-0 opacity-0 group-hover/label:opacity-100 transition-opacity"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onProjectCreate?.('New Project')
                                }}
                            >
                                <Plus className="w-3 h-3" />
                            </Button>
                        </div>
                    )}
                    <SidebarGroupContent className={cn(
                        "overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out",
                        projectsExpanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
                    )}>
                        <SidebarMenu>
                            {projects.map((project) => (
                                <SidebarMenuItem key={project.id}>
                                    <SidebarMenuButton
                                        onClick={() => {
                                            setSelectedProject(project.id)
                                            if (isMobile) onToggle()
                                        }}
                                        isActive={selectedProject === project.id}
                                        tooltip={!isExpanded ? project.name : undefined}
                                        className={cn(
                                            "rounded-lg cursor-pointer transition-all duration-200 ease-out relative group border border-transparent",
                                            isExpanded ? "px-3 py-2" : "p-0 justify-center h-10 w-10 mx-auto",
                                            selectedProject === project.id
                                                ? 'bg-gradient-to-r from-red-500/10 to-transparent border-l-red-500 border-l-2 text-red-100'
                                                : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5'
                                        )}
                                    >
                                        <div className={cn("flex items-center w-full", isExpanded ? "gap-3" : "justify-center")}>
                                            <FolderOpen className={cn(
                                                "shrink-0 transition-colors",
                                                isExpanded ? "w-4 h-4" : "w-5 h-5",
                                                selectedProject === project.id ? "text-red-400" : "text-zinc-500 group-hover:text-zinc-300"
                                            )} />
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

                <SidebarSeparator className="bg-white/5 my-2" />

                {/* CHATS */}
                <SidebarGroup>
                    {isExpanded && (
                        <div className="flex items-center justify-between mb-2 px-2 group/label">
                            <SidebarGroupLabel className="text-zinc-500 flex items-center font-medium text-[10px] uppercase tracking-wider transition-colors group-hover/label:text-zinc-300">
                                Recent Chats
                            </SidebarGroupLabel>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-zinc-500 hover:text-red-400 hover:bg-red-500/10 p-1 h-5 w-5 shrink-0 opacity-0 group-hover/label:opacity-100 transition-opacity"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onChatCreate?.()
                                }}
                            >
                                <Plus className="w-3 h-3" />
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
                                            if (isMobile) onToggle()
                                        }}
                                        isActive={selectedChat === chat.id}
                                        tooltip={!isExpanded ? chat.title : undefined}
                                        className={cn(
                                            "rounded-lg cursor-pointer transition-all duration-200 ease-out relative group border border-transparent",
                                            isExpanded ? "px-3 py-2" : "p-0 justify-center h-10 w-10 mx-auto",
                                            selectedChat === chat.id
                                                ? 'bg-gradient-to-r from-red-500/10 to-transparent border-l-red-500 border-l-2 text-red-100'
                                                : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5'
                                        )}
                                    >
                                        <div className={cn("flex items-center w-full", isExpanded ? "gap-3" : "justify-center")}>
                                            <MessageSquare className={cn(
                                                "shrink-0 transition-colors",
                                                isExpanded ? "w-4 h-4" : "w-5 h-5",
                                                selectedChat === chat.id ? "text-red-400" : "text-zinc-500 group-hover:text-zinc-300"
                                            )} />
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

            {/* FOOTER */}
            <div className="mt-auto border-t border-white/5 bg-black/20">
                {/* Help */}
                <div className={cn("py-2", isExpanded ? "px-3" : "px-2")}>
                    <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                            "w-full hover:text-white hover:bg-white/5 relative transition-all duration-200",
                            isExpanded ? "justify-start text-zinc-400 px-3 h-9" : "justify-center text-zinc-400 px-0 h-9 w-9 mx-auto rounded-lg"
                        )}
                    >
                        <HelpCircle className="w-4 h-4 shrink-0" />
                        {isExpanded && <span className="ml-3 text-sm">Help</span>}
                    </Button>
                </div>

                {/* Settings */}
                <div className={cn("py-2", isExpanded ? "px-3" : "px-2")}>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            onSettingsClick?.()
                            if (isMobile) onToggle()
                        }}
                        className={cn(
                            "w-full hover:text-white hover:bg-white/5 relative transition-all duration-200",
                            isExpanded ? "justify-start text-zinc-400 px-3 h-9" : "justify-center text-zinc-400 px-0 h-9 w-9 mx-auto rounded-lg"
                        )}
                    >
                        <Settings className="w-4 h-4 shrink-0" />
                        {isExpanded && <span className="ml-3 text-sm">Settings</span>}
                    </Button>
                </div>

                {/* Profile */}
                <div className={cn("py-3", isExpanded ? "px-3" : "px-2")}>
                    <ProfileDropdown
                        className={cn("w-full", !isExpanded && "justify-center")}
                        collapsed={!isExpanded}
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
            </div>
        </>
    )

    if (isMobile) {
        return (
            <>
                {!collapsed && (
                    <div
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 transition-opacity duration-300"
                        onClick={onToggle}
                        aria-hidden="true"
                    />
                )}
                <div
                    className={cn(
                        "fixed left-0 top-0 bottom-0 w-[280px] bg-[#0A0A0A] border-r border-white/10 z-50",
                        "flex flex-col transition-transform duration-300 ease-out shadow-2xl",
                        collapsed ? "-translate-x-full" : "translate-x-0"
                    )}
                >
                    {renderSidebarContent()}
                </div>
            </>
        )
    }

    return (
        <div className="h-full">
            <Sidebar
                side="left"
                variant="sidebar"
                collapsible="icon"
                className="h-full bg-[#0A0A0A] border-r border-white/5 overflow-x-hidden"
            >
                {renderSidebarContent()}
            </Sidebar>
        </div>
    )
}
