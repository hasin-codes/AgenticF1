"use client"

import * as React from "react"
import { Maximize2, Download, MoreHorizontal, Activity } from "lucide-react"
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
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts"

// Mock Data
const speedData = Array.from({ length: 50 }, (_, i) => ({
    distance: i * 100,
    ver: 200 + Math.sin(i * 0.2) * 100 + Math.random() * 10,
    lec: 195 + Math.sin(i * 0.2) * 102 + Math.random() * 10,
}))

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
            <div className="flex items-center justify-between p-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Activity className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold">Speed Trace</h3>
                        <p className="text-xs text-muted-foreground">Lap 34 • Turn 8 Analysis</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Select defaultValue="speed">
                        <SelectTrigger className="h-8 w-[120px] text-xs">
                            <SelectValue placeholder="Metric" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="speed">Speed</SelectItem>
                            <SelectItem value="throttle">Throttle</SelectItem>
                            <SelectItem value="brake">Brake</SelectItem>
                            <SelectItem value="gear">Gear</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Maximize2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Main Chart Area */}
            <div className="flex-1 p-4 min-h-0">
                <div className="h-full w-full bg-secondary/20 rounded-xl border border-white/5 p-4 relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={speedData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                            <XAxis
                                dataKey="distance"
                                stroke="#666"
                                tick={{ fontSize: 10 }}
                                tickLine={false}
                                axisLine={false}
                            />
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
                            <Line
                                type="monotone"
                                dataKey="ver"
                                stroke="#0a84ff"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 4, strokeWidth: 0 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="lec"
                                stroke="#ff453a"
                                strokeWidth={2}
                                dot={false}
                                strokeDasharray="4 4"
                            />
                        </LineChart>
                    </ResponsiveContainer>

                    {/* Legend Overlay */}
                    <div className="absolute top-4 right-4 flex gap-4 bg-card/80 backdrop-blur-sm p-2 rounded-lg border border-white/5">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-[#0a84ff]" />
                            <span className="text-xs font-medium">VER</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-[#ff453a]" />
                            <span className="text-xs font-medium">LEC</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Secondary Charts / Stats */}
            <div className="h-[30%] border-t border-white/5 p-4 grid grid-cols-3 gap-4">
                <div className="bg-secondary/20 rounded-xl p-3 border border-white/5">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Min Speed</p>
                    <div className="flex items-end justify-between">
                        <span className="text-xl font-bold">142 <span className="text-xs font-normal text-muted-foreground">km/h</span></span>
                        <span className="text-xs text-red-500 font-medium">-5.2</span>
                    </div>
                </div>
                <div className="bg-secondary/20 rounded-xl p-3 border border-white/5">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Throttle App</p>
                    <div className="flex items-end justify-between">
                        <span className="text-xl font-bold">100 <span className="text-xs font-normal text-muted-foreground">%</span></span>
                        <span className="text-xs text-green-500 font-medium">+0.1s</span>
                    </div>
                </div>
                <div className="bg-secondary/20 rounded-xl p-3 border border-white/5">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Brake Dist</p>
                    <div className="flex items-end justify-between">
                        <span className="text-xl font-bold">85 <span className="text-xs font-normal text-muted-foreground">m</span></span>
                        <span className="text-xs text-muted-foreground font-medium">--</span>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
