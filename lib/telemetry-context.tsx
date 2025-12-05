"use client"

import React, { createContext, useContext, useState, ReactNode, useCallback, useRef } from 'react'

// Types
export interface TelemetrySelection {
    year: string | null
    gp: string | null
    session: string
    selectedDrivers: string[]
    totalLaps: number
}

interface TelemetryContextType {
    selection: TelemetrySelection
    updateSelection: (updates: Partial<TelemetrySelection>) => void
}

const TelemetryContext = createContext<TelemetryContextType | undefined>(undefined)

export function TelemetryProvider({ children }: { children: ReactNode }) {
    const [selection, setSelection] = useState<TelemetrySelection>({
        year: null,
        gp: null,
        session: 'R',
        selectedDrivers: [],
        totalLaps: 0,
    })

    // Use a ref to track the previous selection state
    const prevSelectionRef = useRef<string | null>(null)

    const updateSelection = useCallback((updates: Partial<TelemetrySelection>) => {
        setSelection(prev => {
            const newSelection = { ...prev, ...updates }
            const newSelectionStr = JSON.stringify(newSelection)

            // Only update if the selection actually changed
            if (newSelectionStr !== prevSelectionRef.current) {
                prevSelectionRef.current = newSelectionStr
                return newSelection
            }

            return prev
        })
    }, [])

    return (
        <TelemetryContext.Provider value={{ selection, updateSelection }}>
            {children}
        </TelemetryContext.Provider>
    )
}

export function useTelemetry() {
    const context = useContext(TelemetryContext)
    if (!context) {
        throw new Error('useTelemetry must be used within TelemetryProvider')
    }
    return context
}
