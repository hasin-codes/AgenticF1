"use client"

import * as React from "react"
import { Bell, User, Settings, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { motion } from "framer-motion"
import BasicDropdown from "@/components/smoothui/basic-dropdown"

// --- Top Bar Left: Context Controls ---

export function TopBarLeft({ className }: { className?: string }) {
    const yearItems = [
        { id: "2025", label: "2025" },
        { id: "2024", label: "2024" },
        { id: "2023", label: "2023" },
        { id: "2022", label: "2022" },
    ]

    const gpItems = [
        { id: "bahrain", label: "🇧🇭 Bahrain GP" },
        { id: "saudi", label: "🇸🇦 Saudi Arabian GP" },
        { id: "australia", label: "🇦🇺 Australian GP" },
        { id: "monaco", label: "🇲🇨 Monaco GP" },
        { id: "silverstone", label: "🇬🇧 British GP" },
    ]

    const sessionTypes = ["Race", "Quali", "FP1", "FP2", "FP3"]
    const [activeSession, setActiveSession] = React.useState("Race")

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "h-[72px] flex items-center gap-4 px-6 bg-card border border-white/5 rounded-[18px] floaty-shadow z-20",
                className
            )}
        >
            {/* Year Selector */}
            <div className="flex items-center">
                <BasicDropdown
                    label="2024"
                    items={yearItems}
                    onChange={(item) => console.log("Year selected:", item)}
                    className="w-[100px]"
                />
            </div>

            <div className="h-8 w-px bg-white/10" />

            {/* GP Selector */}
            <div className="flex items-center">
                <BasicDropdown
                    label="🇲🇨 Monaco GP"
                    items={gpItems}
                    onChange={(item) => console.log("GP selected:", item)}
                    className="w-[200px]"
                />
            </div>

            <div className="h-8 w-px bg-white/10" />

            {/* Session Type */}
            <div className="flex bg-secondary/50 p-1 rounded-lg">
                {sessionTypes.map((session) => (
                    <button
                        key={session}
                        onClick={() => setActiveSession(session)}
                        className={cn(
                            "px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200",
                            session === activeSession
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                        )}
                    >
                        {session}
                    </button>
                ))}
            </div>

            <div className="h-8 w-px bg-white/10" />

            {/* Drivers Multi-Select (Simplified for now) */}
            <BasicDropdown
                label="2 Drivers Selected"
                items={[
                    { id: "ver", label: "Max Verstappen", icon: <div className="w-3 h-3 rounded-full bg-blue-500" /> },
                    { id: "lec", label: "Charles Leclerc", icon: <div className="w-3 h-3 rounded-full bg-red-500" /> },
                    { id: "ham", label: "Lewis Hamilton", icon: <div className="w-3 h-3 rounded-full bg-teal-500" /> },
                    { id: "nor", label: "Lando Norris", icon: <div className="w-3 h-3 rounded-full bg-orange-500" /> },
                ]}
                onChange={(item) => console.log("Driver selected:", item)}
                className="w-[180px]"
            />
        </motion.div>
    )
}

// --- Top Bar Right: User Controls ---

export function TopBarRight({ className }: { className?: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "h-[72px] w-[320px] flex items-center justify-end gap-6 px-6 bg-card border border-white/5 rounded-[18px] floaty-shadow z-20",
                className
            )}
        >
            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
                <Bell className="h-5 w-5" />
                <span className="absolute top-2 right-2 h-2 w-2 bg-destructive rounded-full border border-card" />
            </Button>

            <div className="h-8 w-px bg-white/10" />

            {/* User Profile */}
            <div className="flex items-center gap-3">
                <div className="text-right hidden md:block">
                    <p className="text-sm font-medium leading-none">Max V.</p>
                    <p className="text-xs text-muted-foreground mt-1">Red Bull Racing</p>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                            <Avatar className="h-10 w-10 border border-white/10">
                                <AvatarImage src="/avatars/01.png" alt="@maxv" />
                                <AvatarFallback>MV</AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 bg-popover border-border" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">Max Verstappen</p>
                                <p className="text-xs leading-none text-muted-foreground">
                                    max@redbull.com
                                </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="hover:bg-accent hover:text-accent-foreground">
                            <User className="mr-2 h-4 w-4" />
                            <span>Profile</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="hover:bg-accent hover:text-accent-foreground">
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Settings</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive hover:bg-destructive/10">
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </motion.div>
    )
}
