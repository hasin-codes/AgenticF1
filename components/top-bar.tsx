"use client"

import * as React from "react"
import { Bell, User, Settings, LogOut, Check } from "lucide-react"
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
import { useTelemetry } from "@/lib/telemetry-context"

// Types
interface F1Event {
    round: number
    event_name: string
    country: string
    location: string
    date: string
}

interface SessionMetadata {
    year: number
    gp: string
    session: string
    drivers: string[]
    total_laps: number
}

// Session type mapping
const SESSION_TYPES = [
    { id: "R", label: "Race" },
    { id: "Q", label: "Quali" },
    { id: "FP1", label: "FP1" },
    { id: "FP2", label: "FP2" },
    { id: "FP3", label: "FP3" },
]

// --- Top Bar Left: Context Controls ---

export function TopBarLeft({ className }: { className?: string }) {
    const { selection, updateSelection } = useTelemetry()

    // Local state for UI
    const [events, setEvents] = React.useState<F1Event[]>([])
    const [drivers, setDrivers] = React.useState<string[]>([])

    // Loading states
    const [loadingEvents, setLoadingEvents] = React.useState(false)
    const [loadingDrivers, setLoadingDrivers] = React.useState(false)

    const yearItems = [
        { id: "2024", label: "2024" },
        { id: "2023", label: "2023" },
        { id: "2022", label: "2022" },
        { id: "2021", label: "2021" },
        { id: "2020", label: "2020" },
        { id: "2019", label: "2019" },
        { id: "2018", label: "2018" },
    ]

    // Fetch events when year changes
    React.useEffect(() => {
        const fetchEvents = async () => {
            setLoadingEvents(true)
            updateSelection({ gp: null, selectedDrivers: [] })
            setDrivers([])

            try {
                const response = await fetch(`/api/telemetry/events?year=${selection.year}`)
                if (response.ok) {
                    const data = await response.json()
                    const raceEvents = data.events?.filter((e: F1Event) => e.round > 0) || []
                    setEvents(raceEvents)

                    if (raceEvents.length > 0) {
                        updateSelection({ gp: raceEvents[0].event_name })
                    }
                } else {
                    setEvents([])
                }
            } catch (error) {
                console.error('Error fetching events:', error)
                setEvents([])
            } finally {
                setLoadingEvents(false)
            }
        }

        fetchEvents()
    }, [selection.year])

    // Fetch drivers when GP or session changes
    React.useEffect(() => {
        if (!selection.gp) {
            setDrivers([])
            updateSelection({ selectedDrivers: [], totalLaps: 0 })
            return
        }

        const fetchDrivers = async () => {
            setLoadingDrivers(true)
            updateSelection({ selectedDrivers: [] })

            try {
                const response = await fetch(
                    `/api/telemetry/session?year=${selection.year}&gp=${encodeURIComponent(selection.gp || '')}&session=${selection.session}`
                )
                if (response.ok) {
                    const data: SessionMetadata = await response.json()
                    setDrivers(data.drivers || [])
                    updateSelection({ totalLaps: data.total_laps || 0 })
                } else {
                    setDrivers([])
                    updateSelection({ totalLaps: 0 })
                }
            } catch (error) {
                console.error('Error fetching drivers:', error)
                setDrivers([])
                updateSelection({ totalLaps: 0 })
            } finally {
                setLoadingDrivers(false)
            }
        }

        fetchDrivers()
    }, [selection.year, selection.gp, selection.session])

    // Convert events to dropdown items
    const gpItems = events.map(event => ({
        id: event.event_name,
        label: `${event.event_name}`,
    }))

    // Handle driver selection toggle
    const toggleDriver = (driverCode: string) => {
        const current = selection.selectedDrivers
        if (current.includes(driverCode)) {
            updateSelection({ selectedDrivers: current.filter(d => d !== driverCode) })
        } else {
            if (current.length >= 4) return
            updateSelection({ selectedDrivers: [...current, driverCode] })
        }
    }

    // Get driver display text
    const getDriverDisplayText = () => {
        if (loadingDrivers) return "Loading..."
        if (drivers.length === 0) return "No Drivers"
        if (selection.selectedDrivers.length === 0) return "Select Drivers"
        if (selection.selectedDrivers.length === 1) return selection.selectedDrivers[0]
        return `${selection.selectedDrivers.length} Drivers Selected`
    }

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
                    label={selection.year}
                    items={yearItems}
                    onChange={(item) => updateSelection({ year: String(item.id) })}
                    className="w-[100px]"
                />
            </div>

            <div className="h-8 w-px bg-white/10" />

            {/* GP Selector */}
            <div className="flex items-center">
                <BasicDropdown
                    label={loadingEvents ? "Loading..." : (selection.gp || "Select GP")}
                    items={gpItems}
                    onChange={(item) => updateSelection({ gp: String(item.id) })}
                    className="w-[220px]"
                />
            </div>

            <div className="h-8 w-px bg-white/10" />

            {/* Session Type Tabs */}
            <div className="flex bg-secondary/50 p-1 rounded-lg">
                {SESSION_TYPES.map((session) => (
                    <button
                        key={session.id}
                        onClick={() => updateSelection({ session: session.id })}
                        disabled={!selection.gp}
                        className={cn(
                            "px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200",
                            session.id === selection.session
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground hover:bg-white/5",
                            !selection.gp && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        {session.label}
                    </button>
                ))}
            </div>

            <div className="h-8 w-px bg-white/10" />

            {/* Drivers Multi-Select */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button
                        className={cn(
                            "h-9 px-4 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors",
                            "flex items-center justify-between gap-2 text-sm font-medium",
                            "border border-white/5",
                            (!selection.gp || drivers.length === 0) && "opacity-50 cursor-not-allowed"
                        )}
                        disabled={!selection.gp || drivers.length === 0}
                    >
                        <span className="truncate">{getDriverDisplayText()}</span>
                        {selection.selectedDrivers.length > 0 && (
                            <span className="text-xs text-muted-foreground font-normal">
                                ({selection.selectedDrivers.length}/4)
                            </span>
                        )}
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    className="w-[200px] max-h-[300px] overflow-y-auto bg-popover/95 backdrop-blur-xl border-white/10"
                    align="end"
                >
                    <DropdownMenuLabel className="text-xs text-muted-foreground">
                        Select Drivers (Max 4)
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-white/10" />
                    {drivers.map((driver) => (
                        <DropdownMenuItem
                            key={driver}
                            onClick={(e) => {
                                e.preventDefault()
                                toggleDriver(driver)
                            }}
                            className="flex items-center gap-3 cursor-pointer hover:bg-white/5 focus:bg-white/5"
                        >
                            <div className={cn(
                                "w-4 h-4 border-2 rounded flex items-center justify-center transition-all",
                                selection.selectedDrivers.includes(driver)
                                    ? "bg-primary border-primary"
                                    : "border-muted-foreground/50"
                            )}>
                                {selection.selectedDrivers.includes(driver) && (
                                    <Check className="h-3 w-3 text-primary-foreground" />
                                )}
                            </div>
                            <span className="font-mono font-semibold text-sm">{driver}</span>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
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
                "h-[72px] min-w-[360px] flex items-center justify-end gap-6 px-6 bg-card border border-white/5 rounded-[18px] floaty-shadow z-20",
                className
            )}
        >
            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative h-11 w-11 rounded-full hover:bg-white/5 text-muted-foreground hover:text-foreground transition-all duration-200">
                <Bell className="h-6 w-6" />
                <span className="absolute top-3 right-3 h-2.5 w-2.5 bg-destructive rounded-full border-2 border-card shadow-sm animate-pulse" />
            </Button>

            <div className="h-8 w-px bg-white/10" />

            {/* User Profile */}
            <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-[11px] font-bold text-white shadow-lg tracking-wide">
                        DEV MODE
                    </span>
                    <p className="text-sm font-semibold leading-none text-foreground">Hasin Raiyan</p>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-11 w-11 rounded-full ring-2 ring-white/5 hover:ring-white/20 transition-all">
                            <Avatar className="h-11 w-11 border border-white/10">
                                <AvatarImage src="/avatars/01.png" alt="@hasin" />
                                <AvatarFallback>HR</AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 bg-popover border-border" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">Hasin Raiyan</p>
                                <p className="text-xs leading-none text-muted-foreground">
                                    hasin@example.com
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
