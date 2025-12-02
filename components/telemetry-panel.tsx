"use client"

import * as React from "react"
import { Maximize2, Download, Activity } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { motion } from "framer-motion"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, ComposedChart } from "recharts"

// Generate realistic-looking telemetry data
const generateTelemetryData = () => {
    const data = []
    let speed = 280
    let distance = 0

    for (let i = 0; i <= 100; i++) {
        distance += 50

        // Simulate a lap with corners
        // Straight
        if (i < 20) {
            speed = Math.min(340, speed + 2)
        }
        // Braking Zone
        else if (i < 30) {
            speed = Math.max(80, speed - 15)
        }
        // Corner
        else if (i < 40) {
            speed = Math.max(80, speed + (Math.random() - 0.5) * 5)
        }
        // Acceleration
        else if (i < 60) {
            speed = Math.min(320, speed + 8)
        }
        // Another corner sequence
        else if (i < 70) {
            speed = Math.max(120, speed - 10)
        }
        else {
            speed = Math.min(330, speed + 4)
        }

        data.push({
            distance,
            speed: speed + (Math.random() * 2),
            speedOpponent: speed - 2 + (Math.random() * 2),
            delta: Math.sin(i * 0.1) * 0.4,
            throttle: i > 20 && i < 40 ? 0 : (i > 65 && i < 70 ? 50 : 100),
            brake: i > 20 && i < 30 ? 100 : (i > 65 && i < 68 ? 40 : 0),
        })
    }
    return data
}

const telemetryData = generateTelemetryData()

export function TelemetryPanel({ className }: { className?: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn(
                "flex flex-col h-full bg-card rounded-[20px] floaty-shadow overflow-hidden z-10",
                className
            )}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Activity className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold">Telemetry Analysis</h3>
                        <p className="text-xs text-muted-foreground">Lap 34 • VER vs LEC</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Select defaultValue="all">
                        <SelectTrigger className="h-8 w-[120px] text-xs bg-secondary/50 border-white/10">
                            <SelectValue placeholder="View" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Channels</SelectItem>
                            <SelectItem value="speed">Speed Only</SelectItem>
                            <SelectItem value="inputs">Inputs Only</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/5">
                        <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/5">
                        <Maximize2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-h-0 p-4 gap-4 overflow-y-auto">

                {/* Top Section: Speed & Delta (Combined visual group) */}
                <div className="flex flex-col gap-1 flex-[3] min-h-[300px]">
                    {/* Speed Graph */}
                    <div className="flex-[3] bg-secondary/10 rounded-t-xl border border-white/5 border-b-0 p-4 relative min-h-0">
                        <div className="absolute top-2 left-4 z-10">
                            <span className="text-xs font-bold text-muted-foreground uppercase">Speed (km/h)</span>
                        </div>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={telemetryData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                <XAxis dataKey="distance" hide />
                                <YAxis
                                    stroke="#666"
                                    tick={{ fontSize: 10 }}
                                    tickLine={false}
                                    axisLine={false}
                                    domain={['auto', 'auto']}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1c1c1e', borderColor: '#333', borderRadius: '8px' }}
                                    itemStyle={{ fontSize: '12px' }}
                                />
                                <Line type="monotone" dataKey="speed" stroke="#0a84ff" strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="speedOpponent" stroke="#ff453a" strokeWidth={2} dot={false} strokeDasharray="4 4" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Delta Graph */}
                    <div className="flex-1 bg-secondary/10 rounded-b-xl border border-white/5 p-4 relative min-h-[100px]">
                        <div className="absolute top-2 left-4 z-10">
                            <span className="text-xs font-bold text-muted-foreground uppercase">Delta (s)</span>
                        </div>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={telemetryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                <XAxis dataKey="distance" hide />
                                <YAxis
                                    stroke="#666"
                                    tick={{ fontSize: 10 }}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1c1c1e', borderColor: '#333', borderRadius: '8px' }}
                                    itemStyle={{ fontSize: '12px' }}
                                />
                                <Line type="monotone" dataKey="delta" stroke="#fbbf24" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Bottom Section: Split View */}
                <div className="flex-[2] grid grid-cols-2 gap-4 min-h-[200px]">

                    {/* Left: Empty (as requested) */}
                    <div className="bg-secondary/5 rounded-xl border border-white/5 flex items-center justify-center">
                        <span className="text-muted-foreground/20 text-sm font-medium">No Data Selected</span>
                    </div>

                    {/* Right: Throttle & Brake */}
                    <div className="bg-secondary/10 rounded-xl border border-white/5 p-4 relative">
                        <div className="absolute top-2 left-4 z-10 flex gap-4">
                            <span className="text-xs font-bold text-[#0a84ff] uppercase">Throttle %</span>
                            <span className="text-xs font-bold text-[#ff453a] uppercase">Brake</span>
                        </div>
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={telemetryData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                <XAxis dataKey="distance" stroke="#666" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                                <YAxis
                                    stroke="#666"
                                    tick={{ fontSize: 10 }}
                                    tickLine={false}
                                    axisLine={false}
                                    domain={[0, 100]}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1c1c1e', borderColor: '#333', borderRadius: '8px' }}
                                    itemStyle={{ fontSize: '12px' }}
                                />
                                <Line type="step" dataKey="throttle" stroke="#0a84ff" strokeWidth={2} dot={false} />
                                <Area type="step" dataKey="brake" fill="#ff453a" stroke="#ff453a" fillOpacity={0.3} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </motion.div>
    )
}
