"use client"

import * as React from "react"
import { Maximize2, Download, Activity } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Dropdown } from "@/components/ui/dropdown"
import { motion } from "framer-motion"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, ComposedChart, ReferenceLine } from "recharts"
import { useTelemetry } from "@/lib/telemetry-context"

interface SpeedTrace {
    driver: string
    team: string
    lap_number: number
    lap_time: number | null
    distance: number[]
    speed: number[]
    throttle: number[]
    brake: boolean[] | number[]
    color: string
}

interface SpeedData {
    traces: SpeedTrace[]
    max_distance: number
    delta: {
        distance: number[]
        delta: number[]
        driver1: string
        driver2: string
    } | null
    circuit_info?: {
        corners: { Number: number; Distance: number }[]
        rotation: number
    }
    session_info: {
        year: number
        gp: string
        session: string
    }
}

export function TelemetryPanel({ className }: { className?: string }) {
    const { selection } = useTelemetry()
    const [speedData, setSpeedData] = React.useState<SpeedData | null>(null)
    const [loading, setLoading] = React.useState(false)
    const [lapType, setLapType] = React.useState<string>("fastest")
    const [specificLap, setSpecificLap] = React.useState<number>(1)
    const [chartData, setChartData] = React.useState<any[]>([])
    const [deltaData, setDeltaData] = React.useState<any[]>([])

    // Fetch speed telemetry when selection changes
    React.useEffect(() => {
        if (!selection.gp || selection.selectedDrivers.length === 0) {
            setSpeedData(null)
            return
        }

        const fetchSpeedData = async () => {
            setLoading(true)
            try {
                const driversParam = selection.selectedDrivers.join(',')
                const lapParam = lapType === 'specific' ? `&lap=${specificLap}` : ''

                const response = await fetch(
                    `/api/telemetry/speed?year=${selection.year}&gp=${encodeURIComponent(selection.gp || '')}&session=${selection.session}&drivers=${driversParam}&lap_type=${lapType}${lapParam}`
                )

                if (response.ok) {
                    const data: SpeedData = await response.json()
                    setSpeedData(data)
                    processChartData(data)
                } else {
                    console.error('Failed to fetch speed data:', response.status)
                    setSpeedData(null)
                }
            } catch (error) {
                console.error('Error fetching speed data:', error)
                setSpeedData(null)
            } finally {
                setLoading(false)
            }
        }

        fetchSpeedData()
    }, [selection.year, selection.gp, selection.session, selection.selectedDrivers, lapType, specificLap])

    // Process data for charts
    const processChartData = (data: SpeedData) => {
        if (!data.traces.length) return

        // Find max length for interpolation
        const maxPoints = Math.max(...data.traces.map(t => t.distance.length))
        const numPoints = Math.min(maxPoints, 500) // Limit for performance

        // Create combined chart data
        const combined: any[] = []

        for (let i = 0; i < numPoints; i++) {
            const point: any = {}

            data.traces.forEach((trace, idx) => {
                const interpolatedIdx = Math.floor((i / numPoints) * trace.distance.length)
                point[`distance_${idx}`] = trace.distance[interpolatedIdx] || 0
                point[`speed_${trace.driver}`] = trace.speed[interpolatedIdx] || 0
                point[`throttle_${trace.driver}`] = trace.throttle ? (trace.throttle[interpolatedIdx] || 0) : 0
                // Handle brake as boolean or number (0-100)
                const brakeVal = trace.brake ? trace.brake[interpolatedIdx] : 0
                point[`brake_${trace.driver}`] = typeof brakeVal === 'boolean' ? (brakeVal ? 100 : 0) : (brakeVal || 0)
            })

            // Use first driver's distance as x-axis
            point.distance = data.traces[0].distance[Math.floor((i / numPoints) * data.traces[0].distance.length)] || 0

            combined.push(point)
        }

        setChartData(combined)

        // Process delta data if available
        if (data.delta) {
            const deltaPoints = data.delta.distance.map((dist, idx) => ({
                distance: dist,
                delta: data.delta!.delta[idx]
            }))
            setDeltaData(deltaPoints)
        } else {
            setDeltaData([])
        }
    }

    const getDriversDisplay = () => {
        if (!speedData || speedData.traces.length === 0) return "No Data"
        return speedData.traces.map(t => t.driver).join(' vs ')
    }

    const getLapInfo = () => {
        if (!speedData || speedData.traces.length === 0) return ""
        if (lapType === 'fastest') {
            return `Fastest Laps`
        }
        return `Lap ${specificLap}`
    }

    // Helper to render corner lines
    const renderCornerLines = () => {
        if (!speedData?.circuit_info?.corners) return null
        return speedData.circuit_info.corners.map((corner) => (
            <ReferenceLine
                key={corner.Number}
                x={corner.Distance}
                stroke="#333"
                strokeDasharray="3 3"
                label={{
                    value: `T${corner.Number}`,
                    position: 'insideTop',
                    fill: '#666',
                    fontSize: 10,
                    dy: 10
                }}
            />
        ))
    }

    return (
        <motion.div
            className={cn(
                "flex flex-col h-full bg-card rounded-[20px] floaty-shadow overflow-hidden z-10",
                className
            )}
        >
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, delay: 0.5 }}
                className="flex flex-col h-full"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/5 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Activity className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold">Telemetry Analysis</h3>
                            <p className="text-xs text-muted-foreground">
                                {loading ? "Loading..." : `${getLapInfo()} • ${getDriversDisplay()}`}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Lap Type Selector */}
                        <Dropdown
                            value={lapType}
                            onValueChange={setLapType}
                            options={[
                                { value: "fastest", label: "Fastest Lap" },
                                { value: "specific", label: "Specific Lap" }
                            ]}
                            className="w-[120px] text-xs bg-secondary/50 border-white/10"
                            size="sm"
                        />

                        {/* Specific Lap Number (shown when lap_type is specific) */}
                        {lapType === 'specific' && selection.totalLaps > 0 && (
                            <Dropdown
                                value={String(specificLap)}
                                onValueChange={(v) => setSpecificLap(Number(v))}
                                options={Array.from({ length: Math.min(selection.totalLaps, 100) }, (_, i) => i + 1).map(lap => ({
                                    value: String(lap),
                                    label: `Lap ${lap}`
                                }))}
                                className="w-[100px] text-xs bg-secondary/50 border-white/10"
                                size="sm"
                                maxHeight="300px"
                            />
                        )}

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
                    {!selection.gp || selection.selectedDrivers.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center">
                            <p className="text-muted-foreground text-sm">
                                Select drivers from the top bar to view telemetry
                            </p>
                        </div>
                    ) : loading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="flex flex-col items-center gap-2">
                                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
                                <p className="text-muted-foreground text-sm">Loading telemetry data...</p>
                            </div>
                        </div>
                    ) : speedData && speedData.traces.length > 0 ? (
                        <>
                            {/* Top Section: Speed & Delta */}
                            <div className="flex flex-col gap-1 flex-[3] min-h-[300px]">
                                {/* Speed Graph */}
                                <div className="flex-[3] bg-secondary/10 rounded-t-xl border border-white/5 border-b-0 p-4 relative min-h-0">
                                    <div className="absolute top-2 left-4 z-10">
                                        <span className="text-xs font-bold text-muted-foreground uppercase">Speed (km/h)</span>
                                    </div>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
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
                                                formatter={(value: number) => [`${value.toFixed(1)} km/h`, '']}
                                                labelFormatter={(label) => `Distance: ${label.toFixed(0)}m`}
                                            />
                                            {renderCornerLines()}
                                            {speedData.traces.map((trace, idx) => (
                                                <Line
                                                    key={trace.driver}
                                                    type="monotone"
                                                    dataKey={`speed_${trace.driver}`}
                                                    stroke={trace.color}
                                                    strokeWidth={2}
                                                    dot={false}
                                                    name={trace.driver}
                                                />
                                            ))}
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Delta Graph */}
                                {deltaData.length > 0 && (
                                    <div className="flex-1 bg-secondary/10 rounded-b-xl border border-white/5 p-4 relative min-h-[100px]">
                                        <div className="absolute top-2 left-4 z-10">
                                            <span className="text-xs font-bold text-muted-foreground uppercase">
                                                Speed Delta ({speedData.delta?.driver1} - {speedData.delta?.driver2})
                                            </span>
                                        </div>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={deltaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                                                    formatter={(value: number) => [`${value > 0 ? '+' : ''}${value.toFixed(1)} km/h`, '']}
                                                />
                                                <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
                                                {renderCornerLines()}
                                                <Line type="monotone" dataKey="delta" stroke="#fbbf24" strokeWidth={2} dot={false} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </div>

                            {/* Bottom Section: Split Layout */}
                            <div className="flex-[2] grid grid-cols-2 gap-4 min-h-[250px]">
                                {/* Left: Empty Placeholder */}
                                <div className="bg-secondary/10 rounded-xl border border-white/5 p-4 flex items-center justify-center">
                                    <p className="text-muted-foreground text-sm">No Data Selected</p>
                                </div>

                                {/* Right: Throttle & Brake Graph */}
                                <div className="bg-secondary/10 rounded-xl border border-white/5 p-4 relative min-h-0">
                                    <div className="absolute top-2 left-4 z-10 flex gap-4">
                                        <span className="text-xs font-bold text-[#0090FF] uppercase">Throttle %</span>
                                        <span className="text-xs font-bold text-[#FF3B30] uppercase">Brake</span>
                                    </div>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ComposedChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                            <XAxis dataKey="distance" hide />
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
                                                formatter={(value: number, name: string) => {
                                                    if (name.includes('brake')) return [`${value > 0 ? 'ON' : 'OFF'}`, 'Brake']
                                                    if (name.includes('throttle')) return [`${value.toFixed(0)}%`, 'Throttle']
                                                    return [value, name]
                                                }}
                                                labelFormatter={(label) => `Distance: ${label.toFixed(0)}m`}
                                            />
                                            {renderCornerLines()}
                                            {speedData.traces.map((trace) => (
                                                <React.Fragment key={trace.driver}>
                                                    {/* Brake Area - Driver Color with Opacity */}
                                                    <Area
                                                        type="step"
                                                        dataKey={`brake_${trace.driver}`}
                                                        fill={trace.color}
                                                        fillOpacity={0.1}
                                                        stroke={trace.color}
                                                        strokeWidth={1}
                                                        strokeDasharray="3 3"
                                                        name={`brake_${trace.driver}`}
                                                    />
                                                    {/* Throttle Line - Driver Color */}
                                                    <Line
                                                        type="monotone"
                                                        dataKey={`throttle_${trace.driver}`}
                                                        stroke={trace.color}
                                                        strokeWidth={2}
                                                        dot={false}
                                                        name={`throttle_${trace.driver}`}
                                                    />
                                                </React.Fragment>
                                            ))}
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <p className="text-muted-foreground text-sm">No telemetry data available</p>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    )
}
